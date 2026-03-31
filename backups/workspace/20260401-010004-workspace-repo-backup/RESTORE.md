# Restore instructions

Snapshot: 20260401-010004-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-010004-workspace-repo-backup/20260401-010004-workspace-repo-backup.tar.gz
SHA256: 32b2944589f9e1843f424493d19facae72e2ffb2b6ed78302d65fb93a01d34f6

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-010004-workspace-repo-backup/20260401-010004-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010004-workspace-repo-backup/20260401-010004-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010004-workspace-repo-backup/20260401-010004-workspace-repo-backup.tar.gz"
