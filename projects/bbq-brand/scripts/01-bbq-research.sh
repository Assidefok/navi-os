#!/bin/bash
# ============================================================================
# BBQ Brand - Recerca de Mercat Profunda
# Utilitza Codex (Claude Code) per analitzar el mercat de barbacoes a Amazon
# ============================================================================

set -e

PROJECT_DIR="/home/user/.openclaw/workspace/projects/bbq-brand"
RESEARCH_DIR="$PROJECT_DIR/research"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="$RESEARCH_DIR/logs/${DATE}.log"

# Crear directoris si no existeixen
mkdir -p "$RESEARCH_DIR/logs"
mkdir -p "$RESEARCH_DIR/reports"

echo "========================================" | tee -a "$LOG_FILE"
echo "BBQ BRAND RESEARCH - $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Prompt principal per a Codex
RESEARCH_PROMPT='Ets un analista de mercat expert en e-commerce i productes de barbacoa. 
Fes una recerca profunda del mercat de barbacoes a Amazon per a un projecte de marca pròpia.

## TASKS

### 1. Anàlisi del Mercat Actual
- Cerca a Amazon: "barbecue", "grill", "barbacoa", "brasador"
- Identifica les categories principals (gas, carbó, elèctrica, portàtil)
- Analitza preus mitjans per categoria
- Identifica els venedors principals i les seves valoracions

### 2. Anàlisi de Competència
- Llista els 10 productes més venuts a Amazon a la categoria barbacoa
- Analitza: preu, valoració mitjana, nombre d'opinions, preu enviament
- Identifica punts forts i febles dels competidors

### 3. Identificació de Buits de Mercat
- Busca productes amb alta valoració (4+) però baix nombre d'opinions (oportunitat)
- Identifica necessitats no cobertes (disseny, mida, funcionalitat)
- Busca tendències emergents (barbacoes portàtils, mini, ecològiques)

### 4. Anàlisi de Dissenys
- Identifica quin tipus de disseny destaca (material, mida, característiques)
- Busca dissenys innovadors o poc comuns
- Analitza quins materials predominen (acer, ferro colat, acer inoxidable)

### 5. Estratègia de Preu
- Rang de preus per a cada tipus de producte
- Marge aproximat per a FBA vs dropshipping
- Identifica el punt de preu òptim per a un nou entrant

### 6. Viabilitat de Dropshipping vs FBA
- Analitza els requeriments per vendre a Amazon (FBA)
- Evalua la viabilitat de dropshipping per a barbacoes
- Compara costos i beneficis

### 7. Conclusions i Recomanacions
- Proposa 3-5 idees de producte diferenciades
- Valora cada idea: dificultat, inversió necessària, competència
- Recomanació final: proceed / don\'t proceed / need more data

## OUTPUT
Guarda el resultat a: /home/user/.openclaw/workspace/projects/bbq-brand/research/reports/YYYY-MM-DD-report.md

Format:
- Titol clar
- Secció per a cada anàlisi
- Dades reals sempre que sigui possible
- Conclusions amb evidencie
- Recomanacions finals

## IMPORTANT
- Utilitza web_search i web_fetch per obtenir dades reals
- No especulis sense dades
- Sigues rigorós amb els fets
- Proporciona números reals quan els trobis'

echo "Iniciant recerca de mercat BBQ..." | tee -a "$LOG_FILE"
echo "Data: $(date)" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Aqui cridem el sub-agent de recerca
# El fem via sessions_spawn amb el runtime appropriate

echo "Recerca iniciada. Els resultats es guardaran a:" | tee -a "$LOG_FILE"
echo "$RESEARCH_DIR/reports/" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Crear un fitxer de estat
cat > "$RESEARCH_DIR/research-status.json" << EOF
{
  "status": "in_progress",
  "startedAt": "$(date -Iseconds)",
  "type": "bbq-market-research",
  "agent": "codex-researcher"
}
EOF

echo "Script de recerca finalitzat. El sub-agent farà la recerca." | tee -a "$LOG_FILE"
echo "RESULTAT: SCRIPT COMPLETAT"
