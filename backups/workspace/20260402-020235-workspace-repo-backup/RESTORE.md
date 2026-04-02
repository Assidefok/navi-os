# Restore instructions

Snapshot: 20260402-020235-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260402-020235-workspace-repo-backup/20260402-020235-workspace-repo-backup.tar.gz
SHA256: dca33abb1b572ae2568b61e8a2930ac02e661d7f7283232a2bf968a294719b73

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260402-020235-workspace-repo-backup/20260402-020235-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260402-020235-workspace-repo-backup/20260402-020235-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260402-020235-workspace-repo-backup/20260402-020235-workspace-repo-backup.tar.gz"
