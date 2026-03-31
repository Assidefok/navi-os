#!/bin/bash
# List restore points
set -euo pipefail

WORKSPACE="/home/user/.openclaw/workspace"
BACKUP_ROOT="$WORKSPACE/backups"

if [ ! -d "$BACKUP_ROOT" ]; then
  echo "No backups directory found"
  exit 0
fi

find "$BACKUP_ROOT" -name manifest.json | sort | while read -r manifest; do
  dir="$(dirname "$manifest")"
  name="$(grep '"name"' "$manifest" | head -1 | cut -d '"' -f4)"
  type="$(grep '"type"' "$manifest" | head -1 | cut -d '"' -f4)"
  created="$(grep '"createdAt"' "$manifest" | head -1 | cut -d '"' -f4)"
  size="$(grep '"size"' "$manifest" | head -1 | cut -d '"' -f4)"
  echo "$created | $type | $size | $name | $dir"
done
