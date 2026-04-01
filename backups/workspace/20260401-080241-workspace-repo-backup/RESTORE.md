# Restore instructions

Snapshot: 20260401-080241-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-080241-workspace-repo-backup/20260401-080241-workspace-repo-backup.tar.gz
SHA256: 7d1ea68968a81bce44418e8f38647a88fd6e574db27102763e13b3d03e830b2e

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-080241-workspace-repo-backup/20260401-080241-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-080241-workspace-repo-backup/20260401-080241-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-080241-workspace-repo-backup/20260401-080241-workspace-repo-backup.tar.gz"
