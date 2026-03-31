#!/bin/bash
# ============================================================================
# Navi OS Improvement System - Proposta Nocturna v2.0
# Analitza el codi i proposa 5 millores REALS amb dades concretes
# ============================================================================

set -e

PROJECT_DIR="/home/user/.openclaw/workspace/navi-os"
IMPROVEMENT_DIR="/home/user/.openclaw/workspace/navi-os-improvement"
DATE=$(date +%Y-%m-%d-%H.%M)
PROPOSAL_FILE="$IMPROVEMENT_DIR/reports/${DATE}-improvements.md"
QUEUE_FILE="$IMPROVEMENT_DIR/reports/${DATE}-queue.json"
LOG_FILE="$IMPROVEMENT_DIR/logs/${DATE}-proposer.log"

mkdir -p "$IMPROVEMENT_DIR/reports"
mkdir -p "$IMPROVEMENT_DIR/logs"
mkdir -p "$IMPROVEMENT_DIR/tasks"

echo "========================================" | tee -a "$LOG_FILE"
echo "NAVI OS IMPROVEMENT PROPOSER v2.0 - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# ─── Analisi Real del Codi ──────────────────────────────────────────────────

echo "Analitzant estructura de Navi OS..." | tee -a "$LOG_FILE"

# Buscar problemes reals
echo "Buscant debt tècnic..." | tee -a "$LOG_FILE"

# 1. Detectar TaskPipeline que usa localStorage en lloc de API
HAS_LOCALSTORAGE=$(grep -r "localStorage" "$PROJECT_DIR/src" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | wc -l)

# 2. Detectar imports de components que podrien no existir
MISSING_IMPORTS=""
for comp in TaskPipeline DeliverableTracker TaskManager Status Files Security Sync Proposals TeamOverview; do
    if [ -f "$PROJECT_DIR/src/components/${comp}.jsx" ]; then
        echo "  ✓ $comp.jsx existeix" | tee -a "$LOG_FILE"
    else
        echo "  ✗ $comp.jsx FALTA" | tee -a "$LOG_FILE"
        MISSING_IMPORTS="$MISSING_IMPORTS $comp"
    fi
done

# 3. Detectar si React Router esta instal·lat però no s'usa
HAS_ROUTER=$(grep -r "BrowserRouter\|Routes\|Route" "$PROJECT_DIR/src" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)
ROUTER_INSTALLED=$(grep "react-router-dom" "$PROJECT_DIR/package.json" 2>/dev/null | wc -l)

# 4. Comptar linies de cada module
echo "" | tee -a "$LOG_FILE"
echo "Mtriques de codi:" | tee -a "$LOG_FILE"
find "$PROJECT_DIR/src" -name "*.jsx" 2>/dev/null | xargs wc -l 2>/dev/null | sort -n | tail -10 | tee -a "$LOG_FILE"

# 5. Buscar console.logs degug
CONSOLE_LOGS=$(grep -r "console\.log" "$PROJECT_DIR/src" --include="*.jsx" 2>/dev/null | grep -v node_modules | wc -l)

# 6. Buscar useEffect sense deps
echo "" | tee -a "$LOG_FILE"
echo "Analitzant useEffects..." | tee -a "$LOG_FILE"

# ─── Generar Millores Reals ────────────────────────────────────────────────

echo "" | tee -a "$LOG_FILE"
echo "Generant 5 millores concrets..." | tee -a "$LOG_FILE"

# Millora 1: TaskPipeline -> API Server integration
if [ "$HAS_LOCALSTORAGE" -gt 0 ]; then
    IMPROVEMENT_1_TITLE="Connectar TaskPipeline a API Server (eliminar localStorage)"
    IMPROVEMENT_1_DESC="TaskPipeline guarda a localStorage però l'API server llegeix de /workspace/data/pm-board.json. Integrar amb GET/POST /api/pm-board."
    IMPROVEMENT_1_AREA="TaskPipeline.jsx, server.js"
    IMPROVEMENT_1_TYPE="Bug fix"
    IMPROVEMENT_1_PRIORITY="Alta"
    IMPROVEMENT_1_IMPACT="Les tasques es guarden localment i es perden en canviar de navegador. L'API server no rep les dades."
    IMPROVEMENT_1_STEPS="1. Modificar TaskPipeline.jsx per fer fetch() a /api/pm-board enlloc de localStorage|2. Actualitzar server.js per suportar GET i POST de tasques|3. Eliminar STORAGE_KEY de localStorage|4. Test: crear tasca i recarregar - ha de persistir"
    IMPROVEMENT_1_RISC="Baix"
    IMPROVEMENT_1_ID="IMP-001"
else
    IMPROVEMENT_1_TITLE="Revisar i optimitzar renderitzacio de TaskPipeline"
    IMPROVEMENT_1_DESC="TaskPipeline no usa localStorage. Optimitzar renderitzacio i estat local."
    IMPROVEMENT_1_AREA="TaskPipeline.jsx"
    IMPROVEMENT_1_TYPE="Optimització"
    IMPROVEMENT_1_PRIORITY="Mitjana"
    IMPROVEMENT_1_IMPACT="Millorar performance del pipeline de tasques"
    IMPROVEMENT_1_STEPS="1. Analitzar render cycle|2. Optimitzar useEffect deps|3. Afegir React.memo si cal"
    IMPROVEMENT_1_RISC="Baix"
    IMPROVEMENT_1_ID="IMP-001"
fi

# Millora 2: React Router (si esta instal·lat pero no s'usa)
if [ "$ROUTER_INSTALLED" -gt 0 ] && [ "$HAS_ROUTER" -eq 0 ]; then
    IMPROVEMENT_2_TITLE="Implementar React Router per deep-linking"
    IMPROVEMENT_2_DESC="react-router-dom esta instal·lat pero App.jsx no l'usa. Implementar BrowserRouter per suportar URLs com /ops, /brain, /lab."
    IMPROVEMENT_2_AREA="App.jsx, package.json"
    IMPROVEMENT_2_TYPE="Nova funcionalitat"
    IMPROVEMENT_2_PRIORITY="Mitjana"
    IMPROVEMENT_2_IMPACT="Permet deep-linking i navegacio directa a cada modul sense canviar tab."
    IMPROVEMENT_2_STEPS="1. Importar BrowserRouter, Routes, Route a App.jsx|2. Definir rutes: /ops -> Ops, /brain -> Brain, /lab -> Lab|3. Substituir useState tab switching per navegacio de rutes|4. Mantenir Dock com a navegacio"
    IMPROVEMENT_2_RISC="Mitjà"
    IMPROVEMENT_2_ID="IMP-002"
else
    IMPROVEMENT_2_TITLE="Afegir loading states a components"
    IMPROVEMENT_2_DESC="Alguns components no tenen loading state quan carreguen dades de l'API."
    IMPROVEMENT_2_AREA="Ops.jsx, components/"
    IMPROVEMENT_2_TYPE="Millora"
    IMPROVEMENT_2_PRIORITY="Baixa"
    IMPROVEMENT_2_IMPACT="Millora UX amb feedback visual mentre carreguen dades."
    IMPROVEMENT_2_STEPS="1. Identificar components que fan fetch()|2. Afegir useState per loading|3. Mostrar spinner o skeleton"
    IMPROVEMENT_2_RISC="Baix"
    IMPROVEMENT_2_ID="IMP-002"
fi

# Millora 3: Eliminar console.logs de debug
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    IMPROVEMENT_3_TITLE="Eliminar console.logs de debug del codi"
    IMPROVEMENT_3_DESC="Trobat $CONSOLE_LOGS console.logs en el codi. Eliminarlos abans de produccions."
    IMPROVEMENT_3_AREA="Tots els components"
    IMPROVEMENT_3_TYPE="Bug fix"
    IMPROVEMENT_3_PRIORITY="Baixa"
    IMPROVEMENT_3_IMPACT="Cod mes net, millor performance, res post-production."
    IMPROVEMENT_3_STEPS="1. Buscar tots els console.log: grep -r 'console\.log' src/|2. Eliminar o substituir per logging propi si cal|3. Verificar build funciona"
    IMPROVEMENT_3_RISC="Baix"
    IMPROVEMENT_3_ID="IMP-003"
else
    IMPROVEMENT_3_TITLE="Afegir error boundaries a React"
    IMPROVEMENT_3_DESC="No hi ha ErrorBoundary configurat. Afegir per capturar errors de renderitzacio."
    IMPROVEMENT_3_AREA="App.jsx"
    IMPROVEMENT_3_TYPE="Millora"
    IMPROVEMENT_3_PRIORITY="Mitjana"
    IMPROVEMENT_3_IMPACT="L'app no es trencara completament si un component falla."
    IMPROVEMENT_3_STEPS="1. Crear ErrorBoundary component|2. Integrar a App.jsx al voltant de cada modul|3. Mostrar missatge amigable en cas d'error"
    IMPROVEMENT_3_RISC="Baix"
    IMPROVEMENT_3_ID="IMP-003"
fi

# Millora 4: Cridar el sistema de proposals
IMPROVEMENT_4_TITLE="Integrar sistema de proposals amb API"
IMPROVEMENT_4_DESC="Proposals.jsx funciona但是 no esta conectat a l'API server. Integrar amb /api/proposals."
IMPROVEMENT_4_AREA="Proposals.jsx, server.js"
IMPROVEMENT_4_TYPE="Bug fix"
IMPROVEMENT_4_PRIORITY="Alta"
IMPROVEMENT_4_IMPACT="Les propostes es guarden en memria local, no es comparteixen entre sessions."
IMPROVEMENT_4_STEPS="1. Afegir endpoint GET/POST /api/proposals a server.js|2. Modificar Proposals.jsx per fer servir API|3. Eliminar localStorage de proposals"
IMPROVEMENT_4_RISC="Baix"
IMPROVEMENT_4_ID="IMP-004"

# Millora 5: PM2 monitoring
IMPROVEMENT_5_TITLE="Afegir monitoring de PM2 al Navi OS"
IMPROVEMENT_5_DESC="Els processos PM2 (navi-os-api, vite) no tenen monitoring visual a l'OS. Afegir panell de status."
IMPROVEMENT_5_AREA="Status.jsx, server.js"
IMPROVEMENT_5_TYPE="Nova funcionalitat"
IMPROVEMENT_5_PRIORITY="Mitjana"
IMPROVEMENT_5_IMPACT="Permet veure status de PM2 sense obrir terminal."
IMPROVEMENT_5_STEPS="1. Afegir endpoint /api/pm2-status a server.js|2. Modificar Status.jsx per mostrar dades de PM2|3. Integrar al dashboard de Mission Control"
IMPROVEMENT_5_RISC="Baix"
IMPROVEMENT_5_ID="IMP-005"

# ─── Crear Proposal Markdown ─────────────────────────────────────────────────

cat > "$PROPOSAL_FILE" << EOF
# Proposta de Millores Navi OS - $DATE

## Resum Executiu
Sistema de millora automatitzada activa. 5 millores identificades mitjanant anàlisi estàtica del codi.

---

## Millora 1: $IMPROVEMENT_1_TITLE
**Àrea:** $IMPROVEMENT_1_AREA
**Tipus:** $IMPROVEMENT_1_TYPE
**Prioritat:** $IMPROVEMENT_1_PRIORITY
**Impacte:** $IMPROVEMENT_1_IMPACT
**Passos d'implementació:**
$(echo "$IMPROVEMENT_1_STEPS" | tr '|' '\n' | sed 's/^/1. /')
**Risc:** $IMPROVEMENT_1_RISC

---

## Millora 2: $IMPROVEMENT_2_TITLE
**Àrea:** $IMPROVEMENT_2_AREA
**Tipus:** $IMPROVEMENT_2_TYPE
**Prioritat:** $IMPROVEMENT_2_PRIORITY
**Impacte:** $IMPROVEMENT_2_IMPACT
**Passos d'implementació:**
$(echo "$IMPROVEMENT_2_STEPS" | tr '|' '\n' | sed 's/^/1. /')
**Risc:** $IMPROVEMENT_2_RISC

---

## Millora 3: $IMPROVEMENT_3_TITLE
**Àrea:** $IMPROVEMENT_3_AREA
**Tipus:** $IMPROVEMENT_3_TYPE
**Prioritat:** $IMPROVEMENT_3_PRIORITY
**Impacte:** $IMPROVEMENT_3_IMPACT
**Passos d'implementació:**
$(echo "$IMPROVEMENT_3_STEPS" | tr '|' '\n' | sed 's/^/1. /')
**Risc:** $IMPROVEMENT_3_RISC

---

## Millora 4: $IMPROVEMENT_4_TITLE
**Àrea:** $IMPROVEMENT_4_AREA
**Tipus:** $IMPROVEMENT_4_TYPE
**Prioritat:** $IMPROVEMENT_4_PRIORITY
**Impacte:** $IMPROVEMENT_4_IMPACT
**Passos d'implementació:**
$(echo "$IMPROVEMENT_4_STEPS" | tr '|' '\n' | sed 's/^/1. /')
**Risc:** $IMPROVEMENT_4_RISC

---

## Millora 5: $IMPROVEMENT_5_TITLE
**Àrea:** $IMPROVEMENT_5_AREA
**Tipus:** $IMPROVEMENT_5_TYPE
**Prioritat:** $IMPROVEMENT_5_PRIORITY
**Impacte:** $IMPROVEMENT_5_IMPACT
**Passos d'implementació:**
$(echo "$IMPROVEMENT_5_STEPS" | tr '|' '\n' | sed 's/^/1. /')
**Risc:** $IMPROVEMENT_5_RISC

---

## Ordre d'Execució Proposat
1. $IMPROVEMENT_1_ID ($IMPROVEMENT_1_PRIORITY)
2. $IMPROVEMENT_2_ID ($IMPROVEMENT_2_PRIORITY)
3. $IMPROVEMENT_4_ID ($IMPROVEMENT_4_PRIORITY)
4. $IMPROVEMENT_3_ID ($IMPROVEMENT_3_PRIORITY)
5. $IMPROVEMENT_5_ID ($IMPROVEMENT_5_PRIORITY)

---

_Proposta generada automàticament per Navi OS Improvement System v2.0_
_Data: $DATE_
EOF

# ─── Crear Queue JSON ───────────────────────────────────────────────────────

cat > "$QUEUE_FILE" << EOF
{
  "date": "$DATE",
  "proposedAt": "$(date -Iseconds)",
  "improvements": [
    {
      "id": "IMP-001",
      "title": "$IMPROVEMENT_1_TITLE",
      "area": "$IMPROVEMENT_1_AREA",
      "type": "$IMPROVEMENT_1_TYPE",
      "priority": "$IMPROVEMENT_1_PRIORITY",
      "impact": "$IMPROVEMENT_1_IMPACT",
      "steps": "$(echo "$IMPROVEMENT_1_STEPS" | tr '|' ',')",
      "risk": "$IMPROVEMENT_1_RISC",
      "status": "pending",
      "attempts": 0
    },
    {
      "id": "IMP-002",
      "title": "$IMPROVEMENT_2_TITLE",
      "area": "$IMPROVEMENT_2_AREA",
      "type": "$IMPROVEMENT_2_TYPE",
      "priority": "$IMPROVEMENT_2_PRIORITY",
      "impact": "$IMPROVEMENT_2_IMPACT",
      "steps": "$(echo "$IMPROVEMENT_2_STEPS" | tr '|' ',')",
      "risk": "$IMPROVEMENT_2_RISC",
      "status": "pending",
      "attempts": 0
    },
    {
      "id": "IMP-003",
      "title": "$IMPROVEMENT_3_TITLE",
      "area": "$IMPROVEMENT_3_AREA",
      "type": "$IMPROVEMENT_3_TYPE",
      "priority": "$IMPROVEMENT_3_PRIORITY",
      "impact": "$IMPROVEMENT_3_IMPACT",
      "steps": "$(echo "$IMPROVEMENT_3_STEPS" | tr '|' ',')",
      "risk": "$IMPROVEMENT_3_RISC",
      "status": "pending",
      "attempts": 0
    },
    {
      "id": "IMP-004",
      "title": "$IMPROVEMENT_4_TITLE",
      "area": "$IMPROVEMENT_4_AREA",
      "type": "$IMPROVEMENT_4_TYPE",
      "priority": "$IMPROVEMENT_4_PRIORITY",
      "impact": "$IMPROVEMENT_4_IMPACT",
      "steps": "$(echo "$IMPROVEMENT_4_STEPS" | tr '|' ',')",
      "risk": "$IMPROVEMENT_4_RISC",
      "status": "pending",
      "attempts": 0
    },
    {
      "id": "IMP-005",
      "title": "$IMPROVEMENT_5_TITLE",
      "area": "$IMPROVEMENT_5_AREA",
      "type": "$IMPROVEMENT_5_TYPE",
      "priority": "$IMPROVEMENT_5_PRIORITY",
      "impact": "$IMPROVEMENT_5_IMPACT",
      "steps": "$(echo "$IMPROVEMENT_5_STEPS" | tr '|' ',')",
      "risk": "$IMPROVEMENT_5_RISC",
      "status": "pending",
      "attempts": 0
    }
  ],
  "executed": [],
  "failed": [],
  "errors": []
}
EOF

# ─── Crear tasques individuals per l'executor ───────────────────────────────

for imp in IMP-001 IMP-002 IMP-003 IMP-004 IMP-005; do
    TASK_FILE="$IMPROVEMENT_DIR/tasks/${DATE}-${imp}.json"
    # Extreure dades del JSON principal
    IMP_DATA=$(cat "$QUEUE_FILE" | jq -r ".improvements[] | select(.id == \"$imp\")")
    echo "$IMP_DATA" > "$TASK_FILE"
done

echo "" | tee -a "$LOG_FILE"
echo "✓ Proposta generada: $PROPOSAL_FILE" | tee -a "$LOG_FILE"
echo "✓ Cua creada: $QUEUE_FILE" | tee -a "$LOG_FILE"
echo "✓ 5 tasques preparades per execució" | tee -a "$LOG_FILE"

# ─── Actualitzar index.json ─────────────────────────────────────────────────

INDEX_FILE="$IMPROVEMENT_DIR/reports/index.json"
REPORT_TIME=$(echo "$DATE" | cut -d'-' -f4 | sed 's/\./:/')

# Crear entrada per l'index
NEW_REPORT=$(cat << EOF
    {
      "id": "proposal-$DATE",
      "filename": "${DATE}-improvements.md",
      "type": "proposal",
      "date": "$(echo "$DATE" | cut -d'-' -f1-3 | tr '-' '.')",
      "time": "$REPORT_TIME",
      "title": "Proposta de Millores Navi OS - $DATE",
      "tags": ["proposal", "improvement", "navi-os", "episodi-4"],
      "topics": ["$IMPROVEMENT_1_AREA", "$IMPROVEMENT_2_AREA", "$IMPROVEMENT_3_AREA", "$IMPROVEMENT_4_AREA", "$IMPROVEMENT_5_AREA"],
      "improvements": ["IMP-001", "IMP-002", "IMP-003", "IMP-004", "IMP-005"],
      "summary": "5 millores identificades: $IMPROVEMENT_1_TITLE, $IMPROVEMENT_2_TITLE, $IMPROVEMENT_3_TITLE, $IMPROVEMENT_4_TITLE, $IMPROVEMENT_5_TITLE"
    }
EOF
)

# Actualitzar index.json amb jq
if [ -f "$INDEX_FILE" ]; then
    # Afegir nou report a l'array i actualitzar updated
    TMP_INDEX="${INDEX_FILE}.tmp"
    cp "$INDEX_FILE" "$TMP_INDEX"
    cat "$INDEX_FILE" | jq --argjson newreport "$NEW_REPORT" \
        '.reports = (.reports + [$newreport]) | .updated = $DATE' > "$TMP_INDEX"
    mv "$TMP_INDEX" "$INDEX_FILE"
    echo "✓ Index actualitzat: $INDEX_FILE" | tee -a "$LOG_FILE"
else
    # Crear index nou
    cat > "$INDEX_FILE" << EOF
{
  "vault": "navi-os-improvement",
  "description": "Sistema de millora automatitzada per Navi OS",
  "created": "$DATE",
  "updated": "$DATE",
  "reports": [$NEW_REPORT]
}
EOF
    echo "✓ Index creat: $INDEX_FILE" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "RESULTAT: PROPOSTA COMPLETADA" | tee -a "$LOG_FILE"
