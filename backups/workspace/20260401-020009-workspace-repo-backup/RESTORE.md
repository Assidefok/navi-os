# Restore instructions

Snapshot: 20260401-020009-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-020009-workspace-repo-backup/20260401-020009-workspace-repo-backup.tar.gz
SHA256: 55177cd5fe99b4d5dc45bc49d5858dee5e02e7f01630c1f78817c951d0338565

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-020009-workspace-repo-backup/20260401-020009-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-020009-workspace-repo-backup/20260401-020009-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-020009-workspace-repo-backup/20260401-020009-workspace-repo-backup.tar.gz"
