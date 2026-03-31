#!/bin/bash
# ============================================================================
# Navi OS Improvement System - Execució Diürna
# Implementa les millores proposades amb sistema de retry (3 intents)
# ============================================================================

set -e

PROJECT_DIR="/home/user/.openclaw/workspace/navi-os"
IMPROVEMENT_DIR="/home/user/.openclaw/workspace/navi-os-improvement"
DATE=$(date +%Y-%m-%d)
REPORT_FILE="$IMPROVEMENT_DIR/reports/${DATE}-standup.md"
LOG_FILE="$IMPROVEMENT_DIR/logs/${DATE}-executor.log"
QUEUE_FILE="$IMPROVEMENT_DIR/reports/${DATE}-queue.json"

mkdir -p "$IMPROVEMENT_DIR/reports"
mkdir -p "$IMPROVEMENT_DIR/logs"

echo "========================================" | tee -a "$LOG_FILE"
echo "NAVI OS IMPROVEMENT EXECUTOR - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Crear report inicial
cat > "$REPORT_FILE" << EOF
# Standup Navi OS - $DATE

## Resum Executiu
Cicle diari de millora de Navi OS.

---

## Millores Executades

EOF

echo "Iniciant execució de millores..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Funció per validar amb build
validate_build() {
    cd "$PROJECT_DIR"
    if npm run build 2>&1 | tee -a "$LOG_FILE"; then
        return 0
    else
        return 1
    fi
}

# Funció per executar una millora amb retry
execute_with_retry() {
    local improvement_id=$1
    local improvement_title=$2
    local improvement_steps=$3
    local max_attempts=3
    local attempt=1
    
    echo "Processant Millora #$improvement_id: $improvement_title" | tee -a "$LOG_FILE"
    
    while [ $attempt -le $max_attempts ]; do
        echo "  Intent $attempt/$max_attempts..." | tee -a "$LOG_FILE"
        
        # Aquí s'executarien els passos de la millora
        # Per ara, simulem que el testem
        
        echo "  Executant passos..." | tee -a "$LOG_FILE"
        
        # Simular implementació (en realitat aqui es cridaria el subagent)
        sleep 1
        
        # Validar amb build
        echo "  Validant amb npm run build..." | tee -a "$LOG_FILE"
        cd "$PROJECT_DIR"
        
        if npm run build > /dev/null 2>&1; then
            echo "  ✓ Millora #$improvement_id acceptada!" | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
            echo "### Millora #$improvement_id: $improvement_title" >> "$REPORT_FILE"
            echo "**Estat:** ✓ Implementada" >> "$REPORT_FILE"
            echo "**Intents:** $attempt/$max_attempts" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
            return 0
        else
            echo "  ✗ Build va fallar. Intent $attempt/$max_attempts no reeixit." | tee -a "$LOG_FILE"
            attempt=$((attempt + 1))
            if [ $attempt -le $max_attempts ]; then
                echo "  Retornant en 5 segons..." | tee -a "$LOG_FILE"
                sleep 5
            fi
        fi
    done
    
    # Si arribem aquí, la millora ha fallat 3 cops
    echo "  ✗ ALERTA: Millora #$improvement_id va fallar $max_attempts intents" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "### Millora #$improvement_id: $improvement_title" >> "$REPORT_FILE"
    echo "**Estat:** ✗ FALLIDA (3 intents)" >> "$REPORT_FILE"
    echo "**Error:** Cal revisió manual" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Enviar missatge d'error (aquí s'integraria amb Telegram)
    echo "ALERTA: Millora #$improvement_id ('$improvement_title') ha fallat dopo 3 intents. Cal revisió manual." >> "$IMPROVEMENT_DIR/pending-alerts.txt"
    
    return 1
}

# Llegir i executar les millores de la cua
if [ -f "$QUEUE_FILE" ]; then
    echo "Llegint cua de millores: $QUEUE_FILE" | tee -a "$LOG_FILE"
    
    # Per cada millora a la cua (executar-les en ordre)
    for i in 1 2 3 4 5; do
        echo "Processant millora #$i..." | tee -a "$LOG_FILE"
        
        # En una versió completa, aquí es llegiria el JSON i s'extreuria
        # la informació de cada millora. Per ara ho fem modular.
        
        # TODO: Integrar amb el sistema real de millores proposades
        # Executar amb la funció de retry
        
        echo "Millora #$i: En espera de dades reals del proposer" | tee -a "$LOG_FILE"
    done
else
    echo "No es troba fitxer de cua. Generant proposta primera..." | tee -a "$LOG_FILE"
    bash "$IMPROVEMENT_DIR/scripts/01-propose-improvements.sh"
fi

# Actualitzar report final
cat >> "$REPORT_FILE" << EOF

---

## Resum Final

- **Total millores executades:** 0
- **Total fallides:** 0
- **Rati d'èxit:** N/A

---

## Pròximes Passes

1. Revisar errors del dia
2. Proposar noves millores per demà
3. Actualitzar prioritats

---

_Standup generat automàticament per Navi OS Improvement System_
_Data: $DATE_
EOF

echo "" | tee -a "$LOG_FILE"
echo "Execució completada." | tee -a "$LOG_FILE"
echo "Report: $REPORT_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "RESULTAT: EXECUCIÓ COMPLETADA"
