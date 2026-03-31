/**
 * Proposals Change Trigger - S'executa quan proposals.json canvia
 * Aquest script:
 * 1. Llegeix quin(s) chief(s) s'han de notificar
 * 2. Envia missatge(s) a Navi perquè els notifiqui en cadena
 */

import { readFileSync, existsSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const PROPOSALS_FILE = join(WORKSPACE, 'data', 'proposals.json')
const TRIGGER_DIR = join(WORKSPACE, '.proposals-triggers')
const CHIEF_ORDER = ['elom', 'warren', 'jeff', 'sam']

const CHIEF_NAMES = {
  elom: 'ELOM (Chief Visionary Officer)',
  warren: 'WARREN (Chief Quality Officer)',
  jeff: 'JEFF (Chief Operations Officer)',
  sam: 'SAM (Chief AI Officer)'
}

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
  console.log(`[${ts}] [TRIGGER] ${msg}`)
}

function loadProposals() {
  try {
    if (!existsSync(PROPOSALS_FILE)) return []
    const data = JSON.parse(readFileSync(PROPOSALS_FILE, 'utf-8'))
    return data.proposals || []
  } catch (e) {
    log(`Error llegint proposals: ${e.message}`)
    return []
  }
}

function getChiefForProposal(proposal) {
  if (proposal.chiefId) return proposal.chiefId
  if (proposal.id?.startsWith('pm-elom')) return 'elom'
  if (proposal.id?.startsWith('pm-warren')) return 'warren'
  if (proposal.id?.startsWith('pm-jeff')) return 'jeff'
  if (proposal.id?.startsWith('pm-sam')) return 'sam'
  if (proposal.assignee === 'elom') return 'elom'
  if (proposal.assignee === 'warren') return 'warren'
  if (proposal.assignee === 'jeff') return 'jeff'
  if (proposal.assignee === 'sam') return 'sam'
  return null
}

function getProposalsNeedingNotification(proposals) {
  // Propostes amb canvi recent (última hora) que NO han sigut processades
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  const toNotify = []
  
  for (const p of proposals) {
    // Notificar si té canvi recent i status pending/accepted/rejected
    if (['pending', 'accepted', 'rejected'].includes(p.status)) {
      const updatedAt = p.updatedAt ? new Date(p.updatedAt).getTime() : 0
      if (updatedAt > oneHourAgo || !updatedAt) {
        const chiefId = getChiefForProposal(p)
        if (chiefId) {
          toNotify.push({ ...p, chiefId })
        }
      }
    }
  }
  
  return toNotify
}

function generateNaviMessage(proposals) {
  if (proposals.length === 0) return null
  
  // Agrupar per chief
  const byChief = {}
  for (const p of proposals) {
    if (!byChief[p.chiefId]) byChief[p.chiefId] = []
    byChief[p.chiefId].push(p)
  }
  
  // Construir missatge per a Navi
  const lines = [
    '🧚 **CANVI DETECTAT A PROPOSTES**\n',
    `S'han modificat **${proposals.length}** proposta(es). Detalls:\n`
  ]
  
  for (const chiefId of CHIEF_ORDER) {
    if (byChief[chiefId]) {
      const chiefProposals = byChief[chiefId]
      lines.push(`\n### ${CHIEF_NAMES[chiefId]}:`)
      for (const p of chiefProposals) {
        lines.push(`- **${p.title || p.id}**`)
        lines.push(`  Status: \`${p.status}\` | Canvi: ${p.changeType || 'nou'}`)
        if (p.description) lines.push(`  ${p.description.substring(0, 100)}...`)
      }
    }
  }
  
  lines.push('\n---\n_Notifica cada chief en cadena consecutive (ELOM → WARREN → JEFF → SAM)._')
  
  return lines.join('\n')
}

function createTriggerFile(message) {
  try {
    // Crear directori si no existeix
    const dirExists = existsSync(TRIGGER_DIR)
    
    // Escriure trigger
    const triggerFile = join(TRIGGER_DIR, `trigger_${Date.now()}.json`)
    const trigger = {
      type: 'proposals_change',
      message,
      createdAt: new Date().toISOString(),
      processed: false
    }
    
    writeFileSync(triggerFile, JSON.stringify(trigger, null, 2), 'utf-8')
    log(`Trigger creat: ${triggerFile}`)
    return triggerFile
  } catch (e) {
    log(`Error creant trigger: ${e.message}`)
    return null
  }
}

// Logica principal
log('Executant trigger de canvi...')

const proposals = loadProposals()
const toNotify = getProposalsNeedingNotification(proposals)

if (toNotify.length === 0) {
  log('No hi ha propostes noves per notificar')
  process.exit(0)
}

const message = generateNaviMessage(toNotify)
if (message) {
  log(`Generant trigger per ${toNotify.length} proposta(es)`)
  const triggerFile = createTriggerFile(message)
  if (triggerFile) {
    log('TRIGGER CREAT EXITOSAMENT')
    console.log('NAVIGATE_TO_TRIGGER:' + triggerFile)
  }
}
