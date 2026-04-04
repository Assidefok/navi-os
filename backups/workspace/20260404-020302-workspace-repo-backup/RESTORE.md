# Restore instructions

Snapshot: 20260404-020302-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260404-020302-workspace-repo-backup/20260404-020302-workspace-repo-backup.tar.gz
SHA256: a80a8accd40be168113fa308133474348dd4ecb4098f6ce289e1e75e1b4bfb26

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260404-020302-workspace-repo-backup/20260404-020302-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260404-020302-workspace-repo-backup/20260404-020302-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260404-020302-workspace-repo-backup/20260404-020302-workspace-repo-backup.tar.gz"
