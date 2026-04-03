# Restore instructions

Snapshot: 20260403-020413-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260403-020413-workspace-repo-backup/20260403-020413-workspace-repo-backup.tar.gz
SHA256: f82811f2852c9f72644d7b41c974bd705008a750f140a33e5115733de67dace2

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260403-020413-workspace-repo-backup/20260403-020413-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260403-020413-workspace-repo-backup/20260403-020413-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260403-020413-workspace-repo-backup/20260403-020413-workspace-repo-backup.tar.gz"
