#!/bin/bash
# ================================================
# JEFF: Operations Automation Script
# ================================================
# Automates common operations and workflows
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

COMMAND="${1:-help}"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
  echo "JEFF Operations Automation"
  echo ""
  echo "Usage: $0 <command>"
  echo ""
  echo "Commands:"
  echo "  morning-check    - Run morning health check"
  echo "  evening-wrap     - Evening wrap-up and backup"
  echo "  deploy-all       - Deploy all services"
  echo "  status-all       - Status of all services"
  echo "  restart-all      - Restart all services"
  echo "  backup-workspace - Full workspace backup"
  echo "  clean-logs       - Clean old logs"
  echo ""
}

# ─── Morning Check ─────────────────────────────────────────────────────────
do_morning-check() {
  log_info "=== BON DIA! Morning Check ==="
  echo ""
  
  # System metrics
  echo -e "${CYAN}System Status:${NC}"
  uptime
  echo ""
  
  # Navi OS status
  echo -e "${CYAN}Navi OS:${NC}"
  if pgrep -f "node.*server.js" > /dev/null; then
    log_success "Navi OS: Running"
    curl -s -o /dev/null -w "API Response: %{http_code}\n" http://localhost:8100/api/system-metrics 2>/dev/null || true
  else
    log_warn "Navi OS: Not running"
  fi
  echo ""
  
  # PM2 processes
  if command -v pm2 &> /dev/null; then
    echo -e "${CYAN}PM2:${NC}"
    pm2 list 2>/dev/null | grep -E "online|errored" | head -5 || log_info "No PM2 processes"
    echo ""
  fi
  
  # OpenClaw
  echo -e "${CYAN}OpenClaw Gateway:${NC}"
  if command -v openclaw &> /dev/null; then
    if openclaw gateway status 2>/dev/null | grep -q "running"; then
      log_success "Gateway: Running"
    else
      log_warn "Gateway: Not running"
    fi
  fi
  echo ""
  
  # Git status
  echo -e "${CYAN}Git:${NC}"
  cd "$WORKSPACE"
  if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    STATUS=$(git status --porcelain | wc -l)
    log_info "Branch: $BRANCH, Changes: $STATUS"
  fi
  echo ""
  
  # Disk space
  echo -e "${CYAN}Disk:${NC}"
  df -h /home | tail -1 | awk '{print "  "$1" "$2" used ("$5")"}'
  echo ""
  
  log_success "Morning check complete!"
}

# ─── Evening Wrap ──────────────────────────────────────────────────────────
do_evening-wrap() {
  log_info "=== Evening Wrap-Up ==="
  echo ""
  
  # Commit any pending changes
  cd "$WORKSPACE"
  if git status --porcelain | grep -q .; then
    log_info "Committing pending changes..."
    git add -A
    git commit -m "EOD: $(date '+%Y-%m-%d %H:%M')"
    git push 2>/dev/null || log_warn "Git push failed (may be offline)"
    log_success "Changes committed and pushed"
  else
    log_info "No pending changes"
  fi
  echo ""
  
  # Run backup
  log_info "Running backup..."
  bash "$WORKSPACE/scripts/01-repo-backup.sh" 2>/dev/null || log_warn "Backup failed"
  log_success "Backup complete"
  echo ""
  
  # Clean old logs
  log_info "Cleaning old logs..."
  find "$WORKSPACE/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
  log_success "Logs cleaned"
  echo ""
  
  # Save PM2 state
  if command -v pm2 &> /dev/null; then
    pm2 save 2>/dev/null || true
    log_success "PM2 state saved"
  fi
  
  echo ""
  log_success "Evening wrap complete! Bona nit!"
}

# ─── Deploy All ────────────────────────────────────────────────────────────
do_deploy-all() {
  log_info "=== Deploy All Services ==="
  echo ""
  
  # Deploy Navi OS
  if [ -f "$WORKSPACE/scripts/navios-deploy.sh" ]; then
    bash "$WORKSPACE/scripts/navios-deploy.sh" deploy
  else
    log_warn "navios-deploy.sh not found"
  fi
  
  echo ""
  log_success "All services deployed!"
}

# ─── Status All ────────────────────────────────────────────────────────────
do_status-all() {
  log_info "=== Status All Services ==="
  echo ""
  
  # Navi OS
  echo -e "${CYAN}Navi OS:${NC}"
  if pgrep -f "node.*server.js" > /dev/null; then
    PID=$(pgrep -f "node.*server.js")
    log_success "Running (PID: $PID)"
    curl -s -o /dev/null -w "  HTTP: %{http_code}\n" http://localhost:8100/api/system-metrics 2>/dev/null || true
  else
    log_warn "Not running"
  fi
  echo ""
  
  # PM2
  if command -v pm2 &> /dev/null; then
    echo -e "${CYAN}PM2:${NC}"
    pm2 list 2>/dev/null | head -15 || true
    echo ""
  fi
  
  # OpenClaw
  echo -e "${CYAN}OpenClaw:${NC}"
  if command -v openclaw &> /dev/null; then
    openclaw gateway status 2>/dev/null | head -5 || log_warn "Gateway check failed"
  else
    log_warn "OpenClaw CLI not found"
  fi
  echo ""
  
  # Docker (if any)
  if command -v docker &> /dev/null; then
    echo -e "${CYAN}Docker:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | head -10 || log_info "No containers"
    echo ""
  fi
}

# ─── Restart All ───────────────────────────────────────────────────────────
do_restart-all() {
  log_info "=== Restart All Services ==="
  echo ""
  
  # Restart Navi OS
  if [ -f "$WORKSPACE/scripts/navios-deploy.sh" ]; then
    bash "$WORKSPACE/scripts/navios-deploy.sh" restart
  fi
  
  echo ""
  log_success "All services restarted!"
}

# ─── Backup Workspace ──────────────────────────────────────────────────────
do_backup-workspace() {
  log_info "=== Full Workspace Backup ==="
  echo ""
  
  cd "$WORKSPACE"
  bash scripts/01-repo-backup.sh
  
  echo ""
  log_success "Workspace backup complete!"
}

# ─── Clean Logs ───────────────────────────────────────────────────────────
do_clean-logs() {
  log_info "=== Clean Old Logs ==="
  echo ""
  
  # Find and remove old logs
  COUNT=$(find "$WORKSPACE/logs" -name "*.log" -mtime +7 2>/dev/null | wc -l)
  if [ "$COUNT" -gt 0 ]; then
    find "$WORKSPACE/logs" -name "*.log" -mtime +7 -delete 2>/dev/null
    log_success "Removed $COUNT old log files"
  else
    log_info "No old logs to clean"
  fi
  
  # Clean npm cache
  if [ -d "$WORKSPACE/navi-os/node_modules" ]; then
    # Find large node_modules subdirs
    find "$WORKSPACE/navi-os/node_modules" -name ".cache" -type d 2>/dev/null | xargs rm -rf 2>/dev/null || true
  fi
  
  echo ""
  log_success "Log cleanup complete!"
}

# ─── Main ──────────────────────────────────────────────────────────────────
case "$COMMAND" in
  morning-check)  do_morning-check ;;
  evening-wrap)   do_evening-wrap ;;
  deploy-all)     do_deploy-all ;;
  status-all)     do_status-all ;;
  restart-all)    do_restart-all ;;
  backup-workspace) do_backup-workspace ;;
  clean-logs)     do_clean-logs ;;
  help|--help|-h) usage ;;
  *)              log_error "Unknown command: $COMMAND"; usage; exit 1 ;;
esac
