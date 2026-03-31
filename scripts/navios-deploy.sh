#!/bin/bash
# ================================================
# JEFF: Navi OS Deployment Script
# ================================================
# Automates deployment and restart of Navi OS
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
NAVI_OS="$WORKSPACE/navi-os"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
ACTION="${1:-deploy}"
PORT="${2:-8100}"

usage() {
  echo "Usage: $0 [deploy|restart|status|logs] [port]"
  echo ""
  echo "Commands:"
  echo "  deploy   - Build and restart Navi OS (default)"
  echo "  restart  - Just restart the service"
  echo "  status   - Check if running"
  echo "  logs     - Show recent logs"
  echo ""
  echo "Examples:"
  echo "  $0 deploy         # Deploy on default port 8100"
  echo "  $0 deploy 8080    # Deploy on port 8080"
  echo "  $0 restart        # Restart current deployment"
  exit 1
}

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Status check
do_status() {
  log_info "Checking Navi OS status..."
  
  if pgrep -f "node.*server.js" > /dev/null; then
    PID=$(pgrep -f "node.*server.js")
    log_success "Navi OS is running (PID: $PID)"
    
    # Check if responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/api/system-metrics 2>/dev/null | grep -q "200"; then
      log_success "API responding on port $PORT"
    else
      log_warn "API not responding on port $PORT"
    fi
  else
    log_error "Navi OS is not running"
    return 1
  fi
}

# Show logs
do_logs() {
  log_info "Recent logs (last 50 lines):"
  if [ -f "$WORKSPACE/logs/navi-os.log" ]; then
    tail -50 "$WORKSPACE/logs/navi-os.log"
  else
    log_warn "No log file found at $WORKSPACE/logs/navi-os.log"
  fi
  
  # Also check PM2 logs
  if command -v pm2 &> /dev/null; then
    echo ""
    echo "PM2 logs:"
    pm2 logs navi-os --nostream --lines 20 2>/dev/null || echo "No PM2 logs available"
  fi
}

# Stop service
do_stop() {
  log_info "Stopping Navi OS..."
  
  # Kill node process
  if pkill -f "node.*server.js" 2>/dev/null; then
    log_success "Node process stopped"
  else
    log_warn "No node process found"
  fi
  
  # PM2 stop if available
  if command -v pm2 &> /dev/null; then
    pm2 stop navi-os 2>/dev/null && log_success "PM2 process stopped" || true
  fi
}

# Build the React app
do_build() {
  log_info "Building Navi OS React app..."
  
  cd "$NAVI_OS"
  
  if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
  fi
  
  npm run build
  log_success "Build complete"
  
  cd "$WORKSPACE"
}

# Start service
do_start() {
  log_info "Starting Navi OS on port $PORT..."
  
  cd "$NAVI_OS"
  
  # Ensure logs directory exists
  mkdir -p "$WORKSPACE/logs"
  
  # Start with PM2 if available, otherwise direct
  if command -v pm2 &> /dev/null; then
    pm2 start server.js --name "navi-os" -- \
      --port "$PORT" \
      >> "$WORKSPACE/logs/navi-os.log" 2>&1
    
    pm2 save 2>/dev/null || true
    log_success "Started with PM2"
  else
    # Direct node start
    PORT="$PORT" node server.js &
    log_success "Started directly (no PM2)"
  fi
  
  # Wait a moment for startup
  sleep 2
  
  # Verify
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT}/api/system-metrics 2>/dev/null | grep -q "200"; then
    log_success "Navi OS is live at http://localhost:$PORT"
  else
    log_warn "Service started but API not responding yet"
  fi
}

# Deploy (build + restart)
do_deploy() {
  log_info "=== JEFF Deployment: Navi OS ==="
  echo ""
  
  # Stop existing
  do_stop
  echo ""
  
  # Build
  do_build
  echo ""
  
  # Start
  do_start
  echo ""
  
  log_success "Deployment complete!"
  echo ""
  echo "Access Navi OS at: http://localhost:$PORT"
}

# Main
case "$ACTION" in
  deploy)
    do_deploy
    ;;
  restart)
    do_stop
    echo ""
    do_start
    ;;
  status)
    do_status
    ;;
  logs)
    do_logs
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    log_error "Unknown command: $ACTION"
    usage
    ;;
esac
