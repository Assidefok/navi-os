#!/bin/bash
# ================================================
# JEFF: Proposal Stage Deployment Trigger
# ================================================
# When a proposal passes to staging/final, 
# automatically deploy to the appropriate environment
# ================================================

WORKSPACE="/home/user/.openclaw/workspace"
SCRIPT_DIR="$WORKSPACE/scripts"
DEPLOY_SCRIPT="$SCRIPT_DIR/navios-deploy.sh"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  echo ""
  echo -e "${CYAN}Proposal Stage Deployment Trigger${NC}"
  echo ""
  echo "Usage: $0 <stage> [proposal-id]"
  echo ""
  echo "Stages:"
  echo "  staging  - Deploy to staging environment"
  echo "  final    - Deploy to final/canary environment"
  echo "  prod     - Deploy to production environment"
  echo ""
  echo "Examples:"
  echo "  $0 staging IMP-2026-04-03-01"
  echo "  $0 final IMP-2026-04-03-01"
  echo "  $0 prod IMP-2026-04-03-01"
  echo ""
}

if [ -z "$1" ]; then
  usage
  exit 1
fi

STAGE="$1"
PROPOSAL_ID="${2:-unknown}"

log_deploy() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

case "$STAGE" in
  staging)
    log_deploy "Proposal $PROPOSAL_ID → STAGING"
    log_deploy "Deploying to navi-os-staging..."
    "$DEPLOY_SCRIPT" deploy:staging
    ;;
  final)
    log_deploy "Proposal $PROPOSAL_ID → FINAL"
    log_deploy "Deploying to navi-os-final..."
    "$DEPLOY_SCRIPT" deploy:final
    ;;
  prod|production)
    log_deploy "Proposal $PROPOSAL_ID → PRODUCTION"
    log_deploy "Deploying to navi-os (production)..."
    "$DEPLOY_SCRIPT" deploy:production
    ;;
  *)
    log_error "Unknown stage: $STAGE"
    usage
    exit 1
    ;;
esac

echo ""
log_deploy "Deployment for $PROPOSAL_ID to $STAGE complete"
