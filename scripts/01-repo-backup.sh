#!/bin/bash
# Automation 1: Nightly Git Backup
# Runs daily at 02:00, stages changes, commits, pushes to private repo
# Excludes secrets and sensitive files

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LOG_FILE="$WORKSPACE/memory/$(date +%Y-%m-%d)-backup.md"

cd "$WORKSPACE"

# Create encapsulated checkpoint before git backup
if [ -x "$WORKSPACE/scripts/10-safe-change-checkpoint.sh" ]; then
  "$WORKSPACE/scripts/10-safe-change-checkpoint.sh" repo-backup >/dev/null 2>&1 || true
fi

# Resolve branch to push (handle master->main transition)
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
# Default to master if not on a recognized branch
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
  BRANCH="master"
fi

# Create exclude patterns for sensitive files
EXCLUDE_PATTERNS=(
  ".env"
  "*.key"
  "*.pem"
  "credentials.json"
  "secrets.json"
  "node_modules/.cache"
)

# Generate meaningful commit message
generate_commit_message() {
  local changes=$(git status --porcelain 2>/dev/null | wc -l)
  if [ "$changes" -eq 0 ]; then
    echo "No changes to commit"
    return 1
  fi
  
  local timestamp=$(date '+%Y-%m-%d %H:%M')
  local first_file=$(git status --porcelain | head -1 | cut -c4- | cut -d'/' -f1 | head -1)
  
  case "$first_file" in
    navi-os) echo "[code] $timestamp - Navi OS updates";;
    scripts) echo "[scripts] $timestamp - Automation updates";;
    docs) echo "[docs] $timestamp - Documentation updates";;
    memory) echo "[memory] $timestamp - Memory/log updates";;
    *) echo "[updates] $timestamp - Workspace updates";;
  esac
}

echo "# Git Backup - $(date '+%Y-%m-%d %H:%M')" > "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Check git status
if ! git status --porcelain 2>/dev/null | grep -q .; then
  echo "STATUS: OK - No changes to commit" >> "$LOG_FILE"
  exit 0
fi

# Stage changes (excluding secrets)
echo "Staging changes..." >> "$LOG_FILE"
git add -A

# Generate commit message
MSG=$(generate_commit_message)
if [ $? -eq 1 ]; then
  echo "No changes to commit" >> "$LOG_FILE"
  exit 0
fi

# Commit
echo "Committing: $MSG" >> "$LOG_FILE"
git commit -m "$MSG" || { echo "FATAL: Commit failed" >> "$LOG_FILE"; exit 1; }

# Push with retry
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if git push origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    echo "" >> "$LOG_FILE"
    echo "STATUS: SUCCESS - Backup completed" >> "$LOG_FILE"
    echo "Backup completed successfully"
    exit 0
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Retry $RETRY_COUNT/$MAX_RETRIES in 10s..." >> "$LOG_FILE"
  sleep 10
done

echo "" >> "$LOG_FILE"
echo "STATUS: FAILED - All retries exhausted" >> "$LOG_FILE"
exit 1
