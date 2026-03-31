# Restore instructions

Snapshot: 20260401-005635-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-005635-workspace-repo-backup/20260401-005635-workspace-repo-backup.tar.gz
SHA256: 436ba637bd2c4763715dce01fd9495e25abc0a8779b7c4e933119c185557c4ad

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-005635-workspace-repo-backup/20260401-005635-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-005635-workspace-repo-backup/20260401-005635-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-005635-workspace-repo-backup/20260401-005635-workspace-repo-backup.tar.gz"
