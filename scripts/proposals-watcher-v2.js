/**
 * Proposals Watcher v2 - File-based trigger per Navi
 * Quan proposals.json canvia → escriu trigger
 * Navi el detecta al seu heartbeat i processa
 */

import { watch } from 'fs'
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const PROPOSALS_FILE = join(WORKSPACE, 'data', 'proposals.json')
const TRIGGER_DIR = join(WORKSPACE, '.proposals-triggers')
const STATE_FILE = join(WORKSPACE, '.proposals-watcher-state.json')

const CHIEF_ORDER = ['elom', 'warren', 'jeff', 'sam']

const CHIEF_NAMES = {
  elom: '🚀 ELOM',
  warren: '📊 WARREN',
  jeff: '⚡ JEFF',
  sam: '🤖 SAM'
}

let lastSizes = {}

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
  console.log(`[${ts}] [WATCHER] ${msg}`)
}

function ensureDir(path) {
  const { dirname } = require('path')
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    }
  } catch (e) {}
  return { lastModified: null, lastSizes: {} }
}

function saveState(state) {
  try {
    ensureDir(STATE_FILE)
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (e) {
    log(`Error guardant estat: ${e.message}`)
  }
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

function createTrigger(proposals) {
  ensureDir(TRIGGER_DIR)
  
  // Netejar triggers antics (més de 24h)
  try {
    const files = readdirSync(TRIGGER_DIR)
    const now = Date.now()
    for (const f of files) {
      if (f.startsWith('trigger_')) {
        const fpath = join(TRIGGER_DIR, f)
        const stat = statSync(fpath)
        if (now - stat.mtimeMs > 24 * 60 * 60 * 1000) {
          // No delete, just skip - we don't want to lose triggers
        }
      }
    }
  } catch (e) {}
  
  // Agrupar per chief
  const byChief = {}
  for (const p of proposals) {
    const chiefId = getChiefForProposal(p)
    if (chiefId && ['pending', 'accepted', 'rejected'].includes(p.status)) {
      if (!byChief[chiefId]) byChief[chiefId] = []
      byChief[chiefId].push(p)
    }
  }
  
  if (Object.keys(byChief).length === 0) {
    log('Canvi detectat però cap chief afectat')
    return null
  }
  
  // Crear trigger
  const triggerId = `trigger_${Date.now()}`
  const triggerFile = join(TRIGGER_DIR, `${triggerId}.json`)
  
  const trigger = {
    id: triggerId,
    createdAt: new Date().toISOString(),
    chiefs: byChief,
    totalProposals: proposals.length,
    notificationChain: CHIEF_ORDER.filter(c => byChief[c])
  }
  
  try {
    writeFileSync(triggerFile, JSON.stringify(trigger, null, 2), 'utf-8')
    log(`TRIGGER CREAT: ${triggerId}`)
    log(`  Chiefs afectats: ${trigger.notificationChain.join(' → ')}`)
    log(`  Total propostes: ${trigger.totalProposals}`)
    return trigger
  } catch (e) {
    log(`Error creant trigger: ${e.message}`)
    return null
  }
}

function handleFileChange() {
  log('Canvi detectat a proposals.json')
  
  const proposals = loadProposals()
  const trigger = createTrigger(proposals)
  
  if (trigger) {
    log('Trigger desat. Navi el trobarà al seu proper heartbeat.')
  }
}

// Debounce
let debounceTimer = null
function debouncedChange() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    handleFileChange()
    debounceTimer = null
  }, 300)
}

// Iniciar
log('='.repeat(50))
log('Proposals Watcher v2 - INICIANT')
log(`Workspace: ${WORKSPACE}`)
log(`Vigilant: ${PROPOSALS_FILE}`)
log('='.repeat(50))

// Verificar estat inicial
const state = loadState()
log(`Estat carregat: ${Object.keys(state).length} camps`)

// Iniciar watcher
try {
  watch(PROPOSALS_FILE, { persistent: true }, (eventType, filename) => {
    if (eventType === 'change' || eventType === 'rename') {
      log(`Event: ${eventType}`)
      debouncedChange()
    }
  })
  log('✅ Watcher actiu')
} catch (e) {
  log(`❌ Error iniciant watcher: ${e.message}`)
  process.exit(1)
}

// Mantenir viu
log('Watcher executant-se...esperant canvis (Ctrl+C per aturar)')

process.on('SIGINT', () => {
  log('Aturant watcher...')
  process.exit(0)
})

// Exemple: si el fitxer canvia ara, ho detectem
const currentStat = statSync(PROPOSALS_FILE)
log(`Mida actual proposals.json: ${currentStat.size} bytes`)
