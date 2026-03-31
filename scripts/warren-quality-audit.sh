#!/bin/bash
# ================================================
# WARREN: Quality Audit Script
# ================================================
# Audits code quality, security, and risk
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
NAVI_OS="$WORKSPACE/navi-os"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "============================================"
echo "📊 WARREN Quality Audit - Navi OS"
echo "============================================"
echo ""

# Track issues
ISSUES=0
WARNINGS=0
SUCCESSES=0

log_issue() { 
  echo -e "${RED}[ISSUE]${NC} $1"
  ((ISSUES++))
}
log_warn() { 
  echo -e "${YELLOW}[WARN]${NC} $1"
  ((WARNINGS++))
}
log_ok() { 
  echo -e "${GREEN}[OK]${NC} $1"
  ((SUCCESSES++))
}
log_info() { 
  echo -e "${BLUE}[INFO]${NC} $1"
}

# ─── Code Quality Checks ───────────────────────────────────────────────────
echo -e "${CYAN}--- Code Quality ---${NC}"

# Check for TODO/FIXME comments
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" "$NAVI_OS/src" --include="*.js" --include="*.jsx" --include="*.css" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
  log_warn "Found $TODO_COUNT TODO/FIXME comments in source"
else
  log_ok "No TODO/FIXME comments found"
fi

# Check for console.log statements
CONSOLE_COUNT=$(grep -r "console\.log" "$NAVI_OS/src" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$CONSOLE_COUNT" -gt 5 ]; then
  log_warn "Found $CONSOLE_COUNT console.log statements (consider removing for production)"
elif [ "$CONSOLE_COUNT" -gt 0 ]; then
  log_info "Found $CONSOLE_COUNT console.log statements"
else
  log_ok "No console.log statements found"
fi

# Check for hardcoded values
HARDCODED=$(grep -r "localhost:\|127\.0\.0\.1" "$NAVI_OS/src" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$HARDCODED" -gt 3 ]; then
  log_warn "Found $HARDCODED hardcoded localhost references"
else
  log_ok "No hardcoded localhost issues"
fi

echo ""

# ─── Security Checks ───────────────────────────────────────────────────────
echo -e "${CYAN}--- Security ---${NC}"

# Check for API keys in code
API_KEYS=$(grep -r "api_key\|apikey\|API_KEY\|APIKEY" "$NAVI_OS/src" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$API_KEYS" -gt 0 ]; then
  log_issue "Found potential API key references in source"
else
  log_ok "No API key references found"
fi

# Check for .env handling
if [ -f "$NAVI_OS/.env" ]; then
  log_warn ".env file exists in navi-os (should be in .gitignore)"
fi

# Check .gitignore
if [ -f "$NAVI_OS/.gitignore" ]; then
  if grep -q "\.env" "$NAVI_OS/.gitignore"; then
    log_ok ".env is in .gitignore"
  else
    log_warn ".env may not be in .gitignore"
  fi
else
  log_issue ".gitignore not found"
fi

# Check server.js for security issues
if grep -q "eval\|new Function" "$NAVI_OS/server.js" 2>/dev/null; then
  log_issue "Potential code injection risk: eval/new Function found"
else
  log_ok "No eval/new Function found in server.js"
fi

echo ""

# ─── Error Handling Checks ──────────────────────────────────────────────────
echo -e "${CYAN}--- Error Handling ---${NC}"

# Check for ErrorBoundary usage
ERROR_BOUNDY_COUNT=$(grep -r "ErrorBoundary" "$NAVI_OS/src" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$ERROR_BOUNDY_COUNT" -lt 3 ]; then
  log_warn "Low ErrorBoundary usage ($ERROR_BOUNDY_COUNT found) - consider adding more"
else
  log_ok "ErrorBoundary usage is adequate ($ERROR_BOUNDY_COUNT)"
fi

# Check for try-catch in API calls
TRY_CATCH_COUNT=$(grep -r "try {" "$NAVI_OS/src" 2>/dev/null | wc -l)
if [ "$TRY_CATCH_COUNT" -lt 5 ]; then
  log_warn "Limited try-catch usage ($TRY_CATCH_COUNT found)"
else
  log_ok "Try-catch usage is adequate ($TRY_CATCH_COUNT)"
fi

echo ""

# ─── Dependencies Checks ───────────────────────────────────────────────────
echo -e "${CYAN}--- Dependencies ---${NC}"

# Check for outdated dependencies
if [ -f "$NAVI_OS/package.json" ]; then
  log_ok "package.json exists"
  
  # Check for known vulnerable packages (basic check)
  if grep -q "axios@0" "$NAVI_OS/package.json" 2>/dev/null; then
    log_warn "axios version 0.x detected - consider upgrading"
  fi
else
  log_issue "package.json not found"
fi

# Check node_modules exists
if [ -d "$NAVI_OS/node_modules" ]; then
  log_ok "node_modules installed"
else
  log_warn "node_modules not installed - dependencies need install"
fi

echo ""

# ─── File Structure Checks ─────────────────────────────────────────────────
echo -e "${CYAN}--- File Structure ---${NC}"

# Check for consistent naming
JSX_FILES=$(find "$NAVI_OS/src" -name "*.jsx" 2>/dev/null | wc -l)
JS_FILES=$(find "$NAVI_OS/src" -name "*.js" 2>/dev/null | wc -l)
CSS_FILES=$(find "$NAVI_OS/src" -name "*.css" 2>/dev/null | wc -l)

log_info "Source files: $JSX_FILES JSX, $JS_FILES JS, $CSS_FILES CSS"

# Check for large files
LARGE_FILES=$(find "$NAVI_OS/src" -name "*.jsx" -o -name "*.js" -o -name "*.css" 2>/dev/null | while read f; do
  size=$(wc -c < "$f" 2>/dev/null || echo 0)
  if [ "$size" -gt 50000 ]; then
    echo "$f"
  fi
done | wc -l)

if [ "$LARGE_FILES" -gt 0 ]; then
  log_warn "Found $LARGE_FILES files over 50KB - consider splitting"
else
  log_ok "No oversized files found"
fi

echo ""

# ─── Git Hygiene ───────────────────────────────────────────────────────────
echo -e "${CYAN}--- Git Hygiene ---${NC}"

cd "$WORKSPACE"
if git rev-parse --git-dir > /dev/null 2>&1; then
  # Check for large commits
  LARGE_COMMITS=$(git log --oneline --size-limit 2>/dev/null | head -5)
  if [ -n "$LARGE_COMMITS" ]; then
    log_warn "Some commits may be large"
  fi
  
  # Check branch status
  if git status --porcelain | grep -q "^??"; then
    UNTRACKED=$(git status --porcelain | grep "^??" | wc -l)
    log_warn "$UNTRACKED untracked files"
  else
    log_ok "No untracked files"
  fi
else
  log_warn "Not a git repository"
fi

echo ""
echo "============================================"
echo "📊 Audit Summary"
echo "============================================"
echo -e "  ${GREEN}OK:${NC}        $SUCCESSES"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Issues:${NC}   $ISSUES"
echo ""

if [ "$ISSUES" -gt 0 ]; then
  echo -e "${RED}Quality issues found - recommend fixing before deployment${NC}"
  exit 1
elif [ "$WARNINGS" -gt 5 ]; then
  echo -e "${YELLOW}Multiple warnings - review recommended${NC}"
  exit 0
else
  echo -e "${GREEN}Quality audit passed!${NC}"
  exit 0
fi
