#!/bin/bash
# ================================================================
# SOMIAR DE DIA - Self-Improvement Standup (9:00 - 20:00)
# Every 30 min: if no user activity, run improvement cycle
# ================================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/somiar-de-dia.log"
LAST_RUN_FILE="$WORKSPACE/.somiar-de-dia.last"
INACTIVITY_THRESHOLD=30  # minutes

# ─── Logging ────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-DIA] $1" | tee -a "$LOG_FILE"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-DIA] ERROR: $1" | tee -a "$LOG_FILE" >&2; }

mkdir -p "$(dirname "$LOG_FILE")"

log "=== SOMIAR DE DIA - Starting check ==="

# ─── Time Window Check ──────────────────────────────────────────
HOUR=$(date +%H)
if [ "$HOUR" -lt 9 ] || [ "$HOUR" -ge 20 ]; then
  log "Outside 9:00-20:00 window (hour=$HOUR). Skipping."
  exit 0
fi

# ─── Inactivity Check ───────────────────────────────────────────
check_activity() {
  local cutoff=$(date -d "-$INACTIVITY_THRESHOLD minutes" +%s)
  local now=$(date +%s)
  
  # Check Telegram messages
  local telegram_cutoff=$(date -d "-${INACTIVITY_THRESHOLD} minutes" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -d "-${INACTIVITY_THRESHOLD} minutes" +%FT%TZ)
  
  # Check if any recent sessions with user messages
  local sessions_file="$WORKSPACE/.sessions/recent.json"
  if [ -f "$sessions_file" ]; then
    local last_user_msg=$(stat -c %Y "$sessions_file" 2>/dev/null || echo "0")
    local age=$((now - last_user_msg))
    if [ "$age" -lt $((INACTIVITY_THRESHOLD * 60)) ]; then
      log "Recent user activity detected (sessions). Skipping."
      return 1
    fi
  fi
  
  # Check cron jobs - if a user-facing cron ran recently, skip
  local last_brief=$(grep -r "lastRun" "$WORKSPACE/.openclaw/crons/" 2>/dev/null | tail -1 | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}' | head -1)
  
  # Check PM2 for recent navi-os activity
  local pm2_uptime=$(npx pm2 jlist 2>/dev/null | python3 -c "import sys,json; ps=[p for p in json.load(sys.stdin) if 'navi-os' in p.get('name','')]; print(min(ps[0]['pm2_env']['实例']['start_time'] for p in ps) if ps else 0)" 2>/dev/null || echo "0")
  
  log "No recent user activity. Proceeding with self-improvement cycle."
  return 0
}

# ─── Run Self-Improvement Cycle ─────────────────────────────────
run_improvement_cycle() {
  local CYCLE_ID="SD-$(date +%Y%m%d-%H%M)"
  log "Starting Self-Improvement Cycle: $CYCLE_ID"
  
  local OUTPUT_FILE="$WORKSPACE/.somiar-cycles/somiar-de-dia-$CYCLE_ID.md"
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  
  cat > "$OUTPUT_FILE" << EOF
# 🌙 Somiar de Dia - Self-Improvement Cycle
**ID:** $CYCLE_ID  
**Time:** $(date '+%Y-%m-%d %H:%M:%S')  
**Window:** 9:00 - 20:00  
**Trigger:** Inactivity (>${INACTIVITY_THRESHOLD} min no user activity)

---

## System Health Snapshot

EOF

  # Navi OS Health
  echo "### Navi OS Status" >> "$OUTPUT_FILE"
  npx pm2 jlist 2>/dev/null | python3 -c "
import sys,json
ps = json.load(sys.stdin)
for p in ps:
  if 'navi-os' in p.get('name','') or 'vite' in p.get('name',''):
    print(f\"- **{p['name']}**: {p.get('pm2_env',{}).get('status','?')} (uptime: {p.get('pm_uptime',0)}s)\")
" 2>/dev/null >> "$OUTPUT_FILE" || echo "- PM2 status unavailable" >> "$OUTPUT_FILE"

  echo "" >> "$OUTPUT_FILE"
  echo "### Git Status" >> "$OUTPUT_FILE"
  cd "$WORKSPACE"
  git status --short 2>/dev/null | head -10 >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "## Chiefs Self-Review" >> "$OUTPUT_FILE"
  
  # Each chief reviews their domain
  for CHIEF in elom warren jeff sam; do
    local CHIEF_DIR="$WORKSPACE/team/$CHIEF"
    local MEMORY_FILE="$CHIEF_DIR/MEMBER.md"
    local CHIEF_NAME=$(echo $CHIEF | tr '[:lower:]' '[:upper:]')
    local CHIEF_EMOJI=$(grep -oP 'emoji.*?["\047](.)[\047"]' "$CHIEF_DIR/MEMBER.md" 2>/dev/null | head -1 | tr -d "'" | cut -d' ' -f2 || echo "👤")
    
    echo "" >> "$OUTPUT_FILE"
    echo "### $CHIEF_EMOJI $CHIEF_NAME" >> "$OUTPUT_FILE"
    
    # Check their MEMORY for active projects
    if [ -f "$MEMORY_FILE" ]; then
      grep -A2 "Active Projects" "$MEMORY_FILE" 2>/dev/null | head -10 >> "$OUTPUT_FILE" || true
      grep -A2 "Open Issues" "$MEMORY_FILE" 2>/dev/null | head -5 >> "$OUTPUT_FILE" || true
    fi
    
    # Check BACKLOG
    local BACKLOG_FILE="$CHIEF_DIR/BACKLOG.md"
    if [ -f "$BACKLOG_FILE" ]; then
      echo "" >> "$OUTPUT_FILE"
      echo "**Backlog items:**" >> "$OUTPUT_FILE"
      grep "^\\- " "$BACKLOG_FILE" 2>/dev/null | head -5 >> "$OUTPUT_FILE" || true
    fi
  done
  
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "## Proposed Improvements" >> "$OUTPUT_FILE"
  
  # SAM: Technical improvements
  echo "" >> "$OUTPUT_FILE"
  echo "### 🤖 SAM - Technical Review" >> "$OUTPUT_FILE"
  echo "- **Navi OS:** Review latest build, check for errors in PM2 logs" >> "$OUTPUT_FILE"
  echo "- **Scripts:** Validate all automation scripts are healthy" >> "$OUTPUT_FILE"
  echo "- **APIs:** Check all /api/* endpoints respond correctly" >> "$OUTPUT_FILE"
  
  # JEFF: Operations review  
  echo "" >> "$OUTPUT_FILE"
  echo "### ⚡ JEFF - Operations Review" >> "$OUTPUT_FILE"
  echo "- **Cron jobs:** Verify overnight/weekly jobs completed" >> "$OUTPUT_FILE"
  echo "- **Backups:** Confirm backup integrity" >> "$OUTPUT_FILE"
  echo "- **PM2:** All services running, memory OK" >> "$OUTPUT_FILE"
  
  # WARREN: Quality review
  echo "" >> "$OUTPUT_FILE"
  echo "### 📊 WARREN - Quality Review" >> "$OUTPUT_FILE"
  echo "- **Code quality:** Run quality audit" >> "$OUTPUT_FILE"
  echo "- **Security:** Check for exposed API keys or vulnerabilities" >> "$OUTPUT_FILE"
  echo "- **Process:** Are delivery workflows being followed?" >> "$OUTPUT_FILE"
  
  # ELOM: Strategic review
  echo "" >> "$OUTPUT_FILE"
  echo "### 🚀 ELOM - Strategic Review" >> "$OUTPUT_FILE"
  echo "- **Goals:** Are we moving toward stated objectives?" >> "$OUTPUT_FILE"
  echo "- **Priorities:** Is the current focus still correct?" >> "$OUTPUT_FILE"
  echo "- **Blockers:** Any strategic blockers to address?" >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "## Action Items" >> "$OUTPUT_FILE"
  echo "| Priority | Owner | Action |" >> "$OUTPUT_FILE"
  echo "|----------|-------|--------|" >> "$OUTPUT_FILE"
  echo "| Alta | SAM | Verificar salut tècnica |" >> "$OUTPUT_FILE"
  echo "| Alta | JEFF | Confirmar backups |" >> "$OUTPUT_FILE"
  echo "| Mitja | WARREN | Auditar codi |" >> "$OUTPUT_FILE"
  echo "| Baixa | ELOM | Revisió estratègica |" >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "*Generated by Somiar de Dia · $(date '+%Y-%m-%d %H:%M:%S')*" >> "$OUTPUT_FILE"
  
  log "Cycle complete: $OUTPUT_FILE"
  
  # Save last run
  echo "$(date -Iseconds)" > "$LAST_RUN_FILE"
  
  # If there are HIGH/CRITICAL issues, create a proposal
  if grep -q "CRITICAL\|HIGH" "$OUTPUT_FILE" 2>/dev/null; then
    log "Issues detected - creating proposal"
    # Create a proposal for critical issues
    local PROPOSAL_FILE="$WORKSPACE/data/proposals-temp.json"
    cat >> "$PROPOSAL_FILE" << EOF
{
  "id": "sd-$CYCLE_ID",
  "title": "[Somiar de Dia] Auto-improvement: $(date '+%Y-%m-%d %H:%M')",
  "description": "Self-improvement cycle detected issues. Review: $OUTPUT_FILE",
  "category": "system",
  "chiefId": "sam",
  "status": "pending",
  "createdAt": "$(date -Iseconds)"
}
EOF
  fi
}

# ─── Main ──────────────────────────────────────────────────────
if check_activity; then
  run_improvement_cycle
else
  log "Activity detected - skipping cycle."
fi

log "=== SOMIAR DE DIA - Check complete ==="
