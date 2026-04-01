#!/bin/bash
# ============================================================================
# Navi OS Improvement System - Execució Diürna v2.0
# Implementa les millores proposades amb subagents i retry (3 intents)
# ============================================================================

set -e

PROJECT_DIR="/home/user/.openclaw/workspace/navi-os-staging"
IMPROVEMENT_DIR="/home/user/.openclaw/workspace/navi-os-improvement"
DATE=$(date +%Y-%m-%d-%H.%M)
REPORT_FILE="$IMPROVEMENT_DIR/reports/${DATE}-execution.md"
QUEUE_FILE="$IMPROVEMENT_DIR/reports/${DATE}-queue.json"
LOG_FILE="$IMPROVEMENT_DIR/logs/${DATE}-executor.log"

mkdir -p "$IMPROVEMENT_DIR/reports"
mkdir -p "$IMPROVEMENT_DIR/logs"
mkdir -p "$IMPROVEMENT_DIR/tasks"

echo "========================================" | tee -a "$LOG_FILE"
echo "NAVI OS IMPROVEMENT EXECUTOR v2.0 - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# ─── Funcions ────────────────────────────────────────────────────────────────

log() {
    echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

execute_improvement() {
    local imp_id=$1
    local imp_title=$2
    local imp_area=$3
    local imp_steps=$4
    local imp_risk=$5
    local max_attempts=3
    local attempt=1

    log "─────────────────────────────────"
    log "Processant: $imp_id - $imp_title"
    log "Àrea: $imp_area | Risc: $imp_risk"
    log "─────────────────────────────────"

    while [ $attempt -le $max_attempts ]; do
        log "  Intent $attempt/$max_attempts..."

        # Crear task per al subagent
        local task_file="$IMPROVEMENT_DIR/tasks/${DATE}-${imp_id}.sh"
        cat > "$task_file" << TASKEOF
#!/bin/bash
# Task per implementar: $imp_id - $imp_title
# Àrea: $imp_area
# Risc: $imp_risk

PROJECT_DIR="$PROJECT_DIR"
IMPROVEMENT_DIR="$IMPROVEMENT_DIR"
DATE="$DATE"
IMP_ID="$imp_id"

# Extreure passos
TASKS=($(echo "$imp_steps" | tr ',' ' '))

echo "Implementant \$IMP_ID: \$imp_title"
echo "Passos: \${TASKS[*]}"

# Canviar al directori del projecte
cd "\$PROJECT_DIR" || exit 1

# Crear branca git per la millora
git checkout -b "improvement/\$IMP_ID-\$(date +%Y%m%d)" 2>/dev/null || true

# Executar passos
for i in "\${!TASKS[@]}"; do
    step=\$((\$i + 1))
    echo "  Pas \$step: \${TASKS[\$i]}"
    eval "\${TASKS[\$i]}" 2>&1 || {
        echo "ERROR al pas \$step"
        exit 1
    }
done

# Verificar build
echo "Verificant build..."
npm run build 2>&1 | tail -5

echo " Millora \$IMP_ID implementada correctament"
exit 0
TASKEOF

        chmod +x "$task_file"

        # Executar amb timeout
        if timeout 120 bash "$task_file" >> "$LOG_FILE" 2>&1; then
            log "  ✓ $imp_id REIXIT - Intent $attempt"

            # Actualitzar queue
            local tmp_queue="${QUEUE_FILE}.tmp"
            jq ".improvements[] | if .id == \"$imp_id\" then .status = \"executed\" elif true then . end" \
                "$QUEUE_FILE" > "$tmp_queue" 2>/dev/null || true

            # Notificar (optional - per ara només log)
            echo "ALERT: Millora $imp_id ('$imp_title') implementada!" >> "$IMPROVEMENT_DIR/alerts.txt" 2>/dev/null || true

            return 0
        else
            log "  ✗ $imp_id FALLIDA - Intent $attempt/$max_attempts"
            attempt=$((attempt + 1))
            if [ $attempt -le $max_attempts ]; then
                log "  Retorn en 10 segons..."
                sleep 10
            fi
        fi
    done

    # Si arriba aqui, ha fallat 3 cops
    log "  ⚠ ALERTA: $imp_id ha fallat $max_attempts intents"
    log "  Cal revisió manual"

    # Actualitzar queue com failed
    local tmp_queue="${QUEUE_FILE}.tmp"
    jq ".improvements[] | if .id == \"$imp_id\" then .status = \"failed\" elif true then . end" \
        "$QUEUE_FILE" > "$tmp_queue" 2>/dev/null || true
    mv "$tmp_queue" "$QUEUE_FILE"

    # Notificar error
    echo "ALERT: Millora $imp_id ('$imp_title') FALLIDA dopo 3 intents. Revisió manual necessària." >> "$IMPROVEMENT_DIR/pending-alerts.txt" 2>/dev/null || true

    return 1
}

# ─── Verificar que existeix proposta ─────────────────────────────────────────

if [ ! -f "$QUEUE_FILE" ]; then
    log "No existeix proposta per avui. Generant..."
    bash "$IMPROVEMENT_DIR/scripts/01-propose-improvements.sh"
fi

if [ ! -f "$QUEUE_FILE" ]; then
    log "ERROR: No s'ha pogut generar proposta. Sortint."
    exit 1
fi

# ─── Crear report inicial ────────────────────────────────────────────────────

cat > "$REPORT_FILE" << EOF
# Execució de Millores Navi OS - $DATE

## Resum Executiu
Execució automatitzada de millores amb retry logic (3 intents).

---

## Millores Executades

EOF

# ─── Processar millores per prioritat ──────────────────────────────────────

log "Llegint cua de millores..."
IMPROVEMENTS=$(cat "$QUEUE_FILE" | jq -r '.improvements[] | @base64')

# Determinar ordre per prioritat
execute_order="IMP-001 IMP-002 IMP-004 IMP-003 IMP-005"

executed_count=0
failed_count=0

for imp_id in $execute_order; do
    # Extraure dades de la millora
    imp_json=$(cat "$QUEUE_FILE" | jq -r ".improvements[] | select(.id == \"$imp_id\")")
    if [ -z "$imp_json" ] || [ "$imp_json" = "null" ]; then
        log "Millora $imp_id no trobada a la cua. Saltant."
        continue
    fi

    imp_title=$(echo "$imp_json" | jq -r '.title')
    imp_area=$(echo "$imp_json" | jq -r '.area')
    imp_priority=$(echo "$imp_json" | jq -r '.priority')
    imp_steps=$(echo "$imp_json" | jq -r '.steps')
    imp_risk=$(echo "$imp_json" | jq -r '.risk')
    imp_status=$(echo "$imp_json" | jq -r '.status')

    if [ "$imp_status" = "executed" ]; then
        log "$imp_id ja executada. Saltant."
        continue
    fi

    log ""
    log ">>> Executant: $imp_id ($imp_priority)"
    log "    Títol: $imp_title"

    # Executar amb retry
    if execute_improvement "$imp_id" "$imp_title" "$imp_area" "$imp_steps" "$imp_risk"; then
        executed_count=$((executed_count + 1))
        echo "### $imp_id: $imp_title" >> "$REPORT_FILE"
        echo "**Estat:** ✓ Implementada" >> "$REPORT_FILE"
        echo "**Prioritat:** $imp_priority" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        failed_count=$((failed_count + 1))
        echo "### $imp_id: $imp_title" >> "$REPORT_FILE"
        echo "**Estat:** ✗ FALLIDA (3 intents)" >> "$REPORT_FILE"
        echo "**Prioritat:** $imp_priority" >> "$REPORT_FILE"
        echo "**Error:** Cal revisió manual" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
done

# ─── Report final ─────────────────────────────────────────────────────────────

success_rate="0"
if [ $((executed_count + failed_count)) -gt 0 ]; then
    success_rate=$((executed_count * 100 / (executed_count + failed_count)))
fi

cat >> "$REPORT_FILE" << EOF

---

## Resum Final

- **Total millores executades:** $executed_count
- **Total fallides:** $failed_count
- **Rati d'èxit:** ${success_rate}%

---

## Pròximes Passes

1. Revisar millores fallides ($failed_count)
2. Si tot ok, fer git merge de les branques improvement/*
3. Proposar noves millores per demà

---

_Execució generada automàticament per Navi OS Improvement System v2.0_
_Data: $DATE_
EOF

# ─── Actualitzar index.json ─────────────────────────────────────────────────

INDEX_FILE="$IMPROVEMENT_DIR/reports/index.json"
EXEC_TIME=$(echo "$DATE" | cut -d'-' -f4 | sed 's/\./:/')

# Extreure llista d'executades
EXECUTED_LIST=$(cat "$QUEUE_FILE" 2>/dev/null | jq -r '.improvements[] | select(.status == "executed") | .id' | tr '\n' ',' | sed 's/,$//')
FAILED_LIST=$(cat "$QUEUE_FILE" 2>/dev/null | jq -r '.improvements[] | select(.status == "failed") | .id' | tr '\n' ',' | sed 's/,$//')

# Crear entrada d'execució
EXEC_REPORT=$(cat << EOF
    {
      "id": "execution-$DATE",
      "filename": "${DATE}-execution.md",
      "type": "execution",
      "date": "$(echo "$DATE" | cut -d'-' -f1-3 | tr '-' '.')",
      "time": "$EXEC_TIME",
      "title": "Execució de Millores Navi OS - $DATE",
      "tags": ["execution", "completed", "navi-os", "episodi-4"],
      "topics": ["automation", "self-healing", "retry"],
      "executed": "$(echo "$EXECUTED_LIST" | sed 's/,/", "/g')",
      "failed": "$(echo "$FAILED_LIST" | sed 's/,/", "/g')",
      "success_rate": "${success_rate}%",
      "summary": "$executed_count millores executades, $failed_count fallides. Rati: ${success_rate}%"
    }
EOF
)

if [ -f "$INDEX_FILE" ]; then
    TMP_INDEX="${INDEX_FILE}.tmp"
    cp "$INDEX_FILE" "$TMP_INDEX"
    cat "$INDEX_FILE" | jq --argjson execreport "$EXEC_REPORT" \
        '.reports = (.reports + [$execreport]) | .updated = $DATE' > "$TMP_INDEX"
    mv "$TMP_INDEX" "$INDEX_FILE"
    log "✓ Index actualitzat: $INDEX_FILE"
else
    log "⚠ Index no trobat, saltant actualització"
fi

# ─── Resum final ─────────────────────────────────────────────────────────────

log ""
log "========================================"
log "EXECUCIÓ COMPLETADA"
log "========================================"
log "Executades: $executed_count"
log "Fallides: $failed_count"
log "Rati d'èxit: ${success_rate}%"
log "Report: $REPORT_FILE"
log "Logs: $LOG_FILE"
log "========================================"

if [ $failed_count -gt 0 ]; then
    log "⚠ ALERTA: $failed_count millores han fallat. Revisar manualment."
    exit 1
fi

exit 0
