#!/bin/bash
# ================================================
# SAM: Tech Health Check for Navi OS
# ================================================
# checks AI model, skills, and tech stack health
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
NAVI_OS="$WORKSPACE/navi-os"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "============================================"
echo "🤖 SAM Tech Health Check - Navi OS"
echo "============================================"
echo ""

# Check AI Model
echo -e "${BLUE}IA Model Info:${NC}"
MODEL="${OPENCLAW_MODEL:-minimax-portal/MiniMax-M2}"
PROVIDER="Unknown"
if [[ "$MODEL" == *"openai"* ]]; then
  PROVIDER="OpenAI"
elif [[ "$MODEL" == *"anthropic"* ]]; then
  PROVIDER="Anthropic"
elif [[ "$MODEL" == *"minimax"* ]]; then
  PROVIDER="MiniMax"
fi
echo "  Model: $MODEL"
echo "  Provider: $PROVIDER"
echo ""

# Check Skills
echo -e "${BLUE}Skills Status:${NC}"
SKILLS_DIR="$WORKSPACE/skills"
if [ -d "$SKILLS_DIR" ]; then
  SKILL_COUNT=$(find "$SKILLS_DIR" -maxdepth 1 -type d ! -name 'skills' ! -name '.' ! -name '..' | wc -l)
  echo "  Installed: $SKILL_COUNT skills"
  echo "  Skills:"
  for skill in "$SKILLS_DIR"/*/; do
    if [ -d "$skill" ]; then
      NAME=$(basename "$skill")
      SIZE=$(du -sh "$skill" 2>/dev/null | cut -f1 || echo "?")
      echo "    - $NAME ($SIZE)"
    fi
  done
else
  echo "  No skills directory found"
fi
echo ""

# Check Navi OS Dependencies
echo -e "${BLUE}Navi OS Dependencies:${NC}"
if [ -f "$NAVI_OS/package.json" ]; then
  echo "  package.json: OK"
  if [ -d "$NAVI_OS/node_modules" ]; then
    MODULE_COUNT=$(find "$NAVI_OS/node_modules" -maxdepth 1 -type d ! -name 'node_modules' ! -name '.' ! -name '..' | wc -l)
    echo "  node_modules: $MODULE_COUNT packages"
  else
    echo -e "  ${YELLOW}node_modules: NOT INSTALLED${NC}"
  fi
else
  echo -e "  ${RED}package.json: MISSING${NC}"
fi
echo ""

# Check Server Endpoints
echo -e "${BLUE}Server Health:${NC}"
cd "$NAVI_OS"
if pgrep -f "node.*server.js" > /dev/null; then
  echo -e "  Process: ${GREEN}Running${NC}"
  
  # Check if server responds
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8100/api/system-metrics 2>/dev/null | grep -q "200"; then
    echo -e "  API: ${GREEN}Responding${NC}"
  else
    echo -e "  API: ${YELLOW}Not responding${NC}"
  fi
else
  echo -e "  Process: ${RED}Not running${NC}"
fi
echo ""

# Check Git Status
echo -e "${BLUE}Git Status:${NC}"
cd "$WORKSPACE"
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  STATUS=$(git status --porcelain | wc -l)
  echo "  Branch: $BRANCH"
  echo "  Uncommitted changes: $STATUS"
  
  # Check if behind/ahead remote
  if git rev-parse '@{u}' > /dev/null 2>&1; then
    BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    echo "  Remote: $BEHIND behind, $AHEAD ahead"
  fi
else
  echo "  Not a git repository"
fi
echo ""

# Check PM2 Processes
echo -e "${BLUE}PM2 Processes:${NC}"
if command -v pm2 &> /dev/null; then
  if pm2 list 2>/dev/null | grep -q "online"; then
    echo "  PM2 processes running"
    pm2 list 2>/dev/null | grep -E "online|errored|stopped" | head -10
  else
    echo "  No PM2 processes running"
  fi
else
  echo "  PM2 not installed"
fi
echo ""

# Check OpenClaw Gateway
echo -e "${BLUE}OpenClaw Gateway:${NC}"
if command -v openclaw &> /dev/null; then
  if openclaw gateway status 2>/dev/null | grep -q "running"; then
    echo -e "  Gateway: ${GREEN}Running${NC}"
  else
    echo -e "  Gateway: ${YELLOW}Not running${NC}"
  fi
else
  echo "  OpenClaw CLI not found"
fi
echo ""

echo "============================================"
echo "Health check complete"
echo "============================================"
