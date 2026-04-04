#!/bin/bash
# ================================================
# JEFF + SAM: Navi OS Pipeline Deployment Script
# ================================================
# Pipeline: Lab → Staging → Final → Production
# Environments:
#   - navi-os         (production)  : port 8100 / API 3001
#   - navi-os-staging (staging)     : port 8900 / API 3002
#   - navi-os-final   (final/canary): port 9100 / API 3003
# ================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
LAB="$WORKSPACE/navi-os"
STAGING="$WORKSPACE/navi-os-staging"
FINAL="$WORKSPACE/navi-os-final"
PRODUCTION="$WORKSPACE/navi-os"

# Environment configs
declare -A ENV_PORT_API=(
  ["production"]=3001
  ["staging"]=3002
  ["final"]=3003
)
declare -A ENV_PORT_VITE=(
  ["production"]=8100
  ["staging"]=8900
  ["final"]=9100
)
declare -A ENV_DIR=(
  ["production"]="$PRODUCTION"
  ["staging"]="$STAGING"
  ["final"]="$FINAL"
  ["lab"]="$LAB"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ================================================
# Logging
# ================================================
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${MAGENTA}[STEP]${NC} $1"; }

# ================================================
# Usage
# ================================================
usage() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  JEFF + SAM: Navi OS Pipeline Deployment${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Usage: $0 <command> [environment]"
  echo ""
  echo -e "${GREEN}COMMANDS:${NC}"
  echo "  deploy:<env>   Deploy to environment (lab|staging|final|production)"
  echo "  sync:<env>     Sync code from lab to target environment"
  echo "  build:<env>    Build the React app for environment"
  echo "  start:<env>    Start services for environment"
  echo "  stop:<env>     Stop services for environment"
  echo "  restart:<env>  Restart services for environment"
  echo "  status         Show status of all environments"
  echo "  promote        Promote lab → staging → final → production"
  echo "  pipeline       Show pipeline status"
  echo ""
  echo -e "${GREEN}ENVIRONMENTS:${NC}"
  echo "  lab         Development source (navi-os)"
  echo "  staging     Pre-release testing (navi-os-staging)"
  echo "  final       Canary/release candidate (navi-os-final)"
  echo "  production  Live production (navi-os)"
  echo ""
  echo -e "${GREEN}EXAMPLES:${NC}"
  echo "  $0 deploy:staging        # Deploy current lab code to staging"
  echo "  $0 sync:final            # Sync lab code to final"
  echo "  $0 promote               # Full pipeline promotion"
  echo "  $0 status                # Check all environments"
  echo ""
  exit 1
}

# ================================================
# Environment initialization
# ================================================
init_environment() {
  local env_name="$1"
  local target_dir="${ENV_DIR[$env_name]}"
  
  if [ ! -d "$target_dir" ]; then
    log "Creating environment directory: $env_name ($target_dir)"
    mkdir -p "$target_dir"
  fi
  
  # If environment is empty, copy from lab
  if [ ! -f "$target_dir/package.json" ]; then
    log "Initializing $env_name from lab..."
    rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' \
      "$LAB/" "$target_dir/"
  fi
}

# ================================================
# Sync code from lab to target
# ================================================
do_sync() {
  local env_name="$1"
  local target_dir="${ENV_DIR[$env_name]}"
  
  if [ "$env_name" = "lab" ]; then
    log_error "Cannot sync from lab - lab is the source"
    return 1
  fi
  
  log_step "Syncing lab → $env_name"
  
  init_environment "$env_name"
  
  # Sync source code (exclude build artifacts and dependencies)
  rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' \
    --exclude='*.log' --exclude='logs/' \
    "$LAB/" "$target_dir/"
  
  log_ok "Synced to $env_name"
}

# ================================================
# Build for environment
# ================================================
do_build() {
  local env_name="$1"
  local target_dir="${ENV_DIR[$env_name]}"
  
  log_step "Building $env_name..."
  
  cd "$target_dir"
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    log "Installing dependencies for $env_name..."
    npm install 2>&1 | tail -5
  fi
  
  # Build
  npm run build
  
  log_ok "Build complete for $env_name"
  cd - > /dev/null
}

# ================================================
# Stop environment
# ================================================
do_stop() {
  local env_name="$1"
  local target_dir="${ENV_DIR[$env_name]}"
  local service_name="navi-os"
  
  case "$env_name" in
    staging) service_name="navi-os-staging" ;;
    final) service_name="navi-os-final" ;;
    production) service_name="navi-os" ;;
  esac
  
  log "Stopping $env_name ($service_name)..."
  
  # Stop PM2
  pm2 stop "$service_name" 2>/dev/null || true
  
  # Kill any remaining node processes for this environment
  pkill -f "cwd.*$target_dir" 2>/dev/null || true
  
  log_ok "Stopped $env_name"
}

# ================================================
# Start environment
# ================================================
do_start() {
  local env_name="$1"
  local target_dir="${ENV_DIR[$env_name]}"
  local api_port="${ENV_PORT_API[$env_name]}"
  local vite_port="${ENV_PORT_VITE[$env_name]}"
  local service_name="navi-os"
  
  case "$env_name" in
    staging) service_name="navi-os-staging" ;;
    final) service_name="navi-os-final" ;;
    production) service_name="navi-os" ;;
  esac
  
  log "Starting $env_name on API:$api_port VITE:$vite_port..."
  
  cd "$target_dir"
  
  # Determine ecosystem config
  local eco_config="ecosystem.config.cjs"
  if [ "$env_name" = "final" ]; then
    eco_config="ecosystem-final.config.cjs"
  elif [ "$env_name" = "staging" ]; then
    eco_config="ecosystem-staging.config.cjs"
  fi
  
  # Start API server
  pm2 start "$eco_config" 2>/dev/null || {
    # If no ecosystem, start manually
    pm2 start server.js --name "$service_name-api" -- \
      --port "$api_port" >> "$WORKSPACE/logs/navi-os-$env_name.log" 2>&1
  }
  
  # Start Vite dev server
  pm2 start "node_modules/vite/bin/vite.js" --name "$service_name-vite" -- \
    "--port $vite_port" >> "$WORKSPACE/logs/navi-os-$env_name.log" 2>&1
  
  pm2 save 2>/dev/null || true
  
  # Wait for startup
  sleep 3
  
  # Verify
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${vite_port}/" 2>/dev/null | grep -q "200"; then
    log_ok "$env_name is live at http://localhost:$vite_port"
  else
    log_warn "$env_name started but may not be responding yet"
  fi
}

# ================================================
# Deploy to environment (sync + build + restart)
# ================================================
do_deploy() {
  local env_name="$1"
  
  if [ "$env_name" = "lab" ]; then
    log_error "Cannot deploy to lab - lab is the source environment"
    return 1
  fi
  
  log_step "=== Deploying to $env_name ==="
  
  # 1. Sync from lab
  do_sync "$env_name"
  
  # 2. Build
  do_build "$env_name"
  
  # 3. Stop
  do_stop "$env_name"
  
  # 4. Start
  do_start "$env_name"
  
  log_ok "=== Deployment to $env_name complete ==="
}

# ================================================
# Promote through pipeline
# ================================================
do_promote() {
  local stages=("staging" "final" "production")
  
  log_step "=== Pipeline Promotion: Lab → Staging → Final → Production ==="
  echo ""
  
  for stage in "${stages[@]}"; do
    echo -e "${CYAN}─────────────────────────────────────${NC}"
    log_step "Promoting to: $stage"
    echo ""
    
    do_deploy "$stage"
    
    if [ "$stage" != "production" ]; then
      echo ""
      log_warn "Review $stage before proceeding to next stage"
      echo -e "${YELLOW}Press Enter to continue to next stage (Ctrl+C to abort)...${NC}"
      read -r
    fi
    
    echo ""
  done
  
  log_ok "=== Full pipeline promotion complete ==="
  log "All environments are now aligned with lab code"
}

# ================================================
# Status of all environments
# ================================================
do_status() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Navi OS Pipeline Status${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  
  local environments=("lab" "staging" "final" "production")
  
  for env_name in "${environments[@]}"; do
    local target_dir="${ENV_DIR[$env_name]}"
    local vite_port="${ENV_PORT_VITE[$env_name]}"
    local api_port="${ENV_PORT_API[$env_name]}"
    
    echo -e "${GREEN}━━━ $env_name${NC} (${target_dir})"
    echo "  Ports: API=$api_port VITE=$vite_port"
    
    if [ -d "$target_dir" ]; then
      if [ -d "$target_dir/dist" ]; then
        echo -e "  ${GREEN}✓${NC} Built"
      else
        echo -e "  ${YELLOW}○${NC} Not built"
      fi
      
      # Check if responding
      if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${vite_port}/" 2>/dev/null | grep -q "200"; then
        echo -e "  ${GREEN}✓${NC} Running on port $vite_port"
      else
        echo -e "  ${RED}✗${NC} Not responding on port $vite_port"
      fi
    else
      echo -e "  ${RED}✗${NC} Directory not found"
    fi
    
    echo ""
  done
}

# ================================================
# Show pipeline
# ================================================
do_pipeline() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Navi OS Deployment Pipeline${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${GREEN}LAB${NC}    →  Development source (navi-os)"
  echo -e "    ↓"
  echo -e "  ${YELLOW}STAGING${NC} →  Pre-release testing (navi-os-staging)"
  echo -e "    ↓"
  echo -e "  ${MAGENTA}FINAL${NC}   →  Canary/Release candidate (navi-os-final)"
  echo -e "    ↓"
  echo -e "  ${CYAN}PRODUCTION${NC} → Live system (navi-os)"
  echo ""
  echo -e "Promote command flow:"
  echo "  $0 deploy:staging   # Lab → Staging"
  echo "  $0 deploy:final     # Lab → Final"
  echo "  $0 deploy:production # Lab → Production"
  echo "  $0 promote          # Full: Lab → Staging → Final → Production"
  echo ""
}

# ================================================
# Create ecosystem config for final environment
# ================================================
create_final_ecosystem() {
  cat > "$FINAL/ecosystem-final.config.cjs" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'navi-os-final-api',
      script: 'server.js',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-final',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'navi-os-final-vite',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 9100',
      interpreter: 'node',
      cwd: '/home/user/.openclaw/workspace/navi-os-final',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 5,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOF
  log_ok "Created ecosystem-final.config.cjs"
}

# ================================================
# Create vite config for final environment
# ================================================
create_final_vite_config() {
  cat > "$FINAL/vite.config.js" << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9100,
    host: true,
    allowedHosts: ['n100.casa', 'localhost', '127.0.0.1', '192.168.1.101'],
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      }
    }
  }
})
EOF
  log_ok "Created vite.config.js for final"
}

# ================================================
# Setup final environment
# ================================================
setup_final() {
  log "Setting up final environment..."
  
  init_environment "final"
  create_final_ecosystem
  create_final_vite_config
  
  log_ok "Final environment ready"
}

# ================================================
# Main
# ================================================
COMMAND="${1:-}"
shift || true

if [ -z "$COMMAND" ]; then
  usage
fi

# Parse command:deploy:env format
if [[ "$COMMAND" == deploy:* ]]; then
  ENV="${COMMAND#deploy:}"
  do_deploy "$ENV"
elif [[ "$COMMAND" == sync:* ]]; then
  ENV="${COMMAND#sync:}"
  do_sync "$ENV"
elif [[ "$COMMAND" == build:* ]]; then
  ENV="${COMMAND#build:}"
  do_build "$ENV"
elif [[ "$COMMAND" == start:* ]]; then
  ENV="${COMMAND#start:}"
  do_start "$ENV"
elif [[ "$COMMAND" == stop:* ]]; then
  ENV="${COMMAND#stop:}"
  do_stop "$ENV"
elif [[ "$COMMAND" == restart:* ]]; then
  ENV="${COMMAND#restart:}"
  do_stop "$ENV"
  do_start "$ENV"
elif [[ "$COMMAND" == "promote" ]]; then
  do_promote
elif [[ "$COMMAND" == "status" ]]; then
  do_status
elif [[ "$COMMAND" == "pipeline" ]]; then
  do_pipeline
elif [[ "$COMMAND" == "setup:final" ]]; then
  setup_final
elif [[ "$COMMAND" == "help" || "$COMMAND" == "--help" || "$COMMAND" == "-h" ]]; then
  usage
else
  log_error "Unknown command: $COMMAND"
  usage
fi
