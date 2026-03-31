# Restore instructions

Snapshot: 20260401-010744-workspace-repo-backup
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260401-010744-workspace-repo-backup/20260401-010744-workspace-repo-backup.tar.gz
SHA256: eacc05b805d54ce369543888d828ae18d413a4ee8553b2b7097050953879bf74

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260401-010744-workspace-repo-backup/20260401-010744-workspace-repo-backup.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010744-workspace-repo-backup/20260401-010744-workspace-repo-backup.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260401-010744-workspace-repo-backup/20260401-010744-workspace-repo-backup.tar.gz"
