#!/bin/bash
# Encapsulated backup creator for Navi OS / OpenClaw workspace
set -euo pipefail

WORKSPACE="/home/user/.openclaw/workspace"
BACKUP_ROOT="$WORKSPACE/backups"
TYPE="${1:-workspace}"
LABEL="${2:-manual}"
TS="$(date +%Y%m%d-%H%M%S)"
HOST="$(hostname)"
BRANCH="$(git -C "$WORKSPACE" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
COMMIT="$(git -C "$WORKSPACE" rev-parse --short HEAD 2>/dev/null || echo "none")"

case "$TYPE" in
  navi-os)
    SRC=("$WORKSPACE/navi-os")
    DEST_DIR="$BACKUP_ROOT/navi-os"
    ;;
  workspace)
    SRC=(
      "$WORKSPACE/navi-os"
      "$WORKSPACE/scripts"
      "$WORKSPACE/docs"
      "$WORKSPACE/memory"
      "$WORKSPACE/.learnings"
      "$WORKSPACE/MEMORY.md"
      "$WORKSPACE/PROJECT.md"
      "$WORKSPACE/SOUL.md"
      "$WORKSPACE/USER.md"
      "$WORKSPACE/AGENTS.md"
      "$WORKSPACE/TOOLS.md"
    )
    DEST_DIR="$BACKUP_ROOT/workspace"
    ;;
  config)
    SRC=(
      "$WORKSPACE/MEMORY.md"
      "$WORKSPACE/PROJECT.md"
      "$WORKSPACE/SOUL.md"
      "$WORKSPACE/USER.md"
      "$WORKSPACE/AGENTS.md"
      "$WORKSPACE/TOOLS.md"
      "$WORKSPACE/.learnings"
      "$WORKSPACE/memory"
      "$WORKSPACE/scripts"
      "$WORKSPACE/docs"
    )
    DEST_DIR="$BACKUP_ROOT/config"
    ;;
  full|full-snapshot)
    SRC=(
      "$WORKSPACE/navi-os"
      "$WORKSPACE/scripts"
      "$WORKSPACE/docs"
      "$WORKSPACE/memory"
      "$WORKSPACE/.learnings"
      "$WORKSPACE/MEMORY.md"
      "$WORKSPACE/PROJECT.md"
      "$WORKSPACE/SOUL.md"
      "$WORKSPACE/USER.md"
      "$WORKSPACE/AGENTS.md"
      "$WORKSPACE/TOOLS.md"
    )
    DEST_DIR="$BACKUP_ROOT/full"
    TYPE="full"
    ;;
  *)
    echo "Usage: $0 {navi-os|workspace|config|full} [label]"
    exit 1
    ;;
esac

mkdir -p "$BACKUP_ROOT" "$DEST_DIR" "$BACKUP_ROOT/latest"
SNAP_NAME="${TS}-${TYPE}-${LABEL}"
SNAP_DIR="$DEST_DIR/$SNAP_NAME"
mkdir -p "$SNAP_DIR/payload"

INCLUDE_FILE="$SNAP_DIR/include.txt"
: > "$INCLUDE_FILE"
for item in "${SRC[@]}"; do
  if [ -e "$item" ]; then
    echo "$item" >> "$INCLUDE_FILE"
  fi
done

ARCHIVE="$SNAP_DIR/${SNAP_NAME}.tar.gz"
tar -czf "$ARCHIVE" \
  --exclude="$WORKSPACE/backups" \
  --exclude='*/node_modules' \
  --exclude='*/dist' \
  --exclude='*/.git' \
  -T "$INCLUDE_FILE"
CHECKSUM="$(sha256sum "$ARCHIVE" | awk '{print $1}')"
SIZE="$(du -h "$ARCHIVE" | awk '{print $1}')"

cat > "$SNAP_DIR/manifest.json" <<EOF
{
  "name": "$SNAP_NAME",
  "type": "$TYPE",
  "label": "$LABEL",
  "createdAt": "$(date --iso-8601=seconds)",
  "host": "$HOST",
  "workspace": "$WORKSPACE",
  "branch": "$BRANCH",
  "commit": "$COMMIT",
  "archive": "$ARCHIVE",
  "size": "$SIZE",
  "sha256": "$CHECKSUM"
}
EOF

cat > "$SNAP_DIR/RESTORE.md" <<EOF
# Restore instructions

Snapshot: $SNAP_NAME
Type: $TYPE
Archive: $ARCHIVE
SHA256: $CHECKSUM

## Verify
sha256sum "$ARCHIVE"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "$ARCHIVE" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "$ARCHIVE"
EOF

ln -sfn "$SNAP_DIR" "$BACKUP_ROOT/latest/$TYPE"

echo "$ARCHIVE"
