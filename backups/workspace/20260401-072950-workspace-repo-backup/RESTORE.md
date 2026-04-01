# Restore instructions

Snapshot: 20260401-072950-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-072950-workspace-repo-backup/20260401-072950-workspace-repo-backup.tar.gz
SHA256: e41d40c1d3cc7b547f2acd733c52d09b17830449ccbbe3d7ee597907138fcfaa

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-072950-workspace-repo-backup/20260401-072950-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-072950-workspace-repo-backup/20260401-072950-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-072950-workspace-repo-backup/20260401-072950-workspace-repo-backup.tar.gz"
