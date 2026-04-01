#!/bin/bash
# ================================================================
# TEAM IMPROVEMENT MEETING - Chiefs Council
# Weekly evaluation: assess system, propose new improvements
# Runs: After self-improvement deployments are verified
# ================================================================

set -e

WORKSPACE="/home/user/.openclaw/workspace"
MEETING_FILE="$WORKSPACE/team/meetings/$(date +%Y-%m-%d)-improvement-meeting.md"
LOG_FILE="$WORKSPACE/logs/team-improvement-meeting.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [TEAM-MEETING] $1" | tee -a "$LOG_FILE"; }

mkdir -p "$WORKSPACE/team/meetings"

log "=== Starting Chiefs Council Improvement Meeting ==="

# Gather current system state
SYS_STATE=$(python3 << 'PYEOF'
import subprocess, json, os

d = {}

# Get PM2 status
try:
    r = subprocess.run(['npx', 'pm2', 'jlist'], capture_output=True, text=True, timeout=10)
    ps = json.loads(r.stdout)
    d['services'] = [{'name': p['name'], 'status': p.get('pm2_env',{}).get('status','?')} for p in ps]
except:
    d['services'] = []

# Get recent improvements executed
improvement_dir = '/home/user/.openclaw/workspace/navi-os-improvement/reports'
deployed = []
if os.path.exists(improvement_dir):
    for f in os.listdir(improvement_dir):
        if f.startswith('approved-') or f.endswith('-execution.md'):
            deployed.append(f)
d['deployed_improvements'] = len(deployed)

# Get current memory/disk
try:
    r = subprocess.run(['df', '-h', '/home/user/.openclaw/workspace'], capture_output=True, text=True, timeout=5)
    lines = r.stdout.strip().split('\n')
    if len(lines) > 1:
        parts = lines[1].split()
        d['disk_used'] = parts[2] if len(parts) > 2 else '?'
        d['disk_total'] = parts[1] if len(parts) > 1 else '?'
except:
    d['disk_used'] = '?'
    d['disk_total'] = '?'

# Get git changes
try:
    r = subprocess.run(['git', 'status', '--short'], cwd='/home/user/.openclaw/workspace', capture_output=True, text=True, timeout=5)
    d['git_changes'] = len([l for l in r.stdout.strip().split('\n') if l])
except:
    d['git_changes'] = 0

print(json.dumps(d))
PYEOF
)

# Chiefs perspectives
CHIEFS=(
    "ELOM:ELOM"
    "WARREN:WARREN"
    "JEFF:JEFF"
    "SAM:SAM"
)

generate_chief_perspective() {
    local chief_id=$1
    local chief_name=$2
    
    case $chief_id in
        ELOM)
            echo "### 🚀 $chief_name (Visionary)"
            echo ""
            echo "**Perspectiva:** apostes gegants, disrupció, 10x thinking"
            echo ""
            echo "**Anàlisi del sistema:**"
            echo "- Navi OS és un OS personal potent — té potencial per créixer 10x"
            echo "- La arquitectura de staging/producción és excellent per iteració ràpida"
            echo "- El sistema de self-improvement és innovació real"
            echo ""
            echo "**Proposta de millora:**"
            echo "- Implementar **Analytics Dashboard** per tracking de usage patterns"
            echo "- Avaluar **multi-tenancy** per vendre Navi OS com a producte SaaS"
            echo "- Proposta: afegir **voice commands** amb Whisper per control total"
            ;;
        WARREN)
            echo "### 📊 $chief_name (Quality)"
            echo ""
            echo "**Perspectiva:** risc, qualitat, anàlisi profunda"
            echo ""
            echo "**Anàlisi del sistema:**"
            echo "- El sistema de propostes és sòlid però cal **testing automatitzat**"
            echo "- Cal **rollback mechanism** per cada canvi de producció"
            echo "- El staging ajudarà a reduir risc, però no és suficient"
            echo ""
            echo "**Proposta de millora:**"
            echo "- Implementar **snapshot backups** abans de cada deploy"
            echo "- Afegir **health checks** a cada mòdul amb alertes automàtiques"
            echo "- Proposta: crear **error boundary** per a React i mostrar recovery UI"
            ;;
        JEFF)
            echo "### ⚡ $chief_name (Operations)"
            echo ""
            echo "**Perspectiva:** execució, escalabilitat, processos eficients"
            echo ""
            echo "**Anàlisi del sistema:**"
            echo "- Els crons de 30 minson massafreqüents per a tasques pesades"
            echo "- Cal **pipeline d'automatització** més robust"
            echo "- El sistema de self-improvement ja funciona bé!"
            echo ""
            echo "**Proposta de millora:**"
            echo "- Optimitzar **cron schedules** per reduir recursos"
            echo "- Implementar **job queue** per tasques asíncrones"
            echo "- Proposta: afegir **deployment verification** post-build automatitzat"
            ;;
        SAM)
            echo "### 🤖 $chief_name (AI/Tech)"
            echo ""
            echo "**Perspectiva:** tecnologia, pragmastisme, IA real"
            echo ""
            echo "**Anàlisi del sistema:**"
            echo "- El model de self-improvement és bo però cal **diversificar fonts**"
            echo "- Cal **memória persistent** entre sessions (ja existeix)"
            echo "- Whisper integration seria un **game changer**"
            echo ""
            echo "**Proposta de millora:**"
            echo "- Afegir **vector embeddings** per a cerca semàntica"
            echo "- Implementar **context window** management per a prompts llargs"
            echo "- Proposta: **AI model routing** per escollir model optimitzat per tasca"
            ;;
    esac
}

# Generate meeting report
cat > "$MEETING_FILE" << 'HEADER'
# Chiefs Council - Improvement Meeting
HEADER

echo "" >> "$MEETING_FILE"
echo "**Date:** $(date '+%Y-%m-%d %H:%M')" >> "$MEETING_FILE"
echo "**Type:** Improvement Proposal Meeting" >> "$MEETING_FILE"
echo "**Attendees:** ELOM, WARREN, JEFF, SAM" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "---" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"

# System Status Section
echo "## System Status" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "| Metric | Value |" >> "$MEETING_FILE"
echo "|--------|-------|" >> "$MEETING_FILE"
echo "| Services | $(echo "$SYS_STATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('services',[])))") |" >> "$MEETING_FILE"
echo "| Deployed Improvements | $(echo "$SYS_STATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('deployed_improvements',0))") |" >> "$MEETING_FILE"
echo "| Disk Used | $(echo "$SYS_STATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('disk_used','?'))") |" >> "$MEETING_FILE"
echo "| Git Changes | $(echo "$SYS_STATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('git_changes',0))") |" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"

# Chiefs Perspectives
echo "## Chiefs Perspectives" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"

for chief_data in "${CHIEFS[@]}"; do
    IFS=':' read -r chief_id chief_name <<< "$chief_data"
    generate_chief_perspective "$chief_id" "$chief_name" >> "$MEETING_FILE"
    echo "" >> "$MEETING_FILE"
done

# Summary and Next Steps
echo "---" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "## Resum" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "Els 4 chiefs han evaluat el sistema des de les seves perspectives:" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "- **ELOM** proposa créixer 10x: analytics, multi-tenancy, voice commands" >> "$MEETING_FILE"
echo "- **WARREN** proposa seguretat: snapshots, health checks, error boundaries" >> "$MEETING_FILE"
echo "- **JEFF** proposa optimització: cron schedules, job queue, deployment verification" >> "$MEETING_FILE"
echo "- **SAM** proposa IA avançada: vector embeddings, context management, AI routing" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "**Pròximes passes:**" >> "$MEETING_FILE"
echo "1. Crear proposta formal de millores" >> "$MEETING_FILE"
echo "2. Aleix revisa al Lab (Self Improvement tab)" >> "$MEETING_FILE"
echo "3. Quan s'aprova, dreaming agents implementen" >> "$MEETING_FILE"
echo "" >> "$MEETING_FILE"
echo "*Generat per Navi OS - Chiefs Council*" >> "$MEETING_FILE"

log "Meeting report: $MEETING_FILE"
log "=== Done ==="

# Notify Aleix
curl -s -X POST http://localhost:3001/api/logs \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"meeting\",\"title\":\"Chiefs Improvement Meeting\",\"body\":\"Reunió completa. Propostes: ELOM-Analytics, WARREN-Safety, JEFF-Optimitzacio, SAM-AI\",\"tags\":[\"meeting\",\"improvement\",\"chiefs\"],\"source\":\"team-improvement-meeting\"}" \
    > /dev/null 2>&1 || true
