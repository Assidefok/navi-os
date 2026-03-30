#!/bin/bash
# Navi OS Startup Script
# Starts both the API server and Vite dev server

WORKSPACE="/home/user/.openclaw/workspace/navi-os"
LOG_DIR="$WORKSPACE/logs"
mkdir -p "$LOG_DIR"

# Function to start API server
start_api() {
    cd "$WORKSPACE"
    echo "[$(date)] Starting Navi OS API server..." >> "$LOG_DIR/startup.log"
    node server.js >> "$LOG_DIR/api.log" 2>&1 &
    echo $! > "$LOG_DIR/api.pid"
    echo "API server started with PID $(cat $LOG_DIR/api.pid)"
}

# Function to start Vite dev server
start_vite() {
    cd "$WORKSPACE"
    echo "[$(date)] Starting Vite dev server..." >> "$LOG_DIR/startup.log"
    npm run dev >> "$LOG_DIR/vite.log" 2>&1 &
    echo $! > "$LOG_DIR/vite.pid"
    echo "Vite started with PID $(cat $LOG_DIR/vite.pid)"
}

# Parse arguments
case "$1" in
    api-only)
        start_api
        ;;
    vite-only)
        start_vite
        ;;
    all|*)
        start_api
        sleep 1
        start_vite
        ;;
esac

echo "Startup complete. Check $LOG_DIR for logs."