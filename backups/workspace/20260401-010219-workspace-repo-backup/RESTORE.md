# Restore instructions

Snapshot: 20260401-010219-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-010219-workspace-repo-backup/20260401-010219-workspace-repo-backup.tar.gz
SHA256: c60770b7972d50b549dfef7fe29de12a5906409a445814f96d5e94b0831495c8

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-010219-workspace-repo-backup/20260401-010219-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010219-workspace-repo-backup/20260401-010219-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010219-workspace-repo-backup/20260401-010219-workspace-repo-backup.tar.gz"
