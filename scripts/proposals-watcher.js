/**
 * Proposals Watcher - Node.js persistent process
 * Vigent: vigila data/proposals.json i quan detecta canvis
 * Notifica als Chiefs afectats (cadena consecutiva)
 */

import { watch } from 'fs'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const PROPOSALS_FILE = join(WORKSPACE, 'data', 'proposals.json')
const CHIEFS_WATCH_FILE = join(WORKSPACE, 'data', 'chiefs-watch.json')

// Chief mapping
const CHIEF_NAMES = {
  elom: 'ELOM',
  warren: 'WARREN', 
  jeff: 'JEFF',
  sam: 'SAM'
}

// Chief workspace locations
const CHIEF_WORKSPACES = {
  elom: join(WORKSPACE, 'team', 'elom'),
  warren: join(WORKSPACE, 'team', 'warren'),
  jeff: join(WORKSPACE, 'team', 'jeff'),
  sam: join(WORKSPACE, 'team', 'sam')
}

// State
let lastKnownProposals = null
let isProcessing = false

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
  console.log(`[${ts}] [WATCHER] ${msg}`)
}

function loadProposals() {
  try {
    if (!existsSync(PROPOSALS_FILE)) return []
    const raw = readFileSync(PROPOSALS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return data.proposals || []
  } catch (e) {
    log(`Error llegint proposals: ${e.message}`)
    return []
  }
}

function findChangedProposals(current) {
  if (!lastKnownProposals) return []
  
  const changed = []
  const lastMap = new Map(lastKnownProposals.map(p => [p.id, p]))
  
  for (const proposal of current) {
    const last = lastMap.get(proposal.id)
    if (!last) {
      // Nova proposta
      changed.push({ ...proposal, changeType: 'created' })
    } else if (last.status !== proposal.status) {
      // Canvi de status
      changed.push({ 
        ...proposal, 
        changeType: 'status_changed',
        previousStatus: last.status,
        newStatus: proposal.status
      })
    }
  }
  
  return changed
}

function getChiefForProposal(proposal) {
  // El chiefId pot estar a proposal.chiefId o inferir-se de la proposta
  if (proposal.chiefId && CHIEF_NAMES[proposal.chiefId]) {
    return proposal.chiefId
  }
  
  // Inferir pel prefix de l'ID o categoria
  if (proposal.id?.startsWith('pm-elom') || proposal.category === 'strategy') return 'elom'
  if (proposal.id?.startsWith('pm-warren') || proposal.category === 'quality') return 'warren'
  if (proposal.id?.startsWith('pm-jeff') || proposal.category === 'operations') return 'jeff'
  if (proposal.id?.startsWith('pm-sam') || proposal.category === 'ai') return 'sam'
  
  return null
}

async function notifyChief(chiefId, proposals) {
  if (!CHIEF_NAMES[chiefId]) {
    log(`Chief desconegut: ${chiefId}`)
    return
  }
  
  const chiefName = CHIEF_NAMES[chiefId]
  const workspace = CHIEF_WORKSPACES[chiefId]
  
  log(`NOTIFICANT ${chiefName} sobre ${proposals.length} proposta(es) canviada(es)`)
  
  // Escriure notificació al workspace del chief
  const notificationFile = join(workspace, `PROPOSAL_NOTIFICATION_${Date.now()}.md`)
  const content = `# Notificació de Canvi - Propostes

**Data:** ${new Date().toISOString()}
**Canvis detectats:** ${proposals.length}

${proposals.map(p => `
## ${p.title || p.id}

- **Tipus de canvi:** ${p.changeType}
${p.previousStatus ? `- **Status anterior:** ${p.previousStatus}` : ''}
- **Nou status:** ${p.status}
- **Descripció:** ${p.description || 'N/A'}
${p.chiefId ? `- **Chief origen:** ${p.chiefId}` : ''}
`).join('\n')}

---

*Aquest fitxer ha estat generat automàticament pel Proposals Watcher.*
*Silencia'l quan el chief hagi llegit i actuat.*
`
  
  try {
    const { writeFileSync, mkdirSync } = await import('fs')
    mkdirSync(dirname(notificationFile), { recursive: true })
    writeFileSync(notificationFile, content, 'utf-8')
    log(`Notificació escrita per ${chiefName}: ${notificationFile}`)
  } catch (e) {
    log(`Error escrivint notificació per ${chiefName}: ${e.message}`)
  }
}

async function processChanges() {
  if (isProcessing) {
    log('Ja s'està processant, saltant...')
    return
  }
  
  isProcessing = true
  const current = loadProposals()
  const changed = findChangedProposals(current)
  
  if (changed.length === 0) {
    log('Canvis detectats però cap proposta afectada')
    isProcessing = false
    return
  }
  
  log(`DETECTATS ${changed.length} CANVI(S):`)
  changed.forEach(p => log(`  - ${p.id}: ${p.changeType} (${p.previousStatus} → ${p.status})`))
  
  // Agrupar per chief
  const byChief = {}
  for (const proposal of changed) {
    const chiefId = getChiefForProposal(proposal)
    if (chiefId) {
      if (!byChief[chiefId]) byChief[chiefId] = []
      byChief[chiefId].push(proposal)
    }
  }
  
  // Notificar cada chief en cadena (ELOM → WARREN → JEFF → SAM)
  const chiefOrder = ['elom', 'warren', 'jeff', 'sam']
  for (const chiefId of chiefOrder) {
    if (byChief[chiefId]) {
      await notifyChief(chiefId, byChief[chiefId])
      // Petita pausa entre notificacions per evitar sobrecàrrega
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  
  lastKnownProposals = current
  isProcessing = false
}

// Debounce per evitar múltiples triggers d'un mateix canvi
let debounceTimer = null
function debouncedProcess() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    processChanges()
    debounceTimer = null
  }, 500)
}

// Iniciar watcher
log(`Iniciant watcher sobre: ${PROPOSALS_FILE}`)

// Carregar estat inicial
lastKnownProposals = loadProposals()
log(`Carregades ${lastKnownProposals.length} propostes inicials`)

// Vigilar canvis
try {
  watch(PROPOSALS_FILE, { persistent: true }, (eventType, filename) => {
    log(`Event detectat: ${eventType} - ${filename}`)
    debouncedProcess()
  })
  log('Watcher actiu i esperant canvis...')
} catch (e) {
  log(`ERROR iniciant watcher: ${e.message}`)
  process.exit(1)
}

// Mantenir procés viu
process.on('SIGINT', () => {
  log('Aturant watcher...')
  process.exit(0)
})

log('Proposals Watcher executant-se...')
