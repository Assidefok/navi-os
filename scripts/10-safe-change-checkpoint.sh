#!/bin/bash
# Create a checkpoint before major changes
set -euo pipefail

LABEL="${1:-pre-change}"
/home/user/.openclaw/workspace/scripts/06-backup-create.sh workspace "$LABEL"
/home/user/.openclaw/workspace/scripts/09-backup-prune.sh 7
