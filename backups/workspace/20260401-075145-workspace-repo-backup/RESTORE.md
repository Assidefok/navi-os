# Restore instructions

Snapshot: 20260401-075145-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-075145-workspace-repo-backup/20260401-075145-workspace-repo-backup.tar.gz
SHA256: 297cfa02bb679d3f16782a0b15090ce4642d926044624d912358279420c52c96

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-075145-workspace-repo-backup/20260401-075145-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-075145-workspace-repo-backup/20260401-075145-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-075145-workspace-repo-backup/20260401-075145-workspace-repo-backup.tar.gz"
