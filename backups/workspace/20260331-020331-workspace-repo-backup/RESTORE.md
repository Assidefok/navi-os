# Restore instructions

Snapshot: 20260331-020331-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260331-020331-workspace-repo-backup/20260331-020331-workspace-repo-backup.tar.gz
SHA256: 1d8c767f2666244d10a755206f14601410974b1ddbf9de8bd89349505f067721

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260331-020331-workspace-repo-backup/20260331-020331-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-020331-workspace-repo-backup/20260331-020331-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-020331-workspace-repo-backup/20260331-020331-workspace-repo-backup.tar.gz"
