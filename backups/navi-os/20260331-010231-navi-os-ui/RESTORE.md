# Restore instructions

Snapshot: 20260331-010231-navi-os-ui
Type: navi-os
Archive: /home/user/.openclaw/workspace/backups/navi-os/20260331-010231-navi-os-ui/20260331-010231-navi-os-ui.tar.gz
SHA256: 2315a3d22c0ed87d723eaaadbd81dc5e68c2b0668ca7c3aa0425df4211fc654f

## Verify
sha256sum "/home/user/.openclaw/workspace/backups/navi-os/20260331-010231-navi-os-ui/20260331-010231-navi-os-ui.tar.gz"

## Restore preview
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/navi-os/20260331-010231-navi-os-ui/20260331-010231-navi-os-ui.tar.gz" --dry-run

## Restore for real
/home/user/.openclaw/workspace/scripts/07-backup-restore.sh "/home/user/.openclaw/workspace/backups/navi-os/20260331-010231-navi-os-ui/20260331-010231-navi-os-ui.tar.gz"
