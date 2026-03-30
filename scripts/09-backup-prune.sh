#!/bin/bash
# Keep only the newest N backups per type
set -euo pipefail

WORKSPACE="/home/user/.openclaw/workspace"
BACKUP_ROOT="$WORKSPACE/backups"
KEEP="${1:-7}"

[ -d "$BACKUP_ROOT" ] || exit 0

for typeDir in "$BACKUP_ROOT"/*; do
  [ -d "$typeDir" ] || continue
  typeName="$(basename "$typeDir")"
  [ "$typeName" = "latest" ] && continue
  count=0
  find "$typeDir" -mindepth 1 -maxdepth 1 -type d | sort -r | while read -r dir; do
    count=$((count + 1))
    if [ "$count" -gt "$KEEP" ]; then
      rm -rf "$dir"
    fi
  done
done
