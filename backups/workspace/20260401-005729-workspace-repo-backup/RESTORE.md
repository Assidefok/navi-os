# Restore instructions

Snapshot: 20260401-005729-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-005729-workspace-repo-backup/20260401-005729-workspace-repo-backup.tar.gz
SHA256: e59a7d7e1e2d669fb2121ee558e43675b989057b7470d019bbc3dd66c7cfa4f0

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-005729-workspace-repo-backup/20260401-005729-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-005729-workspace-repo-backup/20260401-005729-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-005729-workspace-repo-backup/20260401-005729-workspace-repo-backup.tar.gz"
