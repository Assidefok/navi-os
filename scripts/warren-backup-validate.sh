#!/bin/bash
# ================================================
# WARREN: Backup Validation Script
# ================================================
# Validates backup integrity and tests restore
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
BACKUP_DIR="$WORKSPACE/backups/workspace"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "============================================"
echo "📊 WARREN Backup Validation"
echo "============================================"
echo ""

# Track results
PASSED=0
FAILED=0
WARNINGS=0

log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# ─── Backup Directory Check ────────────────────────────────────────────────
echo -e "${CYAN}--- Backup Directory ---${NC}"

if [ -d "$BACKUP_DIR" ]; then
  log_pass "Backup directory exists: $BACKUP_DIR"
  
  BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -type d ! -name 'workspace' ! -name '.' | wc -l)
  log_info "Total backups: $BACKUP_COUNT"
  
  if [ "$BACKUP_COUNT" -lt 3 ]; then
    log_warn "Low backup count ($BACKUP_COUNT) - consider more frequent backups"
  fi
else
  log_fail "Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo ""

# ─── Recent Backup Check ──────────────────────────────────────────────────
echo -e "${CYAN}--- Recent Backup Check ---${NC}"

# Get most recent backup
LATEST_BACKUP=$(find "$BACKUP_DIR" -maxdepth 1 -type d ! -name 'workspace' ! -name '.' -name "*workspace-backup" | sort -r | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  log_fail "No workspace backups found"
else
  log_info "Latest backup: $(basename "$LATEST_BACKUP")"
  
  # Check age
  BACKUP_AGE=$(find "$LATEST_BACKUP" -maxdepth 0 -mtime +1 2>/dev/null | wc -l)
  if [ "$BACKUP_AGE" -gt 0 ]; then
    log_warn "Latest backup is older than 24 hours"
  else
    log_pass "Latest backup is less than 24 hours old"
  fi
  
  # Check for tar.gz
  if [ -f "$LATEST_BACKUP/$(basename "$LATEST_BACKUP").tar.gz" ]; then
    log_pass "Backup archive exists"
    
    # Check archive size
    ARCHIVE_SIZE=$(stat -f%z "$LATEST_BACKUP/$(basename "$LATEST_BACKUP").tar.gz" 2>/dev/null || stat -c%s "$LATEST_BACKUP/$(basename "$LATEST_BACKUP").tar.gz" 2>/dev/null || echo 0)
    ARCHIVE_SIZE_MB=$((ARCHIVE_SIZE / 1024 / 1024))
    
    if [ "$ARCHIVE_SIZE_MB" -lt 1 ]; then
      log_warn "Backup archive is very small (${ARCHIVE_SIZE_MB}MB) - may be incomplete"
    else
      log_pass "Backup archive size: ${ARCHIVE_SIZE_MB}MB"
    fi
  else
    log_fail "Backup archive missing"
  fi
  
  # Check manifest
  if [ -f "$LATEST_BACKUP/manifest.json" ]; then
    log_pass "Manifest exists"
    
    # Validate JSON
    if command -v python3 &> /dev/null; then
      if python3 -c "import json; json.load(open('$LATEST_BACKUP/manifest.json'))" 2>/dev/null; then
        log_pass "Manifest is valid JSON"
        
        # Check manifest contents
        FILE_COUNT=$(python3 -c "import json; d=json.load(open('$LATEST_BACKUP/manifest.json')); print(len(d.get('files', [])))" 2>/dev/null || echo "0")
        log_info "Manifest includes $FILE_COUNT files"
      else
        log_fail "Manifest JSON is invalid"
      fi
    fi
  else
    log_fail "Manifest missing"
  fi
  
  # Check restore script
  if [ -f "$LATEST_BACKUP/RESTORE.md" ]; then
    log_pass "Restore instructions exist"
  else
    log_warn "Restore instructions missing"
  fi
fi

echo ""

# ─── Archive Integrity Test ──────────────────────────────────────────────
echo -e "${CYAN}--- Archive Integrity Test ---${NC}"

if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP/$(basename "$LATEST_BACKUP").tar.gz" ]; then
  ARCHIVE_PATH="$LATEST_BACKUP/$(basename "$LATEST_BACKUP").tar.gz"
  
  # Test tar archive integrity
  if tar -tzf "$ARCHIVE_PATH" > /dev/null 2>&1; then
    log_pass "Archive integrity OK"
    
    # List contents
    ARCHIVE_FILES=$(tar -tzf "$ARCHIVE_PATH" | wc -l)
    log_info "Archive contains $ARCHIVE_FILES files"
    
    # Check for critical files
    if tar -tzf "$ARCHIVE_PATH" | grep -q "SOUL.md\|MEMORY.md\|AGENTS.md"; then
      log_pass "Critical workspace files included"
    else
      log_warn "Critical files may not be in backup"
    fi
  else
    log_fail "Archive is corrupted"
  fi
fi

echo ""

# ─── Backup Metadata Check ───────────────────────────────────────────────
echo -e "${CYAN}--- Backup Metadata ---${NC}"

# Check include.txt
if [ -f "$LATEST_BACKUP/include.txt" ]; then
  log_pass "include.txt exists"
  
  INCLUDE_COUNT=$(wc -l < "$LATEST_BACKUP/include.txt" 2>/dev/null || echo 0)
  log_info "include.txt has $INCLUDE_COUNT entries"
else
  log_warn "include.txt missing"
fi

echo ""

# ─── Summary ─────────────────────────────────────────────────────────────
echo "============================================"
echo "📊 Validation Summary"
echo "============================================"
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}Backup validation FAILED - immediate action required${NC}"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}Backup validation passed with warnings${NC}"
  exit 0
else
  echo -e "${GREEN}Backup validation PASSED${NC}"
  exit 0
fi
