#!/bin/bash
# ============================================================================
# Navi OS Improvement System - Proposta Nocturna
# Analitza el codi i proposa 5 millores pel dia següent
# ============================================================================

set -e

PROJECT_DIR="/home/user/.openclaw/workspace/navi-os"
IMPROVEMENT_DIR="/home/user/.openclaw/workspace/navi-os-improvement"
DATE=$(date +%Y-%m-%d)
PROPOSAL_FILE="$IMPROVEMENT_DIR/reports/${DATE}-improvements.md"
LOG_FILE="$IMPROVEMENT_DIR/logs/${DATE}-proposer.log"

mkdir -p "$IMPROVEMENT_DIR/reports"
mkdir -p "$IMPROVEMENT_DIR/logs"

echo "========================================" | tee -a "$LOG_FILE"
echo "NAVI OS IMPROVEMENT PROPOSER - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Fase 1: Analitzar estructura del projecte
echo "Analitzant estructura de Navi OS..." | tee -a "$LOG_FILE"

# Obtenir llistat de fitxers recents
echo "Fitxers principals:" | tee -a "$LOG_FILE"
find "$PROJECT_DIR/src" -name "*.jsx" -o -name "*.js" -o -name "*.css" 2>/dev/null | head -30 | tee -a "$LOG_FILE"

# Obtenir estat de git recent
echo "" | tee -a "$LOG_FILE"
echo "Canvis recents:" | tee -a "$LOG_FILE"
cd "$PROJECT_DIR" && git log --oneline -10 2>/dev/null | tee -a "$LOG_FILE" || echo "No git history" | tee -a "$LOG_FILE"

# Revisar package.json per entendre dependències
echo "" | tee -a "$LOG_FILE"
echo "Dependències principals:" | tee -a "$LOG_FILE"
cat "$PROJECT_DIR/package.json" 2>/dev/null | grep -E '"name"|"version"|"dependencies"' | head -20 | tee -a "$LOG_FILE" || echo "No package.json" | tee -a "$LOG_FILE"

# Identificar àrees de millora
echo "" | tee -a "$LOG_FILE"
echo "Identificant àrees de millora..." | tee -a "$LOG_FILE"

# Buscar possibles problemes
echo "Buscant Debt tècnic..." | tee -a "$LOG_FILE"

# Comptar línies de codi per component
echo "" | tee -a "$LOG_FILE"
echo "Mètriques de codi:" | tee -a "$LOG_FILE"
find "$PROJECT_DIR/src" -name "*.jsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -5 | tee -a "$LOG_FILE"

# Crear proposta de millores
cat > "$PROPOSAL_FILE" << EOF
# Proposta de Millores Navi OS - $DATE

## Resum Executiu
Proposta de 5 millores identificades per al cicle diari de Navi OS.

---

## Millora 1: [TITOL]
**Àrea:** [Component/Àrea]
**Tipus:** [Bug fix / Millora / Optimització / Nova funcionalitat]
**Prioritat:** [Alta/Mitjana/Baixa]
**Impacte:** [Què millora concretament]
**Passos d'implementació:**
1. [Pas 1]
2. [Pas 2]
3. [Pas 3]
**Risc:** [Baix/Mitjà/Alt]

---

## Millora 2: [TITOL]
**Àrea:** [Component/Àrea]
**Tipus:** [Bug fix / Millora / Optimització / Nova funcionalitat]
**Prioritat:** [Alta/Mitjana/Baixa]
**Impacte:** [Què millora concretament]
**Passos d'implementació:**
1. [Pas 1]
2. [Pas 2]
3. [Pas 3]
**Risc:** [Baix/Mitjà/Alt]

---

## Millora 3: [TITOL]
**Àrea:** [Component/Àrea]
**Tipus:** [Bug fix / Millora / Optimització / Nova funcionalitat]
**Prioritat:** [Alta/Mitjana/Baixa]
**Impacte:** [Què millora concretament]
**Passos d'implementació:**
1. [Pas 1]
2. [Pas 2]
3. [Pas 3]
**Risc:** [Baix/Mitjà/Alt]

---

## Millora 4: [TITOL]
**Àrea:** [Component/Àrea]
**Tipus:** [Bug fix / Millora / Optimització / Nova funcionalitat]
**Prioritat:** [Alta/Mitjana/Baixa]
**Impacte:** [Què millora concretament]
**Passos d'implementació:**
1. [Pas 1]
2. [Pas 2]
3. [Pas 3]
**Risc:** [Baix/Mitjà/Alt]

---

## Millora 5: [TITOL]
**Àrea:** [Component/Àrea]
**Tipus:** [Bug fix / Millora / Optimització / Nova funcionalitat]
**Prioritat:** [Alta/Mitjana/Baixa]
**Impacte:** [Què millora concretament]
**Passos d'implementació:**
1. [Pas 1]
2. [Pas 2]
3. [Pas 3]
**Risc:** [Baix/Mitjà/Alt]

---

## Ordre d'Execució Proposat
1. Millora [X] (prioritat més alta)
2. Millora [X]
3. Millora [X]
4. Millora [X]
5. Millora [X]

---

_Proposta generada automàticament per Navi OS Improvement System_
_Data: $DATE_
EOF

echo "" | tee -a "$LOG_FILE"
echo "Proposta guardada a: $PROPOSAL_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "5 millores proposades. El sistema d'execució les processarà durant el dia." | tee -a "$LOG_FILE"

# Crear fitxer de tasques pendents
cat > "$IMPROVEMENT_DIR/reports/${DATE}-queue.json" << EOF
{
  "date": "$DATE",
  "proposedAt": "$(date -Iseconds)",
  "improvements": [
    {"id": 1, "status": "pending", "title": "TBD - cal omplir des del report markdown"},
    {"id": 2, "status": "pending", "title": "TBD"},
    {"id": 3, "status": "pending", "title": "TBD"},
    {"id": 4, "status": "pending", "title": "TBD"},
    {"id": 5, "status": "pending", "title": "TBD"}
  ],
  "executed": [],
  "failed": [],
  "errors": []
}
EOF

echo "RESULTAT: PROPOSTA COMPLETADA"
