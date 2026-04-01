#!/bin/bash
# ================================================================
# SOMIAR DE DIA - Self-Improvement + Auto-Execute Safe Actions
# Window: 9:00 - 20:00 | Every 30 min if inactive
# Auto-executes safe ops, logs everything, creates inbox for decisions
# ================================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/somiar-de-dia.log"
INACTIVITY_THRESHOLD=30

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-DIA] $1" | tee -a "$LOG_FILE" > /dev/null 2>&1; }
log_auto() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-DIA][AUTO] $1" | tee -a "$LOG_FILE" > /dev/null 2>&1; }

mkdir -p "$WORKSPACE/.somiar-cycles"

log "=== Starting ==="

# ─── Time Window ────────────────────────────────────────────────
HOUR=$(date +%H)
if [ "$HOUR" -lt 9 ] || [ "$HOUR" -ge 20 ]; then
  log "Outside 9:00-20:00 window. Skipping."
  exit 0
fi

# ─── Inactivity Check ───────────────────────────────────────────
if [ -f "$WORKSPACE/.sessions/recent.json" ]; then
  age=$(($(date +%s) - $(stat -c %Y "$WORKSPACE/.sessions/recent.json" 2>/dev/null || echo "0")))
  if [ "$age" -lt $((INACTIVITY_THRESHOLD * 60)) ]; then
    log "Recent user activity. Skipping."
    exit 0
  fi
fi

# ─── Python: Gather System Data ─────────────────────────────────
SYS_DATA=$(python3 << 'PYEOF'
import subprocess, json, urllib.request

d = {}

try:
    r = subprocess.run(['npx', 'pm2', 'jlist'], capture_output=True, text=True, timeout=10)
    ps = json.loads(r.stdout)
    navi = [p for p in ps if 'navi' in p.get('name','').lower() or 'vite' in p.get('name','')]
    d['pm2'] = [{'name': p['name'], 'status': p.get('pm2_env',{}).get('status','?'), 'uptime_min': p.get('pm_uptime',0)//60, 'mem_mb': p.get('mon_dot',{}).get('memory',0)//1024//1024} for p in navi]
    d['pm2_total_mem'] = sum(p['mem_mb'] for p in d['pm2'])
except:
    d['pm2'] = []

try:
    with urllib.request.urlopen('http://localhost:3001/api/ai-status', timeout=3) as resp:
        ai = json.loads(resp.read())
        d['ai_status'] = ai.get('status','?')
        d['ai_model'] = ai.get('model','?')
except:
    d['ai_status'] = 'DOWN'
    d['ai_model'] = '?'

try:
    with urllib.request.urlopen('http://localhost:3001/api/cron-health', timeout=3) as resp:
        crons = json.loads(resp.read()).get('jobs', [])
        d['cron_failed'] = sum(1 for j in crons if j.get('status') == 'failed')
        d['cron_healthy'] = sum(1 for j in crons if j.get('status') == 'healthy')
        d['cron_total'] = len(crons)
        d['failed_crons'] = [{'name': j.get('nameLabel', j.get('name','?')), 'id': j.get('id','?')} for j in crons if j.get('status') == 'failed']
except:
    d['cron_failed'] = 0
    d['failed_crons'] = []

try:
    with urllib.request.urlopen('http://localhost:3001/api/pm-board', timeout=3) as resp:
        tasks = json.loads(resp.read()).get('tasks', [])
        d['tasks_total'] = len(tasks)
        d['tasks_done'] = sum(1 for t in tasks if t.get('status') == 'done')
        d['tasks_pending'] = d['tasks_total'] - d['tasks_done']
except:
    d['tasks_total'] = 0
    d['tasks_pending'] = 0

try:
    r = subprocess.run(['git', 'status', '--short'], cwd='/home/user/.openclaw/workspace', capture_output=True, text=True, timeout=5)
    changes = [l for l in r.stdout.strip().split('\n') if l]
    d['git_changes'] = len(changes)
    d['git_files'] = changes
except:
    d['git_changes'] = 0
    d['git_files'] = []

print(json.dumps(d))
PYEOF
)

# Parse
ai_status=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ai_status','?'))" 2>/dev/null)
ai_model=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ai_model','?'))" 2>/dev/null)
tasks_pending=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tasks_pending','?'))" 2>/dev/null)
cron_failed=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('cron_failed','?'))" 2>/dev/null)
git_changes=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('git_changes','?'))" 2>/dev/null)
pm2_mem=$(echo "$SYS_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pm2_total_mem','?'))" 2>/dev/null)

# ─── AUTO-EXECUTE SAFE ACTIONS ─────────────────────────────────
# These are safe, reversible, no-user-data-affecting actions

AUTO_ACTIONS=""

# 1. If PM2 mem > 600MB → restart navi-os to free memory (safe)
if [ "$pm2_mem" -gt 600 ] 2>/dev/null; then
  log_auto "High memory (${pm2_mem}MB). Restarting navi-os services..."
  cd "$WORKSPACE/navi-os" && npx pm2 restart vite 2>/dev/null && npx pm2 restart navi-os-api 2>/dev/null
  AUTO_ACTIONS="${AUTO_ACTIONS}- SAM: PM2 mem was ${pm2_mem}MB > 600MB → auto-restarted navi-os services"
  log_auto "Restart done."
fi

# 2. If AI status DOWN → restart the API (critical for operations)
if [ "$ai_status" = "DOWN" ] || [ "$ai_status" = "?" ]; then
  log_auto "AI status DOWN. Restarting navi-os-api..."
  cd "$WORKSPACE/navi-os" && npx pm2 restart navi-os-api 2>/dev/null
  AUTO_ACTIONS="${AUTO_ACTIONS}
- SAM: AI API was DOWN → auto-restarted navi-os-api"
  log_auto "AI API restart done."
fi

# 3. If 0 git changes and last backup > 2h ago → auto-backup (safe)
if [ "$git_changes" -eq 0 ] 2>/dev/null; then
  last_backup_age=$(find "$WORKSPACE/backups" -name "*.tar.gz" -mmin +120 2>/dev/null | wc -l)
  if [ "$last_backup_age" -gt 0 ]; then
    log_auto "No recent backup found. Running backup..."
    bash "$WORKSPACE/scripts/01-repo-backup.sh" > /dev/null 2>&1
    AUTO_ACTIONS="${AUTO_ACTIONS}
- JEFF: Auto-backup executed (no recent backup found)"
    log_auto "Backup done."
  fi
fi

# 4. If cron failures detected → log them (no auto-fix, needs review)
if [ "$cron_failed" -gt 0 ] 2>/dev/null; then
  failed_list=$(echo "$SYS_DATA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for f in d.get('failed_crons',[]):
    print(f\"- {f['name']}\")
" 2>/dev/null)
  AUTO_ACTIONS="${AUTO_ACTIONS}
- WARREN: ${cron_failed} crons failed (CANVI DE CATEGORY - needs review):
${failed_list}"
fi

# ─── Chiefs MEMORY data (via Python) ───────────────────────────
chiefs_data=$(python3 << 'PYEOF'
import re, os

def get_emoji(chief_dir):
    for fname in ['IDENTITY.md', 'SOUL.md', 'MEMORY.md']:
        path = os.path.join(chief_dir, fname)
        if os.path.exists(path):
            with open(path) as f:
                c = f.read()
            m = re.search(r'([\U0001F300-\U0001F9FF\u2600-\u26FF\u2700-\u27BF])', c)
            if m:
                return m.group(1)
    return '?'

def get_projects(mem_path):
    if not os.path.exists(mem_path):
        return ''
    with open(mem_path) as f:
        content = f.read()
    
    # Try table format first
    proj_match = re.search(r'## Active Projects\n(.+?)(?=^## |\Z)', content, re.DOTALL | re.MULTILINE)
    if proj_match:
        lines = []
        for line in proj_match.group(1).split('\n'):
            # Skip header, separator, empty
            if '| Project |' in line or '|------' in line or not line.strip():
                continue
            if line.startswith('|'):
                lines.append(line)
        if lines:
            return '\n'.join(lines)
    
    # Try bullet format (ELOM style)
    proj_match = re.search(r'## Active Projects\n(.+?)(?=^## |\Z)', content, re.DOTALL | re.MULTILINE)
    if proj_match:
        section = proj_match.group(1)
        # Extract ### Project X lines
        items = re.findall(r'### Projecte \d+: (.+)', section)
        if items:
            return '\n'.join(f'- {item}' for item in items)
    return ''

chiefs_data = ""
for chief in ['elom', 'warren', 'jeff', 'sam']:
    chief_dir = f'/home/user/.openclaw/workspace/team/{chief}'
    emoji = get_emoji(chief_dir)
    projects = get_projects(os.path.join(chief_dir, 'MEMORY.md'))
    chiefs_data += f"\n### {emoji} {chief.upper()}"
    if projects.strip():
        chiefs_data += f"\n{projects.strip()}\n"
    else:
        chiefs_data += "\n_Sense projectes actius_\n"
print(chiefs_data.rstrip())
PYEOF
)

# ─── Generate Report ────────────────────────────────────────────
CYCLE_ID="SD-$(date +%Y%m%d-%H%M)"
OUTPUT_FILE="$WORKSPACE/.somiar-cycles/somiar-de-dia-$CYCLE_ID.md"

cat > "$OUTPUT_FILE" << EOF
# Somiar de Dia - Self-Improvement Cycle
**ID:** $CYCLE_ID
**Time:** $(date '+%Y-%m-%d %H:%M:%S')
**Window:** 9:00 - 20:00
**Trigger:** Inactivity (>${INACTIVITY_THRESHOLD} min no user activity)
**Auto-executed:** $([ -n "$AUTO_ACTIONS" ] && echo "YES" || echo "NONE")

---

## System Health

| Component | Status |
|-----------|--------|
| Navi OS | $(echo "$SYS_DATA" | python3 -c "import sys,json; ps=json.load(sys.stdin).get('pm2',[]); print('ONLINE' if any(p.get('status')=='online' for p in ps) else 'OFFLINE')" 2>/dev/null || echo '?') |
| AI Status | ${ai_status} (${ai_model:-?}) |
| PM Board | ${tasks_pending:-0} pendents |
| Crons | ${cron_failed:-0} fallits / $(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cron_healthy','?'))" 2>/dev/null) healthy |

---

## Chiefs Status

${chiefs_data}

---

## Auto-Executed Actions

${AUTO_ACTIONS:-_Cap accio auto-executada (sistema sa)_}

---

## Proposals (requereixen la teva decisiо)

| Priority | Owner | Proposta |
|----------|-------|----------|
$(if [ "$git_changes" -gt 0 ] 2>/dev/null; then
  echo "| Alta | WARREN | Hi ha $git_changes canvis sense commit - vols que faci backup? |"
fi)
$(if [ "$cron_failed" -gt 0 ] 2>/dev/null; then
  echo "| Alta | WARREN | Revisar ${cron_failed} crons fallits - alguns poden necessitar el teu token API |"
fi)
$(if [ "$tasks_pending" -gt 10 ] 2>/dev/null; then
  echo "| Mitja | JEFF | ${tasks_pending} tasques pendents al PM Board - cal fer cleanup? |"
fi)

_Cap proposta_ _(sistema operatiu)_

---

*Generated by Somiar de Dia · $(date '+%Y-%m-%d %H:%M:%S')*
EOF

log "Report: $OUTPUT_FILE"

# ─── Create Inbox Entry for Aleix ───────────────────────────────
# Only for items that need Aleix's decision
if [ "$git_changes" -gt 0 ] || [ "$cron_failed" -gt 0 ] 2>/dev/null; then
  body_parts=""
  [ "$git_changes" -gt 0 ] && body_parts="${body_parts}Git: $git_changes canvis pendents. "
  [ "$cron_failed" -gt 0 ] && body_parts="${body_parts}Crons: $cron_failed fallits."
  
  curl -s -X POST http://localhost:3001/api/inbox \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"improvement\",\"title\":\"[Somiar] $(date '+%d/%m %H:%M') - Decisions pendents\",\"body\":\"$body_parts\",\"tags\":[\"somiar\",\"auto\",\"decision\"],\"source\":\"somiar-de-dia\"}" \
    > /dev/null 2>&1 || true
fi

# ─── Log to Obsidian ───────────────────────────────────────────
curl -s -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"somiar\",\"title\":\"Somiar de Dia $CYCLE_ID\",\"body\":\"Cicle executat. AI=${ai_status}, Tasks=${tasks_pending}, Crons=${cron_failed}, Git=${git_changes}. Auto-accions: ${AUTO_ACTIONS:-cap}\",\"tags\":[\"somiar\",\"dia\"],\"source\":\"somiar-de-dia\",\"metadata\":{\"ai_status\":\"${ai_status}\",\"tasks_pending\":\"${tasks_pending}\",\"cron_failed\":\"${cron_failed}\",\"git_changes\":\"${git_changes}\"}}" \
  > /dev/null 2>&1 || true

echo "$(date -Iseconds)" > "$WORKSPACE/.somiar-de-dia.last"
log "=== Done ==="
