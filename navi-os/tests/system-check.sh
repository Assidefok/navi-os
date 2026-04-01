#!/bin/bash
# Navi OS - System Health Check
# Run: bash tests/system-check.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE="http://localhost:3001"
passed=0
failed=0

echo ""
echo "🧪 Navi OS - System Health Check"
echo "================================"

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  
  if [ "$actual" = "$expected" ]; then
    echo -e "${GREEN}✓${NC} $name"
    passed=$((passed + 1))
  else
    echo -e "${RED}✗${NC} $name (expected: $expected, got: $actual)"
    failed=$((failed + 1))
  fi
}

http_check() {
  local name="$1"
  local path="$2"
  local expected="$3"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path" 2>/dev/null || echo "000")
  check "$name" "$expected" "$actual"
}

# Port checks
echo -e "\n${YELLOW}--- Ports & Services ---${NC}"
http_check "Vite (port 8100)" "/" "200"
http_check "API Server (port 3001)" "/api/pm-board" "200"

# API Endpoints
echo -e "\n${YELLOW}--- API Endpoints ---${NC}"
http_check "PM Board" "/api/pm-board" "200"
http_check "Org Chart" "/api/org-chart" "200"
http_check "Cron Health" "/api/cron-health" "200"
http_check "AI Status" "/api/ai-status" "200"
http_check "PM2 Status" "/api/pm2-status" "200"
http_check "Backups" "/api/backups" "200"
http_check "Proposals" "/api/proposals" "200"
http_check "Inbox" "/api/inbox" "200"
http_check "Standups" "/api/standups" "200"
http_check "Skills" "/api/skills" "200"
http_check "Sessions" "/api/sessions" "200"
http_check "Agents" "/api/agents" "200"
http_check "Automations" "/api/automations" "200"
http_check "Chiefs Council" "/api/chiefs-council" "200"
http_check "Git Log" "/api/git-log" "200"
http_check "System Metrics" "/api/system-metrics" "200"
http_check "Tools" "/api/tools" "200"
http_check "Memory Files" "/api/memory/files" "200"
http_check "Somiar Day Status" "/api/somiar/dia/status" "200"
http_check "Somiar Night Status" "/api/somiar/nit/status" "200"
http_check "Ideas" "/api/ideas" "200"
http_check "Integrations" "/api/integrations" "200"
http_check "Chief Warren Status" "/api/chief/warren/status" "200"
http_check "Gateway Security" "/api/gateway-security" "200"
http_check "Workspace Files" "/api/workspace-files" "200"
http_check "Logs" "/api/logs" "200"
http_check "Briefs" "/api/briefs" "200"
http_check "Prototypes" "/api/prototypes" "200"
http_check "Current Model" "/api/current-model" "200"

# JSON Malformed handling
echo -e "\n${YELLOW}--- Error Handling ---${NC}"
malformed=$(curl -s -X POST "$BASE/api/file" -H "Content-Type: application/json" -d '{"bad":"json' 2>/dev/null)
if [[ "$malformed" == *"Invalid JSON"* ]]; then
  echo -e "${GREEN}✓${NC} Malformed JSON handling"
  passed=$((passed + 1))
else
  echo -e "${RED}✗${NC} Malformed JSON handling (server may have crashed)"
  failed=$((failed + 1))
fi

# PM2 Status
echo -e "\n${YELLOW}--- PM2 Processes ---${NC}"
pm2_list=$(npx pm2 list 2>/dev/null | grep -E "navi-os-api|navi-os-vite" | grep -c "online" || echo "0")
check "navi-os-api + navi-os-vite online (count)" "2" "$pm2_list"

# Memory Files exist
echo -e "\n${YELLOW}--- Critical Files ---${NC}"
[ -f "/home/user/.openclaw/workspace/MEMORY.md" ] && echo -e "${GREEN}✓${NC} MEMORY.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} MEMORY.md missing"
[ -f "/home/user/.openclaw/workspace/PROJECT.md" ] && echo -e "${GREEN}✓${NC} PROJECT.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} PROJECT.md missing"
[ -f "/home/user/.openclaw/workspace/team/warren/MEMORY.md" ] && echo -e "${GREEN}✓${NC} Warren MEMORY.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} Warren MEMORY.md missing"
[ -f "/home/user/.openclaw/workspace/team/jeff/MEMORY.md" ] && echo -e "${GREEN}✓${NC} Jeff MEMORY.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} Jeff MEMORY.md missing"
[ -f "/home/user/.openclaw/workspace/team/sam/MEMORY.md" ] && echo -e "${GREEN}✓${NC} SAM MEMORY.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} SAM MEMORY.md missing"
[ -f "/home/user/.openclaw/workspace/team/elom/MEMORY.md" ] && echo -e "${GREEN}✓${NC} ELOM MEMORY.md exists" && passed=$((passed + 1)) || failed=$((failed + 1)) && echo -e "${RED}✗${NC} ELOM MEMORY.md missing"

# OpenClaw Gateway
echo -e "\n${YELLOW}--- OpenClaw Gateway ---${NC}"
gateway_status=$(openclaw status 2>/dev/null | grep -c "reachable\|running" || echo "0")
if [ "$gateway_status" -gt "0" ]; then
  echo -e "${GREEN}✓${NC} Gateway reachable"
  passed=$((passed + 1))
else
  echo -e "${RED}✗${NC} Gateway not reachable"
  failed=$((failed + 1))
fi

# Cron Jobs
echo -e "\n${YELLOW}--- Cron Jobs ---${NC}"
cron_count=$(openclaw cron list 2>/dev/null | grep -c "cron " || echo "0")
if [ "$cron_count" -gt "10" ]; then
  echo -e "${GREEN}✓${NC} Cron jobs registered: $cron_count"
  passed=$((passed + 1))
else
  echo -e "${RED}✗${NC} Cron jobs registered: $cron_count (expected > 10)"
  failed=$((failed + 1))
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✓${NC} $passed passed"
if [ "$failed" -gt "0" ]; then
  echo -e "${RED}✗${NC} $failed failed"
  exit 1
else
  echo -e "${GREEN}All checks passed!${NC}"
fi
