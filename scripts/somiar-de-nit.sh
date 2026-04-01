#!/bin/bash
# ================================================================
# SOMIAR DE NIT - Deep Self-Improvement + Auto-Execute
# Window: 20:00 - 06:00 | Every 30 min if inactive
# ================================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/somiar-de-nit.log"
INACTIVITY_THRESHOLD=30

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-NIT] $1" | tee -a "$LOG_FILE" > /dev/null 2>&1; }

mkdir -p "$WORKSPACE/.somiar-cycles"

log "=== Starting ==="

HOUR=$(date +%H)
if [ "$HOUR" -lt 20 ] && [ "$HOUR" -ge 6 ]; then
  log "Outside 20:00-06:00 window. Skipping."
  exit 0
fi

# Run deep cycle
run_deep_cycle() {
  CYCLE_ID="SN-$(date +%Y%m%d-%H%M)"
  log "Deep Cycle: $CYCLE_ID"
  
  OUTPUT_FILE="$WORKSPACE/.somiar-cycles/somiar-de-nit-$CYCLE_ID.md"
  
  # ─── Gather system data ───────────────────────────────────────
  SYS_DATA=$(python3 << 'PYEOF'
import subprocess, json, urllib.request

d = {}

try:
    r = subprocess.run(['npx', 'pm2', 'jlist'], capture_output=True, text=True, timeout=10)
    ps = json.loads(r.stdout)
    d['services'] = [{'name': p['name'], 'status': p.get('pm2_env',{}).get('status','?'),
        'uptime_h': p.get('pm_uptime',0)//3600,
        'mem_mb': p.get('mon_dot',{}).get('memory',0)//1024//1024,
        'cpu': p.get('mon_dot',{}).get('cpu',0)} for p in ps if any(x in p.get('name','') for x in ['navi','vite','api'])]
    d['total_mem'] = sum(p['mem_mb'] for p in d['services'])
except:
    d['services'] = []

try:
    with urllib.request.urlopen('http://localhost:3001/api/cron-health', timeout=3) as resp:
        crons = json.loads(resp.read()).get('jobs', [])
        d['cron_failed'] = sum(1 for j in crons if j.get('status') == 'failed')
        d['cron_healthy'] = sum(1 for j in crons if j.get('status') == 'healthy')
        d['failed_crons'] = [{'name': j.get('nameLabel', j.get('name','?')), 'last': j.get('lastRun','?')} for j in crons if j.get('status') == 'failed']
except:
    d['cron_failed'] = 0
    d['failed_crons'] = []

try:
    with urllib.request.urlopen('http://localhost:3001/api/ai-status', timeout=3) as resp:
        ai = json.loads(resp.read())
        d['ai_status'] = ai.get('status','?')
        d['ai_model'] = ai.get('model','?')
        d['ai_skills'] = len(ai.get('skills',[]))
except:
    d['ai_status'] = 'DOWN'
    d['ai_model'] = '?'
    d['ai_skills'] = 0

try:
    r = subprocess.run(['git', 'status', '--short'], cwd='/home/user/.openclaw/workspace', capture_output=True, text=True, timeout=5)
    d['git_changes'] = len(r.stdout.strip().split('\n')) if r.stdout.strip() else 0
except:
    d['git_changes'] = 0

# Chiefs
d['chiefs'] = {}
for chief in ['elom','warren','jeff','sam']:
    mem_path = f'/home/user/.openclaw/workspace/team/{chief}/MEMORY.md'
    try:
        with open(mem_path) as f:
            content = f.read()
        import re
        emoji = re.search(r'"emoji": "([^"]+)"', content)
        d['chiefs'][chief] = {
            'emoji': emoji.group(1) if emoji else '?',
            'updated': None
        }
        # Last modification
        import os
        d['chiefs'][chief]['updated'] = str(os.path.getmtime(mem_path))[:10]
    except:
        d['chiefs'][chief] = {'emoji': '?', 'updated': None}

print(json.dumps(d))
PYEOF
)
  
  # ─── Auto-execute safe night actions ─────────────────────────
  AUTO=""
  
  # High memory → restart services (night safe)
  total_mem=$(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total_mem',0))" 2>/dev/null)
  if [ "$total_mem" -gt 800 ] 2>/dev/null; then
    log "High mem (${total_mem}MB). Restarting services..."
    cd "$WORKSPACE/navi-os" && npx pm2 restart vite navi-os-api 2>/dev/null
    AUTO="${AUTO}- SAM: Mem alta (${total_mem}MB) → restart auto-executat"
  fi
  
  # AI down → restart (critical)
  ai_status=$(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ai_status','?'))" 2>/dev/null)
  if [ "$ai_status" = "DOWN" ] 2>/dev/null; then
    log "AI down. Restarting..."
    cd "$WORKSPACE/navi-os" && npx pm2 restart navi-os-api 2>/dev/null
    AUTO="${AUTO}
- SAM: AI DOWN → restart auto-executat"
  fi
  
  # Backup if dirty git
  git_changes=$(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('git_changes',0))" 2>/dev/null)
  if [ "$git_changes" -gt 0 ] 2>/dev/null; then
    log "Dirty git ($git_changes changes). Committing..."
    cd "$WORKSPACE"
    git add -A
    git commit -m "Night auto-commit $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
    git push 2>/dev/null
    AUTO="${AUTO}
- JEFF: $git_changes canvis auto-commited i pujats"
  fi
  
  # Generate deep analysis report
  cat > "$OUTPUT_FILE" << EOF
# Somiar de Nit - Deep Improvement Cycle
**ID:** $CYCLE_ID
**Time:** $(date '+%Y-%m-%d %H:%M:%S')
**Window:** 20:00 - 06:00
**Auto-executed:** $([ -n "$AUTO" ] && echo "YES" || echo "NONE")

---

## System State

| Service | Status | Uptime | Mem |
|---------|--------|--------|-----|
$(echo "$SYS_DATA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for s in d.get('services',[]):
    print(f\"| {s['name']} | {s['status']} | {s['uptime_h']}h | {s['mem_mb']}MB |\")
" 2>/dev/null)

---

## AI System

| Field | Value |
|-------|-------|
| Status | ${ai_status} |
| Model | $(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ai_model','?'))" 2>/dev/null) |
| Skills | $(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ai_skills',0))" 2>/dev/null) |

---

## Cron Health

| Metric | Value |
|--------|-------|
| Healthy | $(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cron_healthy',0))" 2>/dev/null) |
| Failed | $(echo "$SYS_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cron_failed',0))" 2>/dev/null) |

---

## Chiefs Memory Status

$(echo "$SYS_DATA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for chief, info in d.get('chiefs',{}).items():
    print(f\"- **{chief.upper()}** ({info['emoji']}): updated {info.get('updated','?')}\")
" 2>/dev/null)

---

## Auto-Executed Actions

${AUTO:-_Cap accio auto-executada_}

---

## Night Analysis

**$(date '+%A, %d de %B %Y')** — Anàlisi nocturna a les $(date '+%H:%M')

Observacions:
$(if [ "$total_mem" -gt 800 ] 2>/dev/null; then echo "- ⚠️ Memòria alta: ${total_mem}MB"; else echo "- ✅ Memòria normal"; fi)
$(if [ "$ai_status" = "connected" ] 2>/dev/null; then echo "- ✅ AI connectada"; else echo "- ⚠️ AI no connectada"; fi)
$(if [ "$git_changes" -gt 0 ] 2>/dev/null; then echo "- ⚠️ $git_changes canvis pendents de commit"; else echo "- ✅ Git net"; fi)

---

*Generated by Somiar de Nit · $(date '+%Y-%m-%d %H:%M:%S')*
EOF

  log "Report: $OUTPUT_FILE"
  
  # ─── Log to Obsidian ────────────────────────────────────────
  curl -s -X POST http://localhost:3001/api/logs \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"somiar\",\"title\":\"Somiar de Nit $CYCLE_ID\",\"body\":\"Deep cycle. Mem=${total_mem}MB AI=${ai_status} Crons=$cron_failed Git=${git_changes}. Auto: ${AUTO:-cap}\",\"tags\":[\"somiar\",\"nit\",\"deep\"],\"source\":\"somiar-de-nit\",\"metadata\":{\"cycle\":\"$CYCLE_ID\"}}" \
    > /dev/null 2>&1 || true
  
  echo "$(date -Iseconds)" > "$WORKSPACE/.somiar-de-nit.last"
}

run_deep_cycle
log "=== Done ==="
