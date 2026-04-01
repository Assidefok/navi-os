#!/bin/bash
# ================================================================
# SOMIAR DE NIT - Self-Improvement Standup (20:00 - 06:00)
# Every 30 min: if no user activity, run deep improvement cycle
# Night mode = deeper analysis, less aggressive proposals
# ================================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LOG_FILE="$WORKSPACE/logs/somiar-de-nit.log"
LAST_RUN_FILE="$WORKSPACE/.somiar-de-nit.last"
INACTIVITY_THRESHOLD=30  # minutes

# ─── Logging ────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-NIT] $1" | tee -a "$LOG_FILE" >& /dev/null; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SOMIAR-NIT] ERROR: $1" | tee -a "$LOG_FILE" >&2; }

mkdir -p "$(dirname "$LOG_FILE")"

log "=== SOMIAR DE NIT - Starting check ==="

# ─── Time Window Check ──────────────────────────────────────────
HOUR=$(date +%H)
# Active between 20:00 (8 PM) and 06:00 (6 AM next day)
# i.e., HOUR >= 20 OR HOUR < 6
IS_NIGHT=false
if [ "$HOUR" -ge 20 ] || [ "$HOUR" -lt 6 ]; then
  IS_NIGHT=true
fi

if [ "$IS_NIGHT" = false ]; then
  log "Outside 20:00-06:00 window (hour=$HOUR). Skipping."
  exit 0
fi

# ─── Inactivity Check ───────────────────────────────────────────
if [ -f "$WORKSPACE/.sessions/recent.json" ]; then
  local age=$(($(date +%s) - $(stat -c %Y "$WORKSPACE/.sessions/recent.json" 2>/dev/null || echo "0")))
  if [ "$age" -lt $((INACTIVITY_THRESHOLD * 60)) ]; then
    log "Recent user activity. Skipping."
    exit 0
  fi
fi

# ─── Run Deep Improvement Cycle ─────────────────────────────────
run_deep_cycle() {
  local CYCLE_ID="SN-$(date +%Y%m%d-%H%M)"
  log "Starting Deep Improvement Cycle: $CYCLE_ID"
  
  local OUTPUT_DIR="$WORKSPACE/.somiar-cycles"
  local OUTPUT_FILE="$OUTPUT_DIR/somiar-de-nit-$CYCLE_ID.md"
  mkdir -p "$OUTPUT_DIR"
  
  cat > "$OUTPUT_FILE" << 'HEADER'
# 🌌 Somiar de Nit - Deep Improvement Cycle
HEADER

  echo "**ID:** $CYCLE_ID" >> "$OUTPUT_FILE"
  echo "**Time:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
  echo "**Window:** 20:00 - 06:00 (night mode - deep analysis)" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  
  # System state snapshot
  echo "## System State Snapshot" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "```" >> "$OUTPUT_FILE"
  npx pm2 jlist 2>/dev/null | python3 -c "
import sys,json
ps=json.load(sys.stdin)
for p in ps:
  name=p.get('name','')
  if any(x in name for x in ['navi','vite','api']):
    mem=int(p.get('mon_dot',{}).get('memory',0))//1024//1024
    cpu=p.get('mon_dot',{}).get('cpu',0)
    print(f'{name}: mem={mem}MB cpu={cpu}%')
" 2>/dev/null >> "$OUTPUT_FILE" || true
  echo "```" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  
  # Memory analysis
  echo "## Memory Health" >> "$OUTPUT_FILE"
  for CHIEF in elom warren jeff sam; do
    local MEM="$WORKSPACE/team/$CHIEF/MEMORY.md"
    if [ -f "$MEM" ]; then
      local UPDATED=$(stat -c %y "$MEM" 2>/dev/null | cut -d' ' -f1)
      local SIZE=$(wc -c < "$MEM")
      echo "- **$(echo $CHIEF | tr '[:lower:]' '[:upper:]'):** $UPDATED · ${SIZE}B" >> "$OUTPUT_FILE"
    fi
  done
  echo "" >> "$OUTPUT_FILE"
  
  # Deep review by each chief
  echo "---" >> "$OUTPUT_FILE"
  echo "## 🧠 Deep Chiefs Review" >> "$OUTPUT_FILE"
  
  # ELOM - Strategic depth
  echo "" >> "$OUTPUT_FILE"
  echo "### 🚀 ELOM - Strategic Reflection" >> "$OUTPUT_FILE"
  echo "- **Vision check:** Are the 3 big bets still relevant?" >> "$OUTPUT_FILE"
  echo "- **10x opportunities:** Any emerging tech trends to exploit?" >> "$OUTPUT_FILE"
  echo "- **Risk assessment:** New risks появились?" >> "$OUTPUT_FILE"
  
  # WARREN - Quality deep dive
  echo "" >> "$OUTPUT_FILE"
  echo "### 📊 WARREN - Quality Deep Dive" >> "$OUTPUT_FILE"
  echo "- **Audit results:** Full quality audit run" >> "$OUTPUT_FILE"
  echo "- **Technical debt:** What needs refactoring?" >> "$OUTPUT_FILE"
  echo "- **Process compliance:** Are we following delivery workflow?" >> "$OUTPUT_FILE"
  
  # JEFF - Operations deep dive
  echo "" >> "$OUTPUT_FILE"
  echo "### ⚡ JEFF - Operations Deep Dive" >> "$OUTPUT_FILE"
  echo "- **Backup validation:** Full backup integrity check" >> "$OUTPUT_FILE"
  echo "- **Cron health:** All scheduled jobs healthy?" >> "$OUTPUT_FILE"
  echo "- **Deployment pipeline:** Any bottlenecks?" >> "$OUTPUT_FILE"
  
  # SAM - Technical deep dive
  echo "" >> "$OUTPUT_FILE"
  echo "### 🤖 SAM - Technical Deep Dive" >> "$OUTPUT_FILE"
  echo "- **Navi OS metrics:** Load times, error rates, API latency" >> "$OUTPUT_FILE"
  echo "- **Skills inventory:** Which skills need updates?" >> "$OUTPUT_FILE"
  echo "- **AI model performance:** Is the current model optimal?" >> "$OUTPUT_FILE"
  echo "- **Code review:** Any architectural concerns?" >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "## 🌙 Night-Specific Observations" >> "$OUTPUT_FILE"
  echo "- System has been running for $(npx pm2 jlist 2>/dev/null | python3 -c "import sys,json; ps=json.load(sys.stdin); print(min(p.get('pm_uptime',0) for p in ps if 'navi-os' in p.get('name','')))" 2>/dev/null || echo 'unknown') seconds" >> "$OUTPUT_FILE"
  echo "- No user activity since $(ls -lt "$WORKSPACE/.sessions/" 2>/dev/null | head -2 | tail -1 | cut -d' ' -f6,7,8)" >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "---" >> "$OUTPUT_FILE"
  echo "## Action Items (Night Priority)" >> "$OUTPUT_FILE"
  echo "| Priority | Owner | Action |" >> "$OUTPUT_FILE"
  echo "|----------|-------|--------|" >> "$OUTPUT_FILE"
  echo "| Critica | SAM | Clear any PM2 errors |" >> "$OUTPUT_FILE"
  echo "| Alta | JEFF | Validate backup integrity |" >> "$OUTPUT_FILE"
  echo "| Alta | WARREN | Document quality issues |" >> "$OUTPUT_FILE"
  echo "| Mitja | ELOM | Update strategic notes if needed |" >> "$OUTPUT_FILE"
  
  echo "" >> "$OUTPUT_FILE"
  echo "*Generated by Somiar de Nit · $(date '+%Y-%m-%d %H:%M:%S')*" >> "$OUTPUT_FILE"
  
  log "Deep cycle complete: $OUTPUT_FILE"
  
  # Save last run
  echo "$(date -Iseconds)" > "$LAST_RUN_FILE"
}

run_deep_cycle

log "=== SOMIAR DE NIT - Check complete ==="
