/**
 * Proposals Watcher - PM2 Managed Process
 * Watch file changes and send Telegram notifications directly
 */
import { watch } from 'fs'
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const PROPOSALS_FILE = join(WORKSPACE, 'data', 'proposals.json')
const TRIGGER_DIR = join(WORKSPACE, '.proposals-triggers')
const LOG_FILE = join(WORKSPACE, 'logs', 'proposals-watcher.log')

const CHIEF_ORDER = ['elom', 'warren', 'jeff', 'sam']
const CHIEF_NAMES = {
  elom: '🚀 ELOM',
  warren: '📊 WARREN',
  jeff: '⚡ JEFF',
  sam: '🤖 SAM'
}
const CHIEF_EMOJI = {
  elom: '🚀', warren: '📊', jeff: '⚡', sam: '🤖'
}

let logStream = null

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const line = `[${ts}] ${msg}`
  console.log(line)
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
    const stream = createWriteStream(LOG_FILE, { flags: 'a' })
    stream.write(line + '\n')
    stream.end()
  } catch (e) {}
}

function ensureDir(path) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function sendTelegramMessage(text, topicId = null) {
  try {
    // Get Telegram token from OpenClaw config
    const configFile = '/home/user/.openclaw/openclaw.json'
    let token = null
    if (existsSync(configFile)) {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'))
      token = config?.channels?.telegram?.botToken
    }
    
    if (!token) {
      log('Telegram token no trobat')
      return
    }
    
    const chatId = '267107022' // Aleix's Telegram ID
    const topicIdParam = topicId ? `-d "message_thread_id=${topicId}"` : ''
    
    // Escape special characters for JSON
    const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    
    const cmd = `curl -s -X POST "https://api.telegram.org/bot${token}/sendMessage" \
      -d "chat_id=${chatId}" \
      -d "text=${escapedText}" \
      -d "parse_mode=Markdown" \
      -d "disable_web_page_preview=true" \
      ${topicIdParam}`
    
    execSync(cmd, { timeout: 10000 })
    log('Missatge Telegram enviat')
  } catch (e) {
    log(`Error enviant Telegram: ${e.message}`)
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

function getChiefForProposal(p) {
  if (p.chiefId) return p.chiefId
  if (p.id?.startsWith('pm-elom')) return 'elom'
  if (p.id?.startsWith('pm-warren')) return 'warren'
  if (p.id?.startsWith('pm-jeff')) return 'jeff'
  if (p.id?.startsWith('pm-sam')) return 'sam'
  if (p.assignee === 'elom') return 'elom'
  if (p.assignee === 'warren') return 'warren'
  if (p.assignee === 'jeff') return 'jeff'
  if (p.assignee === 'sam') return 'sam'
  return null
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function processChanges() {
  const proposals = loadProposals()
  
  // Get recently changed proposals (last 5 minutes)
  const fiveMinAgo = Date.now() - (5 * 60 * 1000)
  const changedProposals = proposals.filter(p => {
    const updatedAt = p.updatedAt ? new Date(p.updatedAt).getTime() : 0
    return updatedAt > fiveMinAgo && ['pending', 'accepted', 'rejected'].includes(p.status)
  })
  
  if (changedProposals.length === 0) {
    log('Canvi detectat però cap proposta recent')
    return
  }
  
  log(`Processant ${changedProposals.length} proposta(es) canviada(es)`)
  
  // Group by chief
  const byChief = {}
  for (const p of changedProposals) {
    const chiefId = getChiefForProposal(p)
    if (chiefId) {
      if (!byChief[chiefId]) byChief[chiefId] = []
      byChief[chiefId].push(p)
    }
  }
  
  // Determine notification order
  const chiefsToNotify = CHIEF_ORDER.filter(c => byChief[c])
  
  if (chiefsToNotify.length === 0) {
    log('Canvi detectat però cap chief afectat')
    return
  }
  
  // Create trigger file for Navi to read later
  const triggerFile = join(TRIGGER_DIR, `trigger_${Date.now()}.json`)
  ensureDir(TRIGGER_DIR)
  const trigger = {
    id: `trigger_${Date.now()}`,
    createdAt: new Date().toISOString(),
    chiefs: byChief,
    notificationChain: chiefsToNotify,
    totalProposals: changedProposals.length
  }
  writeFileSync(triggerFile, JSON.stringify(trigger, null, 2), 'utf-8')
  
  // Send Telegram notification to Aleix
  const lines = [
    '🧚 *CANVI A PROPOSTES*',
    '',
    `S'han modificat *${changedProposals.length}* proposta(es):`,
    ''
  ]
  
  for (const chiefId of chiefsToNotify) {
    const emoji = CHIEF_EMOJI[chiefId]
    const chiefName = chiefId.toUpperCase()
    const chiefProposals = byChief[chiefId]
    lines.push(`${emoji} *${chiefName}* (${chiefProposals.length} canvi${chiefProposals.length > 1 ? 's' : ''}):`)
    for (const p of chiefProposals) {
      const statusEmoji = p.status === 'accepted' ? '✅' : p.status === 'rejected' ? '❌' : '⏳'
      lines.push(`  ${statusEmoji} ${p.title || p.id}`)
    }
    lines.push('')
  }
  
  lines.push('_Notificant chiefs en cadena (ELOM → WARREN → JEFF → SAM)..._')
  
  // Enviar al thread de Notificacions (topic_id 6469)
  sendTelegramMessage(lines.join('\n'), '6469')
  
  // Return the trigger info so caller knows what was created
  return trigger
}

// Debounce
let debounceTimer = null
function debouncedProcess() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await processChanges()
    debounceTimer = null
  }, 500)
}

// Main
log('='.repeat(50))
log('Proposals Watcher - INICIANT')
log(`Vigilant: ${PROPOSALS_FILE}`)
log('='.repeat(50))

ensureDir(TRIGGER_DIR)
mkdirSync(dirname(LOG_FILE), { recursive: true })

try {
  watch(PROPOSALS_FILE, { persistent: true }, (eventType) => {
    if (eventType === 'change' || eventType === 'rename') {
      log(`Canvi detectat: ${eventType}`)
      debouncedProcess()
    }
  })
  log('✅ Watcher actiu')
} catch (e) {
  log(`❌ Error: ${e.message}`)
  process.exit(1)
}

process.on('SIGINT', () => {
  log('Aturant...')
  process.exit(0)
})

log('Esperant canvis...')
