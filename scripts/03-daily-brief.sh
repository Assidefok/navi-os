#!/bin/bash
# Automation 3: Daily Brief
# Runs at 07:00 - delivers summary: priorities, news grouped by theme (AI, World, Iran), pulse

set -e

WORKSPACE="/home/user/.openclaw/workspace"
TODAY=$(date +%Y-%m-%d)
BRIEF_FILE="$WORKSPACE/memory/daily-${TODAY}.md"
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d)

echo "# Daily Brief - $TODAY" > "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"
echo "*Generated at $(date '+%H:%M:%S')*" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"
echo "---" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

cd "$WORKSPACE"

latest_today_file() {
  local dir="$1"
  find "$dir" -maxdepth 1 -type f -name "${TODAY}*.md" 2>/dev/null | sort | tail -1
}

# 1. Header
echo "## Bon dia, Aleix" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

# 2. Priorities for Today
echo "## Prioritats per Avui" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

# Check MEMORY.md for projects
if [ -f "$WORKSPACE/MEMORY.md" ]; then
  PRIORITIES=$(grep -A10 "## Current Projects" "$WORKSPACE/MEMORY.md" 2>/dev/null | head -15 || true)
  if [ -n "$PRIORITIES" ]; then
    echo "$PRIORITIES" | while read line; do
      echo "$line" >> "$BRIEF_FILE"
    done
  fi
fi

# Check for todos in memory files
TODOS=$(grep -rE "^\- \[ \]|TODO|FIXME" "$WORKSPACE/memory" 2>/dev/null | head -5 || true)
if [ -n "$TODOS" ]; then
  echo "" >> "$BRIEF_FILE"
  echo "### TASKS pendents:" >> "$BRIEF_FILE"
  echo "$TODOS" | while read t; do
    echo "- $t" | sed 's/.*://' >> "$BRIEF_FILE"
  done
fi
echo "" >> "$BRIEF_FILE"

# 3. Cron Health
echo "## Cron Jobs Health" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"
echo "| Job | Status | Last Run |" >> "$BRIEF_FILE"
echo "|-----|--------|----------|" >> "$BRIEF_FILE"

# Check for last night's runs
for job in backup audit daily rolling; do
  LOG_FILE="$WORKSPACE/memory/${YESTERDAY}-${job}.md"
  if [ -f "$LOG_FILE" ]; then
    LAST_RUN=$(grep "Timestamp" "$LOG_FILE" 2>/dev/null | tail -1 | awk '{print $2}' || echo "OK")
    STATUS=$(grep "STATUS" "$LOG_FILE" 2>/dev/null | tail -1 | awk '{print $2}' || echo "OK")
    echo "| $job | $STATUS | $LAST_RUN |" >> "$BRIEF_FILE"
  else
    echo "| $job | No run | - |" >> "$BRIEF_FILE"
  fi
done
echo "" >> "$BRIEF_FILE"

# 4. Pending Items
echo "## Items Pendents" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

PENDING=0

# Check for unresolved TODOs (excluding scripts themselves)
for dir in "$WORKSPACE/navi-os/src"; do
  if [ -d "$dir" ]; then
    TODOS=$(grep -rn "TODO" "$dir" 2>/dev/null | grep -v ".sh:" | head -5 || true)
    if [ -n "$TODOS" ]; then
      echo "### $dir:" >> "$BRIEF_FILE"
      echo "$TODOS" | while read t; do
        echo "- $t" | sed 's/.*TODO: //' >> "$BRIEF_FILE"
      done
      PENDING=$((PENDING + 1))
    fi
  fi
done

[ $PENDING -eq 0 ] && echo "- Cap item pendent" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

# ============================================================
# 5. AI NEWS (from 06:45 cron - subdirectory)
# ============================================================
echo "## AI News (avui)" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

# Find most recent AI News file for today
AI_NEWS_FILE=$(find "$WORKSPACE/memory/AI-News" -name "${TODAY}-*.md" 2>/dev/null | sort -r | head -1)
if [ -n "$AI_NEWS_FILE" ] && [ -f "$AI_NEWS_FILE" ]; then
  grep -A100 "## Top" "$AI_NEWS_FILE" 2>/dev/null | grep -v "^## Top" | head -30 | while read line; do
    echo "$line" >> "$BRIEF_FILE"
  done
else
  echo "- AI news no disponible (s'executa a les 06:45)" >> "$BRIEF_FILE"
fi
echo "" >> "$BRIEF_FILE"

# ============================================================
# 6. WORLD NEWS (from 06:45 cron - subdirectory)
# ============================================================
echo "## Top 10 World News (avui)" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

WORLD_NEWS_FILE=$(find "$WORKSPACE/memory/World-News" -name "${TODAY}-*.md" 2>/dev/null | sort -r | head -1)
if [ -n "$WORLD_NEWS_FILE" ] && [ -f "$WORLD_NEWS_FILE" ]; then
  grep -A100 "## Top" "$WORLD_NEWS_FILE" 2>/dev/null | grep -v "^## Top" | head -50 | while read line; do
    echo "$line" >> "$BRIEF_FILE"
  done
else
  echo "- World news no disponible (s'executa a les 06:45)" >> "$BRIEF_FILE"
fi
echo "" >> "$BRIEF_FILE"

# ============================================================
# 7. IRAN WAR NEWS (from 06:45 cron - subdirectory)
# ============================================================
echo "## Guerra d Iran - 5 Noticies (avui)" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

IRAN_FILE=$(find "$WORKSPACE/memory/Iran-War" -name "${TODAY}-*.md" 2>/dev/null | sort -r | head -1)
if [ -n "$IRAN_FILE" ] && [ -f "$IRAN_FILE" ]; then
  grep -A50 "## Top" "$IRAN_FILE" 2>/dev/null | grep -v "^## Top" | head -35 | while read line; do
    echo "$line" >> "$BRIEF_FILE"
  done
else
  echo "- Iran war news no disponible (s'executa a les 06:45)" >> "$BRIEF_FILE"
fi
echo "" >> "$BRIEF_FILE"

# ============================================================
# 7. STOCK MARKET NEWS (from 06:45 cron)
# ============================================================
echo "## Borsa - 5 Noticies (avui)" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

STOCK_FILE=$(find "$WORKSPACE/memory/Stock-Market" -name "${TODAY}-*.md" 2>/dev/null | sort -r | head -1)
if [ -n "$STOCK_FILE" ] && [ -f "$STOCK_FILE" ]; then
  grep -A50 "## Top" "$STOCK_FILE" 2>/dev/null | grep -v "^## Top" | head -30 | while read line; do
    echo "$line" >> "$BRIEF_FILE"
  done
else
  echo "- Stock market news no disponible (s'executa a les 06:45)" >> "$BRIEF_FILE"
fi
echo "" >> "$BRIEF_FILE"

# ============================================================
# 8. AI Pulse
# ============================================================
echo "## AI Pulse" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"
echo "- **OpenClaw**: Active i en desenvolupament" >> "$BRIEF_FILE"
echo "- **Navi OS**: v2.0 en produccio" >> "$BRIEF_FILE"
echo "- **Sector**: Agentes autonomos en creixement" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

# 9. Quick Stats
echo "## Stats" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"
echo "| Metric | Value |" >> "$BRIEF_FILE"
echo "|--------|-------|" >> "$BRIEF_FILE"
echo "| Memory files | $(find $WORKSPACE/memory -name '*.md' 2>/dev/null | wc -l) |" >> "$BRIEF_FILE"
echo "| Scripts | $(find $WORKSPACE/scripts -name '*.sh' 2>/dev/null | wc -l) |" >> "$BRIEF_FILE"
echo "| Cron jobs | $(openclaw cron list 2>/dev/null | grep -c 'cron ' || echo "-") |" >> "$BRIEF_FILE"
echo "| Source files | $(find $WORKSPACE/navi-os/src -name '*.jsx' -o -name '*.css' 2>/dev/null | wc -l) |" >> "$BRIEF_FILE"
echo "" >> "$BRIEF_FILE"

echo "---" >> "$BRIEF_FILE"
echo "*Brief generated by Navi OS*" >> "$BRIEF_FILE"

echo "Daily brief created: $BRIEF_FILE"
