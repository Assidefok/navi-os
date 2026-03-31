#!/bin/bash
# Restore encapsulated backup archive
set -euo pipefail

ARCHIVE="${1:-}"
MODE="${2:-}"
if [ -z "$ARCHIVE" ]; then
  echo "Usage: $0 /path/to/archive.tar.gz [--dry-run]"
  exit 1
fi
if [ ! -f "$ARCHIVE" ]; then
  echo "Archive not found: $ARCHIVE"
  exit 1
fi

if [ "$MODE" = "--dry-run" ]; then
  echo "[DRY RUN] Archive contents:"
  tar -tzf "$ARCHIVE"
  exit 0
fi

echo "Restoring archive into / ..."
tar -xzf "$ARCHIVE" -C /
echo "Restore complete"
