/**
 * Process Proposal Triggers
 * 
 * Reads pending trigger files from .proposals-triggers/, sends Telegram
 * notifications for each affected chief, then deletes the trigger files.
 * 
 * Called by Navi when Aleix taps a proposal change notification.
 */

import { readFileSync, existsSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const TRIGGER_DIR = join(WORKSPACE, '.proposals-triggers')
const LOG_DIR = join(WORKSPACE, 'logs')
const LOG_FILE = join(LOG_DIR, 'proposal-triggers.log')

const TELEGRAM_TOKEN = '8598501417:AAFg24vst0AyQsfzwRVhp6auHkyJr7YB5OY'
const CHAT_ID = '267107022'

const CHIEF_EMOJI = {
  elom: '🚀',
  warren: '📊',
  jeff: '⚡',
  sam: '🤖'
}

const CHIEF_NAMES = {
  elom: 'ELOM',
  warren: 'WARREN',
  jeff: 'JEFF',
  sam: 'SAM'
}

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const line = `[${ts}] [PROPOSAL-TRIGGERS] ${msg}`
  console.log(line)
  try {
    const dirExists = existsSync(LOG_DIR)
    if (!dirExists) {
      const { mkdirSync } = require('fs')
      mkdirSync(LOG_DIR, { recursive: true })
    }
    require('fs').createWriteStream(LOG_FILE, { flags: 'a' }).write(line + '\n')
  } catch (e) {
    // ignore
  }
}

function sendTelegram(text, messageThreadId = null) {
  try {
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
    const escapedUrl = url.replace(/'/g, "'\\''")

    let cmd = `curl -s -X POST '${escapedUrl}' -d 'chat_id=${CHAT_ID}' -d 'text=${escapedText}' -d 'parse_mode=Markdown' -d 'disable_web_page_preview=true'`
    
    if (messageThreadId) {
      cmd += ` -d 'message_thread_id=${messageThreadId}'`
    }

    const result = execSync(cmd, { timeout: 10000, encoding: 'utf-8', shell: '/bin/bash' })
    const parsed = JSON.parse(result)
    if (parsed.ok) {
      log(`Telegram enviat OK`)
      return true
    } else {
      log(`Telegram error: ${JSON.stringify(parsed)}`)
      return false
    }
  } catch (e) {
    log(`Error enviant Telegram: ${e.message}`)
    return false
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getPendingTriggers() {
  try {
    if (!existsSync(TRIGGER_DIR)) return []
    const files = readdirSync(TRIGGER_DIR)
      .filter(f => f.startsWith('trigger_') && f.endsWith('.json'))
      .sort()

    const triggers = []
    for (const file of files) {
      try {
        const content = readFileSync(join(TRIGGER_DIR, file), 'utf-8')
        const trigger = JSON.parse(content)
        triggers.push({ file, trigger })
      } catch (e) {
        log(`Error llegint trigger ${file}: ${e.message}`)
      }
    }
    return triggers
  } catch (e) {
    log(`Error llegint trigger dir: ${e.message}`)
    return []
  }
}

function formatChiefMessage(chiefId, proposals) {
  const emoji = CHIEF_EMOJI[chiefId] || '🧚'
  const name = CHIEF_NAMES[chiefId] || chiefId.toUpperCase()
  const n = proposals.length

  const lines = [
    `🧚 **[Proposal Update]** ${emoji} **${name}** has ${n} proposal${n > 1 ? 's' : ''} with changes:\n`
  ]

  for (const p of proposals) {
    const status = p.status || 'unknown'
    const title = p.title || p.id || 'Unknown proposal'
    lines.push(`- ${title} - Status: ${status}`)
  }

  lines.push('\n_Check your workspace for details._')
  return lines.join('\n')
}

async function processTrigger(file, trigger, replyToMessageId = null) {
  log(`Processant trigger: ${file}`)

  const chain = trigger.notificationChain || []
  const chiefs = trigger.chiefs || {}

  if (chain.length === 0) {
    log(`Trigger buit o sense notificationChain: ${file}`)
    return true
  }

  log(`Notificant ${chain.length} chief(s): ${chain.join(' → ')}`)

  for (const chiefId of chain) {
    const proposals = chiefs[chiefId] || []
    if (proposals.length === 0) {
      log(`No proposals per a ${chiefId}, saltant`)
      continue
    }

    const message = formatChiefMessage(chiefId, proposals)
    log(`Enviant missatge per a ${chiefId}...`)

    const sent = sendTelegram(message, replyToMessageId)
    if (sent) {
      log(`✅ Notificacio enviada per ${chiefId}`)
    } else {
      log(`❌ Error enviant notificacio per ${chiefId}`)
    }

    // 2-second delay between messages
    await sleep(2000)
  }

  return true
}

async function main() {
  // Accept topic_id from command line argument: node script.js <topic_id>
  const topicId = process.argv[2] || null
  
  log('='.repeat(50))
  log('Process Proposal Triggers - INICIANT')
  log(`Trigger dir: ${TRIGGER_DIR}`)
  if (topicId) log(`Reply-to topic_id: ${topicId}`)
  log('='.repeat(50))

  const triggers = getPendingTriggers()

  if (triggers.length === 0) {
    log('No hi ha triggers pendents')
    return
  }

  log(`Trobats ${triggers.length} trigger(s) pendent(s)`)

  let processed = 0
  let errors = 0

  for (const { file, trigger } of triggers) {
    try {
      const success = await processTrigger(file, trigger, topicId)
      if (success) {
        // Delete the trigger file after successful processing
        unlinkSync(join(TRIGGER_DIR, file))
        log(`Trigger eliminat: ${file}`)
        processed++
      } else {
        errors++
      }
    } catch (e) {
      log(`Error processant trigger ${file}: ${e.message}`)
      errors++
    }
  }

  log(`Processats: ${processed} | Errors: ${errors}`)
  log('FI')
}

// Run if called directly
main().catch(e => {
  log(`Fatal error: ${e.message}`)
  process.exit(1)
})

// Export for use as module
export { main, processTrigger, getPendingTriggers }
