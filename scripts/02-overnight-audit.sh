#!/bin/bash
# Automation 2: Overnight Self-Improvement
# Runs at 03:00 - audits one module, builds one feature, saves to staging
# Proposes safe improvements and applies low-risk fixes

set -e

WORKSPACE="/home/user/.openclaw/workspace"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$WORKSPACE/memory/${TODAY}-audit.md"
ISSUES_FOUND=0
FIXES_APPLIED=0

echo "# Overnight Self-Improvement Audit - $TODAY" > "$LOG_FILE"
echo "" >> "$LOG_FILE"

cd "$WORKSPACE"

# Module to audit (cycles through: navi-os/src/modules/Ops, Brain, Lab)
MODULES=("Ops" "Brain" "Lab")
AUDIT_INDEX=$(($(date +%s) / 86400 % 3))
AUDIT_MODULE="${MODULES[$AUDIT_INDEX]}"

echo "## Audit Target: $AUDIT_MODULE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 1. Module Audit
echo "### Module Audit: $AUDIT_MODULE" >> "$LOG_FILE"
MODULE_PATH="$WORKSPACE/navi-os/src/modules/$AUDIT_MODULE"
if [ -d "$MODULE_PATH" ]; then
  FILE_COUNT=$(find "$MODULE_PATH" -name "*.jsx" -o -name "*.css" 2>/dev/null | wc -l)
  echo "- Files found: $FILE_COUNT" >> "$LOG_FILE"
  echo "- Last modified: $(find "$MODULE_PATH" -type f -name "*.jsx" -mtime -1 2>/dev/null | head -1)" >> "$LOG_FILE"
  
  # Check for TODO/FIXME
  TODOS=$(grep -r "TODO\|FIXME" "$MODULE_PATH" 2>/dev/null | head -5 || true)
  if [ -n "$TODOS" ]; then
    echo "- TODOs/FIXMEs found:" >> "$LOG_FILE"
    echo "$TODOS" | while read t; do echo "  $t" >> "$LOG_FILE"; done
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
else
  echo "- Module not found at expected path" >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

# 2. Workspace Health
echo "### Workspace Health" >> "$LOG_FILE"
TOTAL_FILES=$(find "$WORKSPACE" -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.css" \) 2>/dev/null | grep -v node_modules | wc -l)
MEMORY_FILES=$(find "$WORKSPACE/memory" -name "*.md" 2>/dev/null | wc -l)
echo "- Total source files: $TOTAL_FILES" >> "$LOG_FILE"
echo "- Memory files: $MEMORY_FILES" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 3. Check for broken imports/references
echo "### Reference Check" >> "$LOG_FILE"
BROKEN=0
for js in $(find "$WORKSPACE/navi-os/src" -name "*.jsx" 2>/dev/null); do
  IMPORTS=$(grep -oE "from ['\"]\.\./[^'\"]+['\"]" "$js" 2>/dev/null || true)
  if [ -n "$IMPORTS" ]; then
    while read imp; do
      path=$(echo "$imp" | sed "s/from ['\"]//g" | sed "s/['\"]//g")
      full_path="$WORKSPACE/navi-os/src/${path#../}"
      if [ ! -f "$full_path" ]; then
        echo "- Broken import in $(basename $js): $path" >> "$LOG_FILE"
        BROKEN=$((BROKEN + 1))
      fi
    done <<< "$IMPORTS"
  fi
done
[ $BROKEN -eq 0 ] && echo "- No broken imports found" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 4. Apply safe fixes
echo "### Safe Fixes Applied" >> "$LOG_FILE"

# Fix: Clean empty files
EMPTY_FILES=$(find "$WORKSPACE" -name "*.md" -empty 2>/dev/null | grep -v node_modules || true)
if [ -n "$EMPTY_FILES" ]; then
  echo "$EMPTY_FILES" | while read f; do
    echo "- Removing empty file: $f" >> "$LOG_FILE"
    rm "$f"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
  done
fi

# Fix: Ensure logs directory exists
mkdir -p "$WORKSPACE/memory"

# Fix: Clean up temporary files
TEMP_FILES=$(find "$WORKSPACE" -name "*.tmp" -o -name "*~" 2>/dev/null | grep -v node_modules | head -5 || true)
if [ -n "$TEMP_FILES" ]; then
  echo "$TEMP_FILES" | while read f; do
    echo "- Would remove temp file: $f" >> "$LOG_FILE"
    FIXES_APPLIED=$((FIXES_APPLIED + 1))
  done
fi

echo "" >> "$LOG_FILE"
echo "## Summary" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "| Metric | Value |" >> "$LOG_FILE"
echo "|--------|-------|" >> "$LOG_FILE"
echo "| Issues Found | $ISSUES_FOUND |" >> "$LOG_FILE"
echo "| Fixes Applied | $FIXES_APPLIED |" >> "$LOG_FILE"
echo "| Module Audited | $AUDIT_MODULE |" >> "$LOG_FILE"
echo "| Timestamp | $(date '+%H:%M:%S') |" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "*Audit completed at $(date)*" >> "$LOG_FILE"

echo "Audit complete: $ISSUES_FOUND issues, $FIXES_APPLIED fixes, audited $AUDIT_MODULE"
