# Restore instructions

Snapshot: 20260405-020007-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260405-020007-workspace-repo-backup/20260405-020007-workspace-repo-backup.tar.gz
SHA256: ae6fb4ce8e11bf8bc9d53605911d3d9ad5c62299588f2a2fbe88e3cc05b28a70

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260405-020007-workspace-repo-backup/20260405-020007-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260405-020007-workspace-repo-backup/20260405-020007-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260405-020007-workspace-repo-backup/20260405-020007-workspace-repo-backup.tar.gz"
