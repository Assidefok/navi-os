#!/bin/bash
# Proposals Watcher - S'inicia amb PM2, vigila canvis a proposals.json
# Quan detecta canvi → activa Navi via cron ONE-TIME

WATCH_FILE="/home/user/.openclaw/workspace/data/proposals.json"
WATCHER_LOG="/home/user/.openclaw/workspace/logs/proposals-watcher.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$WATCHER_LOG"
}

# Crear directori de logs si no existeix
mkdir -p "$(dirname "$WATCHER_LOG")"

# Verificar que inotifywait existeix
if ! command -v inotifywait &> /dev/null; then
    log "ERROR: inotifywait no trobat. Instal·lant..."
    sudo apt-get install -y inotify-tools >> "$WATCHER_LOG" 2>&1
fi

log "PROPOSALS WATCHER INICIAT - vigilant: $WATCH_FILE"

# Vigilar canvis (modify, create, close_write)
inotifywait -m -e modify,close_write "$WATCH_FILE" 2>/dev/null | while read DIRECTORY EVENT FILE; do
    log "DETECTAT CANVI: $EVENT a $FILE"
    
    # Notificar a Navi que cal llegir propostes
    # Crear fitxer de trigger perquè Navi el trobi quan es desperti
    TRIGGER_FILE="/home/user/.openclaw/workspace/.proposals-trigger"
    echo "CHANGE_DETECTED=$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_FILE"
    
    log "Trigger creat. Notificant a OpenClaw..."
    
    # Notificar a OpenClaw mitjançant sessions_send (si disponible)
    # O pitjor cas: crear un cron inmediat
    openclaw session send main "PROPOSAL_CHANGE_DETECTED" 2>/dev/null || true
    
    log "Notificació enviada a OpenClaw"
done
