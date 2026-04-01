# Restore instructions

Snapshot: 20260401-071656-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-071656-workspace-repo-backup/20260401-071656-workspace-repo-backup.tar.gz
SHA256: d5e3716fa8fa871deea30a9aba5f13c925bd0b77b8943ca1d07033b15de3690d

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-071656-workspace-repo-backup/20260401-071656-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-071656-workspace-repo-backup/20260401-071656-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-071656-workspace-repo-backup/20260401-071656-workspace-repo-backup.tar.gz"
