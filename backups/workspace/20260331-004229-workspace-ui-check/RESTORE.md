# Restore instructions

Snapshot: 20260331-004229-workspace-ui-check
Type: workspace
Archive: /home/user/.openclaw/workspace/backups/workspace/20260331-004229-workspace-ui-check/20260331-004229-workspace-ui-check.tar.gz
SHA256: 39b575f25bfdea24255ff65371f32042a1265b5689dcea6b276e6e1e8eb9bd47

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/workspace/20260331-004229-workspace-ui-check/20260331-004229-workspace-ui-check.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-004229-workspace-ui-check/20260331-004229-workspace-ui-check.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/workspace/20260331-004229-workspace-ui-check/20260331-004229-workspace-ui-check.tar.gz"
