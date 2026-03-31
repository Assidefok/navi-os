# Restore instructions

Snapshot: 20260331-010223-workspace-ui
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260331-010223-workspace-ui/20260331-010223-workspace-ui.tar.gz
SHA256: 61f1a16aa38b576057b1577d786d558bcbf62d26aaa38142699eacf8ee54df18

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260331-010223-workspace-ui/20260331-010223-workspace-ui.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-010223-workspace-ui/20260331-010223-workspace-ui.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-010223-workspace-ui/20260331-010223-workspace-ui.tar.gz"
