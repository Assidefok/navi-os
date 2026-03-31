# Restore instructions

Snapshot: 20260331-010227-full-ui
Type: full
Archive: /home/user/.openclaw/workspace/backups/full/20260331-010227-full-ui/20260331-010227-full-ui.tar.gz
SHA256: 5551774f6a1e019f5ab38b89e22129183c6de609545ea81a00b7d5b7a6f836b2

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/full/20260331-010227-full-ui/20260331-010227-full-ui.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/full/20260331-010227-full-ui/20260331-010227-full-ui.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/full/20260331-010227-full-ui/20260331-010227-full-ui.tar.gz"
