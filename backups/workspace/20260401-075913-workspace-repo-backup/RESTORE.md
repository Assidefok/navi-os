# Restore instructions

Snapshot: 20260401-075913-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-075913-workspace-repo-backup/20260401-075913-workspace-repo-backup.tar.gz
SHA256: 5045588749a19d443f7fd45f2425933065d2ec105c0e5a2a9388c47d8c736929

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-075913-workspace-repo-backup/20260401-075913-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-075913-workspace-repo-backup/20260401-075913-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-075913-workspace-repo-backup/20260401-075913-workspace-repo-backup.tar.gz"
