# Restore instructions

Snapshot: 20260401-010433-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-010433-workspace-repo-backup/20260401-010433-workspace-repo-backup.tar.gz
SHA256: 5d17bb106f778aa75cd3d96858f9b65d1c5ac3f8869eb524998693846db49d60

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-010433-workspace-repo-backup/20260401-010433-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010433-workspace-repo-backup/20260401-010433-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010433-workspace-repo-backup/20260401-010433-workspace-repo-backup.tar.gz"
