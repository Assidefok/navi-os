/**
 * Navi OS - Simple API Server
 * Serves Brain API endpoints + static React build
 */

import express from 'express'
import cors from 'cors'
import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync, createReadStream, unlinkSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const MEMORY_DIR = join(WORKSPACE, 'memory')
const SKILLS_DIR = join(WORKSPACE, 'skills')
const DATA_DIR = join(WORKSPACE, 'data')
const ORG_CHART_FILE = join(DATA_DIR, 'org-chart.json')
const PM_BOARD_FILE = join(DATA_DIR, 'pm-board.json')
const CHIEFS_COUNCIL_FILE = join(WORKSPACE, 'navi-os', 'src', 'data', 'chiefs-council.json')
const INTERNAL_PORT = globalThis.process?.env?.PORT || 3001

const app = express()
app.use(cors())

// Custom JSON parser with error handling to prevent crashes on malformed JSON
app.use((req, res, next) => {
  express.json()(req, res, (err) => {
    if (err) {
      console.error(`[JSON Parse Error] ${req.method} ${req.path}: ${err.message}`)
      return res.status(400).json({ error: 'Invalid JSON', details: err.message })
    }
    next()
  })
})

function ensureDataFile(filePath, fallback) {
  mkdirSync(dirname(filePath), { recursive: true })
  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8')
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    ensureDataFile(filePath, fallback)
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return fallback
  }
}

function writeJsonSafe(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function getOrgChart() {
  return readJsonSafe(ORG_CHART_FILE, { human: { name: 'Aleix', role: 'Human', emoji: '🧑' }, chiefs: [] })
}

function getPmBoard() {
  return readJsonSafe(PM_BOARD_FILE, {
    meta: { version: 1, path: PM_BOARD_FILE, updatedAt: new Date().toISOString() },
    tasks: [],
  })
}

function savePmBoard(board) {
  board.meta = { ...(board.meta || {}), version: 1, path: PM_BOARD_FILE, updatedAt: new Date().toISOString() }
  writeJsonSafe(PM_BOARD_FILE, board)
}

// ─── Memory Files ─────────────────────────────────────────────────────────────

app.get('/api/memory/files', (req, res) => {
  try {
    const files = []
    
    // Recursive function to get all .md files
    const scanDir = (dir, basePath = '') => {
      if (!existsSync(dir)) return
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          // Scan subdirectories but exclude certain folders
          if (!['node_modules', '.git', '__pycache__'].includes(entry.name)) {
            scanDir(fullPath, basePath + entry.name + '/')
          }
        } else if (entry.name.endsWith('.md')) {
          const stat = statSync(fullPath)
          files.push({
            name: basePath + entry.name,
            path: fullPath,
            modified: stat.mtime.toISOString(),
            size: stat.size,
            pinned: ['MEMORY.md', 'BACKLOG.md'].includes(entry.name),
          })
        }
      }
    }
    
    scanDir(MEMORY_DIR)
    // Sort: pinned first, then by date descending
    files.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.modified) - new Date(a.modified)
    })
    res.json({ files })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/memory/file', (req, res) => {
  try {
    const reqPath = (req.query.path || '').replace(/^\/+/, '')
    const fullPath = resolve(MEMORY_DIR, reqPath)

    if (!fullPath.startsWith(MEMORY_DIR)) {
      return res.status(403).json({ error: 'Invalid path' })
    }
    if (!existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const content = readFileSync(fullPath, 'utf-8')
    res.json({ content, path: fullPath })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Daily Briefs ─────────────────────────────────────────────────────────────

app.get('/api/briefs', (req, res) => {
  try {
    const briefs = []
    if (existsSync(MEMORY_DIR)) {
      const entries = readdirSync(MEMORY_DIR)
        .filter(f => f.startsWith('daily-') && f.endsWith('.md'))

      for (const f of entries) {
        const fullPath = join(MEMORY_DIR, f)
        const content = readFileSync(fullPath, 'utf-8')
        const stat = statSync(fullPath)
        const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/)
        const date = dateMatch ? dateMatch[1] : f.replace('daily-', '').replace('.md', '')

        const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1] : `Brief ${date}`

        const status = content.includes('*Generated at') ? 'delivered' : 'pending'

        const lines = content.split('\n').filter(l => l.trim())
        const preview = lines.length > 2 ? lines.slice(1, 3).join(' | ').substring(0, 120) : ''

        briefs.push({ id: f, date, title, status, preview, modified: stat.mtime.toISOString() })
      }
    }
    briefs.sort((a, b) => new Date(b.date) - new Date(a.date))
    res.json({ briefs })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Org Chart / PM Board ─────────────────────────────────────────────────────

app.get('/api/org-chart', (req, res) => {
  res.json(getOrgChart())
})

app.get('/api/pm-board', (req, res) => {
  const board = getPmBoard()
  const org = getOrgChart()
  const chiefsById = Object.fromEntries((org.chiefs || []).map(chief => [chief.agentId, chief]))
  const tasks = (board.tasks || []).map(task => ({
    ...task,
    assigneeChief: chiefsById[task.assignee] || null,
    stale: task.updatedDate ? (Date.now() - new Date(task.updatedDate).getTime()) >= 5 * 24 * 60 * 60 * 1000 : false,
  }))
  res.json({ ...board, tasks })
})

app.post('/api/pm-board', (req, res) => {
  try {
    const board = getPmBoard()
    const body = req.body || {}
    const now = new Date().toISOString()
    const task = {
      id: body.id || `pm-${Date.now()}`,
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      assignee: String(body.assignee || '').trim(),
      status: ['todo', 'in-progress', 'review', 'done'].includes(body.status) ? body.status : 'todo',
      priority: ['critica', 'alta', 'media', 'baixa'].includes(body.priority) ? body.priority : 'media',
      createdDate: now,
      updatedDate: now,
      deliverableLink: String(body.deliverableLink || ''),
      notes: Array.isArray(body.notes) ? body.notes : [],
      history: [
        {
          at: now,
          by: String(body.movedBy || 'system'),
          action: 'created',
          to: ['todo', 'in-progress', 'review', 'done'].includes(body.status) ? body.status : 'todo',
        }
      ]
    }

    if (!task.title || !task.assignee) {
      return res.status(400).json({ error: 'title and assignee are required' })
    }

    board.tasks = [...(board.tasks || []), task]
    savePmBoard(board)
    res.json({ ok: true, task })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/pm-board/:id', (req, res) => {
  try {
    const board = getPmBoard()
    const body = req.body || {}
    const now = new Date().toISOString()
    let updatedTask = null

    board.tasks = (board.tasks || []).map(task => {
      if (task.id !== req.params.id) return task
      const next = { ...task }
      const history = Array.isArray(next.history) ? [...next.history] : []

      if (body.status && body.status !== next.status) {
        history.push({
          at: now,
          by: String(body.movedBy || 'system'),
          action: 'status-change',
          from: next.status,
          to: body.status,
        })
        next.status = body.status
      }

      if (body.note) {
        next.notes = [
          ...(Array.isArray(next.notes) ? next.notes : []),
          { at: now, by: String(body.movedBy || 'system'), text: String(body.note) }
        ]
      }

      if (body.deliverableLink !== undefined) next.deliverableLink = String(body.deliverableLink || '')
      if (body.priority && ['critica', 'alta', 'media', 'baixa'].includes(body.priority)) next.priority = body.priority
      if (body.assignee) next.assignee = String(body.assignee)
      next.history = history
      next.updatedDate = now
      updatedTask = next
      return next
    })

    if (!updatedTask) return res.status(404).json({ error: 'Task not found' })
    savePmBoard(board)
    res.json({ ok: true, task: updatedTask })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Skill Content (for skill detail modal) ─────────────────────────────────

app.get('/api/skill-content', (req, res) => {
  try {
    const name = req.query.name || ''
    if (!name) return res.status(400).json({ error: 'name required' })

    // Try workspace skills dir
    const skillPath = join(SKILLS_DIR, name, 'SKILL.md')
    if (existsSync(skillPath)) {
      const content = readFileSync(skillPath, 'utf-8')
      return res.json({ content, source: 'workspace' })
    }

    // Try clawhub skills
    const clawhubSkill = join(WORKSPACE, 'navi-os', 'src', 'data', 'skills', name, 'SKILL.md')
    if (existsSync(clawhubSkill)) {
      const content = readFileSync(clawhubSkill, 'utf-8')
      return res.json({ content, source: 'clawhub' })
    }

    res.json({ content: '', source: 'not_found' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/skill-toggle', (req, res) => {
  // Skill enable/disable - log it but don't actually toggle (requires skill system restart)
  const { name, enabled } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  console.log(`[Skill Toggle] ${name} -> ${enabled ? 'enabled' : 'disabled'}`)
  res.json({ ok: true, name, enabled })
})

// ─── Current Model ─────────────────────────────────────────────────────────────

app.get('/api/current-model', (req, res) => {
  const model = process.env.OPENCLAW_MODEL || 'minimax-portal/MiniMax-M2.7'
  res.json({ model })
})

// ─── Skills Directory ──────────────────────────────────────────────────────────

app.get('/api/skills', (req, res) => {
  try {
    const skillsIndex = join(SKILLS_DIR, 'index.md')
    if (!existsSync(skillsIndex)) {
      return res.json({ skills: [] })
    }

    const content = readFileSync(skillsIndex, 'utf-8')
    const lines = content.split('\n')
    const skills = []
    let section = 'built-in'

    for (const line of lines) {
      if (line.includes('## Custom Skills')) { section = 'custom'; continue }
      if (line.startsWith('|') && !line.includes('---') && line.includes('|')) {
        const cols = line.split('|').map(c => c.trim()).filter(Boolean)
        if (cols.length >= 4 && cols[0] !== 'Name') {
          const [name, owner, status, category, lastUpdated] = cols
          skills.push({ name, owner, status, category, lastUpdated, source: section })
        }
      }
    }

    res.json({ skills })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Sessions (from OpenClaw sessions.json) ─────────────────────────────────

app.get('/api/sessions', (req, res) => {
  try {
    const sessionsFile = '/home/user/.openclaw/agents/main/sessions/sessions.json'
    if (!existsSync(sessionsFile)) {
      return res.json({ sessions: [], activeCount: 0 })
    }
    const raw = JSON.parse(readFileSync(sessionsFile, 'utf-8'))
    const sessions = []
    const now = Date.now()

    const enrichSession = (base, data) => {
      const sessionFile = data.sessionFile || null
      const lockFile = sessionFile ? `${sessionFile}.lock` : null
      const fileExists = sessionFile && existsSync(sessionFile)
      const lockExists = lockFile && existsSync(lockFile)
      const lastActivityMs = fileExists ? statSync(sessionFile).mtimeMs : null
      const lastActivityAt = lastActivityMs ? new Date(lastActivityMs).toISOString() : null
      const freshWindowMs = 60 * 1000
      const activeWindowMs = 15 * 60 * 1000
      const startedAtMs = data.startedAt ? Number(data.startedAt) : null
      const endedAtMs = data.endedAt ? Number(data.endedAt) : null
      const hasFreshActivity = !!((lastActivityMs && (now - lastActivityMs) <= freshWindowMs) || (startedAtMs && (now - startedAtMs) <= freshWindowMs))
      const isRecentlyOpen = !!((lastActivityMs && (now - lastActivityMs) <= activeWindowMs) || (startedAtMs && (now - startedAtMs) <= activeWindowMs))
      const isInteractiveSession = base.type === 'main' || base.type === 'subagent'
      const presenceActive = !endedAtMs && (lockExists || hasFreshActivity || (isInteractiveSession && isRecentlyOpen) || data.status === 'running')

      let status = data.status || 'unknown'
      if (lockExists || hasFreshActivity) {
        status = 'running'
      } else if (presenceActive) {
        status = 'active'
      } else if (status === 'running') {
        status = endedAtMs ? 'done' : 'stale'
      }

      const runtimeMs = (status === 'running' || status === 'active') && startedAtMs
        ? now - startedAtMs
        : (data.runtimeMs || 0)

      return {
        ...base,
        status,
        runtimeMs,
        sessionFile,
        live: !!(lockExists || hasFreshActivity),
        presenceActive,
        lastActivityAt,
      }
    }
    
    for (const [key, data] of Object.entries(raw)) {
      if (key.includes(':subagent:')) {
        sessions.push(enrichSession({
          id: key,
          label: data.label || key.split(':').pop(),
          type: 'subagent',
          model: data.model || 'unknown',
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel: data.lastChannel || 'unknown',
        }, data))
      } else if (key.includes(':cron:')) {
        const nameMatch = key.match(/cron:([^:]+)/)
        sessions.push(enrichSession({
          id: key,
          label: data.label || (nameMatch ? `Cron: ${nameMatch[1]}` : key),
          type: 'cron',
          model: data.model || 'MiniMax-M2.7',
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel: data.lastChannel || 'system',
        }, data))
      } else if (key.includes(':main:')) {
        const channel = data.lastChannel || 'webchat'
        const threadMatch = key.match(/:thread:[^:]+:(\d+)/)
        const topicLabel = threadMatch ? ` · thread ${threadMatch[1]}` : ''
        const label = data.label || `Sessio ${channel}${topicLabel}`

        sessions.push(enrichSession({
          id: key,
          label,
          type: 'main',
          model: data.model || 'MiniMax-M2.7',
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel,
        }, data))
      }
    }

    sessions.sort((a, b) => {
      const aActive = a.status === 'running' || a.live
      const bActive = b.status === 'running' || b.live
      if (aActive !== bActive) return aActive ? -1 : 1
      const aTime = new Date(a.lastActivityAt || a.startedAt || a.endedAt || 0).getTime()
      const bTime = new Date(b.lastActivityAt || b.startedAt || b.endedAt || 0).getTime()
      return bTime - aTime
    })
    
    const activeCount = sessions.filter(s => s.presenceActive || s.status === 'running' || s.live).length
    res.json({ sessions, activeCount })
  } catch (err) {
    res.status(500).json({ error: err.message, sessions: [] })
  }
})

// ─── OpenClaw Cron Health ─────────────────────────────────────────────────────

app.get('/api/cron-health', (req, res) => {
  try {
    const cronJobsFile = '/home/user/.openclaw/cron/jobs.json'
    const raw = readJsonSafe(cronJobsFile, { jobs: [] })
    const now = Date.now()

    const formatEvery = (everyMs) => {
      if (!everyMs) return 'Interval desconegut'
      const minutes = Math.round(everyMs / 60000)
      const hours = Math.round(everyMs / 3600000)
      const days = Math.round(everyMs / 86400000)
      if (minutes < 60) return `Cada ${minutes} min`
      if (hours < 24 && everyMs % 3600000 === 0) return `Cada ${hours} h`
      if (everyMs % 86400000 === 0) return `Cada ${days} dia(es)`
      return `Cada ${minutes} min`
    }

    const scheduleTypeLabel = (schedule = {}) => {
      if (schedule.kind === 'cron') return 'Cron expression'
      if (schedule.kind === 'every') return 'Recurring interval'
      if (schedule.kind === 'at') return 'One-shot'
      return 'Desconegut'
    }

    const scheduleLabel = (schedule = {}) => {
      if (schedule.kind === 'cron') return schedule.expr || 'Cron sense expressio'
      if (schedule.kind === 'every') return formatEvery(schedule.everyMs)
      if (schedule.kind === 'at') return schedule.at || 'Execucio unica'
      return 'Schedule desconegut'
    }

    const deriveStatus = (job) => {
      if (!job.enabled) return 'disabled'
      const state = job.state || {}
      if (state.lastStatus === 'error' || state.lastRunStatus === 'error') return 'failed'
      if (typeof state.nextRunAtMs === 'number' && state.nextRunAtMs < now && state.consecutiveErrors > 0) return 'failed'
      return 'healthy'
    }

    const jobs = (raw.jobs || []).map(job => {
      const schedule = job.schedule || {}
      const state = job.state || {}
      const lastRun = state.lastRunAtMs ? new Date(state.lastRunAtMs).toISOString() : null
      const nextRun = state.nextRunAtMs ? new Date(state.nextRunAtMs).toISOString() : null
      const status = deriveStatus(job)
      const timezone = schedule.tz || 'UTC'
      const scheduleKind = schedule.kind || 'unknown'
      const error = state.lastError || state.lastErrorReason || null

      return {
        id: job.id,
        name: job.name || 'Unnamed job',
        description: job.description || '',
        status,
        enabled: !!job.enabled,
        lastRun,
        nextRun,
        error,
        schedule,
        scheduleKind,
        scheduleType: scheduleTypeLabel(schedule),
        scheduleLabel: scheduleLabel(schedule),
        scheduleExpr: schedule.expr || null,
        intervalMs: schedule.everyMs || null,
        timezone,
        sessionTarget: job.sessionTarget || null,
        deliveryMode: job.delivery?.mode || null,
        nameLabel: scheduleLabel(schedule),
      }
    })

    res.json({ jobs })
  } catch (err) {
    res.status(500).json({ error: err.message, jobs: [] })
  }
})

// ─── Prototype & Ideas Data ───────────────────────────────────────────────────

app.get('/api/prototypes', (req, res) => {
  try {
    const dataFile = join(WORKSPACE, 'data', 'prototypes.json')
    if (!existsSync(dataFile)) {
      return res.json({ prototypes: [] })
    }
    const data = JSON.parse(readFileSync(dataFile, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/lab/overnight-builds', (req, res) => {
  try {
    const jobsData = readJsonSafe('/home/user/.openclaw/cron/jobs.json', { jobs: [] })
    const reportsIndex = readJsonSafe(join(WORKSPACE, 'navi-os-improvement', 'reports', 'index.json'), { reports: [] })

    const buildItems = []

    for (const job of jobsData.jobs || []) {
      const title = job.name || 'Unnamed job'
      const isRelevant = /navi os|overnight|audit|backup|rolling|somiar/i.test(title)
      if (!isRelevant) continue

      const lastRunAtMs = job.state?.lastRunAtMs || null
      const nextRunAtMs = job.state?.nextRunAtMs || null
      const status = !job.enabled ? 'disabled' : (job.state?.lastStatus === 'error' || job.state?.lastRunStatus === 'error' ? 'failed' : 'healthy')

      buildItems.push({
        id: `cron-${job.id}`,
        kind: 'cron',
        title,
        status,
        summary: job.description || job.payload?.message?.slice(0, 180) || 'Cron build pipeline',
        timestamp: lastRunAtMs ? new Date(lastRunAtMs).toISOString() : null,
        nextRun: nextRunAtMs ? new Date(nextRunAtMs).toISOString() : null,
        timezone: job.schedule?.tz || 'UTC',
        schedule: job.schedule?.expr || (job.schedule?.everyMs ? `every ${Math.round(job.schedule.everyMs / 60000)} min` : job.schedule?.kind || '—'),
        source: 'cron',
      })
    }

    for (const report of reportsIndex.reports || []) {
      const timestamp = report.date
        ? new Date(`${report.date}T${(report.time || '00:00').replace('.', ':')}:00`).toISOString()
        : null

      buildItems.push({
        id: `report-${report.id || report.filename}`,
        kind: report.type || 'report',
        title: report.title || report.filename,
        status: report.type === 'execution' ? 'healthy' : 'info',
        summary: report.summary || 'Self-improvement report',
        timestamp,
        nextRun: null,
        timezone: 'Europe/Madrid',
        schedule: report.type || 'report',
        source: 'self-improvement',
        filename: report.filename || null,
      })
    }

    buildItems.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    res.json({ builds: buildItems.slice(0, 60) })
  } catch (err) {
    res.status(500).json({ error: err.message, builds: [] })
  }
})

app.get('/api/lab/build-logs', (req, res) => {
  try {
    const jobsData = readJsonSafe('/home/user/.openclaw/cron/jobs.json', { jobs: [] })
    const reportsIndex = readJsonSafe(join(WORKSPACE, 'navi-os-improvement', 'reports', 'index.json'), { reports: [] })
    const cronRunDir = '/home/user/.openclaw/cron/runs'
    const improvementLogsDir = join(WORKSPACE, 'navi-os-improvement', 'logs')
    const reportsDir = join(WORKSPACE, 'navi-os-improvement', 'reports')
    const logs = []
    const jobNameMap = new Map((jobsData.jobs || []).map(job => [job.id, job.name || job.id]))

    if (existsSync(cronRunDir)) {
      const runFiles = readdirSync(cronRunDir).filter(f => f.endsWith('.jsonl'))
      for (const file of runFiles) {
        const lines = readFileSync(join(cronRunDir, file), 'utf-8').split('\n').filter(Boolean).slice(-5)
        for (const line of lines) {
          try {
            const entry = JSON.parse(line)
            const timestamp = new Date(entry.ts || entry.runAtMs || Date.now()).toISOString()
            const title = jobNameMap.get(entry.jobId) || entry.jobId || file
            const content = [
              `# ${title}`,
              '',
              `**Date:** ${timestamp}`,
              `**Type:** Cron Run`,
              `**Status:** ${entry.status || 'unknown'}`,
              `**Model:** ${entry.model || '—'}`,
              `**Duration:** ${entry.durationMs ? `${Math.round(entry.durationMs / 1000)}s` : '—'}`,
              '',
              '## Summary',
              '',
              entry.summary || entry.error || `${entry.action || 'run'} completed`,
            ].join('\n')

            logs.push({
              id: `cron-run-${entry.ts || entry.runAtMs || Math.random()}`,
              type: 'cron',
              source: 'cron',
              title,
              status: entry.status || 'unknown',
              timestamp,
              summary: entry.summary || entry.error || `${entry.action || 'run'} completed`,
              meta: `${entry.model || '—'} · ${entry.durationMs ? `${Math.round(entry.durationMs / 1000)}s` : '—'}`,
              content,
            })
          } catch {}
        }
      }
    }

    if (existsSync(improvementLogsDir)) {
      const files = readdirSync(improvementLogsDir).filter(f => f.endsWith('.log'))
      for (const file of files) {
        const fullPath = join(improvementLogsDir, file)
        const stat = statSync(fullPath)
        const content = readFileSync(fullPath, 'utf-8')
        const summary = content.split('\n').filter(Boolean).slice(0, 8).join(' ').slice(0, 320)
        logs.push({
          id: `improvement-log-${file}`,
          type: 'self-improvement',
          source: 'self-improvement',
          title: file,
          status: 'info',
          timestamp: stat.mtime.toISOString(),
          summary: summary || 'Self-improvement log',
          meta: 'local filesystem log',
          content: `# ${file}\n\n${content}`,
        })
      }
    }

    for (const report of reportsIndex.reports || []) {
      const timestamp = report.date
        ? new Date(`${report.date}T${(report.time || '00:00').replace('.', ':')}:00`).toISOString()
        : new Date().toISOString()
      const reportPath = report.filename ? join(reportsDir, report.filename) : null
      const fileContent = reportPath && existsSync(reportPath)
        ? readFileSync(reportPath, 'utf-8')
        : `# ${report.title || 'Report'}\n\n${report.summary || 'Self-improvement report'}`
      logs.push({
        id: `report-${report.id || report.filename}`,
        type: 'report',
        source: 'self-improvement',
        title: report.title || report.filename || 'Report',
        status: report.type === 'execution' ? 'healthy' : 'info',
        timestamp,
        summary: report.summary || 'Self-improvement report',
        meta: report.type || 'report',
        content: fileContent,
      })
    }

    logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    res.json({ logs: logs.slice(0, 120) })
  } catch (err) {
    res.status(500).json({ error: err.message, logs: [] })
  }
})

app.get('/api/ideas', (req, res) => {
  try {
    const dataFile = join(WORKSPACE, 'data', 'ideas.json')
    if (!existsSync(dataFile)) {
      return res.json({ ideas: [] })
    }
    const data = JSON.parse(readFileSync(dataFile, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Self-Improvement Proposals ──────────────────────────────────────────────

app.get('/api/self-improvement/proposals', (req, res) => {
  try {
    const improvementDir = join(WORKSPACE, 'navi-os-improvement', 'reports')
    const proposals = []
    
    if (!existsSync(improvementDir)) {
      return res.json({ proposals: [] })
    }
    
    const files = readdirSync(improvementDir)
      .filter(f => f.endsWith('-improvements.md'))
      .sort()
      .reverse()
    
    for (const file of files.slice(0, 7)) { // Latest 7 days
      const filePath = join(improvementDir, file)
      const content = readFileSync(filePath, 'utf-8')
      
      // Extract date from filename (2026-04-01-23.00-improvements.md)
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/)
      const generatedDate = dateMatch ? dateMatch[1] : file
      
      // Check for corresponding execution file
      const execFile = file.replace('-improvements.md', '-execution.md')
      const execFilePath = join(improvementDir, execFile)
      const hasExecution = existsSync(execFilePath)
      
      // Parse improvements from markdown
      const improvementBlocks = content.split(/^### IMP-/m).filter(Boolean)
      
      for (const block of improvementBlocks) {
        const lines = block.trim().split('\n')
        const firstLine = lines[0] || ''
        
        // Extract ID and title from first line: "2026-04-01-01 — PM2 Ecosystem Fix: Separar API i Vite"
        const idMatch = firstLine.match(/^(\d{4}-\d{2}-\d{2}-\d{2})\s*—\s*(.+)/)
        const id = idMatch ? `IMP-${idMatch[1]}` : null
        const title = idMatch ? idMatch[2].trim() : firstLine
        
        // Extract metadata from **field:** lines
        const getField = (field) => {
          const line = lines.find(l => l.startsWith(`**${field}:**`))
          return line ? line.replace(`**${field}:**`, '').trim() : ''
        }
        
        const area = getField('Area')
        const type = getField('Type')
        const priority = getField('Priority')
        const impact = getField('Impact')
        const risk = getField('Risk')
        
        // Extract steps
        const stepsSection = block.match(/\*\*Implementation Steps:\*\*([\s\S]*?)(?=\n\*\*Risk:)/)
        const steps = stepsSection 
          ? stepsSection[1].trim().split('\n').filter(l => l.match(/^\d+\./)).map(l => l.replace(/^\d+\.\s*/, '').trim())
          : []
        
        if (id) {
          // Check for approval/denial files to determine actual status
          const approvedFile = join(WORKSPACE, 'memory', `approved-${generatedDate}-${id}.json`)
          const deniedFile = join(WORKSPACE, 'memory', `denied-${generatedDate}-${id}.json`)
          
          let status = hasExecution ? 'executed' : 'pending'
          let approvedAt = null
          let deniedAt = null
          
          if (existsSync(approvedFile)) {
            try {
              const approvalData = JSON.parse(readFileSync(approvedFile, 'utf-8'))
              status = approvalData.status || (approvalData.executedAt ? 'executed' : 'approved')
              approvedAt = approvalData.approvedAt
            } catch {}
          } else if (existsSync(deniedFile)) {
            status = 'denied'
            try {
              const denialData = JSON.parse(readFileSync(deniedFile, 'utf-8'))
              deniedAt = denialData.deniedAt
            } catch {}
          }
          
          proposals.push({
            id,
            title,
            area,
            type,
            priority,
            impact,
            risk,
            description: impact || '',
            generatedDate,
            buildLog: execFile,
            hasExecution,
            status,
            approvedAt,
            deniedAt,
            steps,
          })
        }
      }
    }
    
    // Sort by date descending, then by ID
    proposals.sort((a, b) => {
      const dateCmp = b.generatedDate.localeCompare(a.generatedDate)
      if (dateCmp !== 0) return dateCmp
      return b.id.localeCompare(a.id)
    })
    
    res.json({ proposals })
  } catch (err) {
    res.status(500).json({ error: err.message, proposals: [] })
  }
})

app.post('/api/self-improvement/approve', (req, res) => {
  try {
    const { proposalId, generatedDate } = req.body
    
    if (!proposalId || !generatedDate) {
      return res.status(400).json({ error: 'proposalId and generatedDate required' })
    }
    
    // Mark proposal as approved (will be executed by dreaming agents)
    const approvalFile = join(WORKSPACE, 'memory', `approved-${generatedDate}-${proposalId}.json`)
    const approvalData = {
      proposalId,
      generatedDate,
      approvedAt: new Date().toISOString(),
      status: 'approved',
      executedAt: null,
    }
    writeFileSync(approvalFile, JSON.stringify(approvalData, null, 2))
    
    res.json({ 
      ok: true, 
      message: `Proposal ${proposalId} approved — will be deployed tonight`,
      proposalId,
      generatedDate,
      status: 'approved'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/self-improvement/deny', (req, res) => {
  try {
    const { proposalId, generatedDate, reason } = req.body
    
    if (!proposalId || !generatedDate) {
      return res.status(400).json({ error: 'proposalId and generatedDate required' })
    }
    
    // Mark proposal as denied
    const denialFile = join(WORKSPACE, 'memory', `denied-${generatedDate}-${proposalId}.json`)
    const denialData = {
      proposalId,
      generatedDate,
      deniedAt: new Date().toISOString(),
      status: 'denied',
      reason: reason || null,
    }
    writeFileSync(denialFile, JSON.stringify(denialData, null, 2))
    
    res.json({ 
      ok: true, 
      message: `Proposal ${proposalId} denied`,
      proposalId,
      generatedDate,
      status: 'denied'
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get pending approved proposals (for dreaming agents)
app.get('/api/self-improvement/pending-deployments', (req, res) => {
  try {
    const memoryDir = join(WORKSPACE, 'memory')
    const approved = []
    
    const files = readdirSync(memoryDir)
    for (const file of files) {
      if (file.startsWith('approved-') && file.endsWith('.json')) {
        try {
          const data = JSON.parse(readFileSync(join(memoryDir, file), 'utf-8'))
          if (data.status === 'approved' && !data.executedAt) {
            approved.push(data)
          }
        } catch {}
      }
    }
    
    approved.sort((a, b) => new Date(a.approvedAt) - new Date(b.approvedAt))
    res.json({ pending: approved })
  } catch (err) {
    res.status(500).json({ error: err.message, pending: [] })
  }
})

// Mark a proposal as executed
app.post('/api/self-improvement/mark-executed', (req, res) => {
  try {
    const { proposalId, generatedDate } = req.body
    
    if (!proposalId || !generatedDate) {
      return res.status(400).json({ error: 'proposalId and generatedDate required' })
    }
    
    const approvalFile = join(WORKSPACE, 'memory', `approved-${generatedDate}-${proposalId}.json`)
    if (existsSync(approvalFile)) {
      const data = JSON.parse(readFileSync(approvalFile, 'utf-8'))
      data.status = 'executed'
      data.executedAt = new Date().toISOString()
      writeFileSync(approvalFile, JSON.stringify(data, null, 2))
    }
    
    res.json({ ok: true, proposalId, generatedDate })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Git Commit Detail ─────────────────────────────────────────────────────────

app.get('/api/git-commit/:hash', (req, res) => {
  try {
    const { hash } = req.params
    
    // Get commit info and changed files
    const info = execSync(`cd "${WORKSPACE}" && git show --format="%H|%an|%ae|%ai|%s|%b" --name-only ${hash} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 })
    
    const lines = info.split('\n')
    const firstLine = lines[0] || ''
    const parts = firstLine.split('|')
    
    if (parts.length < 5) {
      return res.json({ error: 'Could not parse commit' })
    }
    
    const [commitHash, authorName, authorEmail, date, subject, ...bodyRest] = parts
    const body = bodyRest.join('|')
    const files = lines.slice(1).filter(l => l.trim() && !l.includes('|'))
    
    // Get diff stats
    const stats = execSync(`cd "${WORKSPACE}" && git diff --stat ${hash}^..${hash} 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim()
    
    res.json({
      hash: commitHash,
      author: authorName,
      email: authorEmail,
      date,
      subject,
      body: body.trim(),
      files,
      stats
    })
  } catch (err) {
    res.json({ error: err.message })
  }
})

// ─── Git Log ───────────────────────────────────────────────────────────────────

app.get('/api/git-log', (req, res) => {
  try {
    const out = execSync(`cd "${WORKSPACE}" && git log --oneline -30 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 }).trim()
    const lines = out.split('\n').filter(Boolean).map(line => {
      const parts = line.match(/^([a-f0-9]+)\s+(.*)$/)
      if (parts) return { hash: parts[1], message: parts[2], author: '—', date: '—' }
      return { hash: line.slice(0, 7), message: line.slice(8) || line, author: '—', date: '—' }
    })
    try {
      const dates = execSync(`cd "${WORKSPACE}" && git log --format="%ai|%an" -30 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')
      lines.forEach((line, i) => {
        if (dates[i]) {
          const [date, author] = dates[i].split('|')
          line.date = date
          line.author = author
        }
      })
    } catch {
      // ignore optional git metadata enrichment errors
    }
    res.json({ commits: lines })
  } catch (err) {
    res.json({ commits: [], error: err.message })
  }
})

// ─── Git Push Status ───────────────────────────────────────────────────────────

app.get('/api/git-push', (req, res) => {
  try {
    const remote = execSync(`cd "${WORKSPACE}" && git remote -v 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim()
    const branch = execSync(`cd "${WORKSPACE}" && git branch --show-current 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim()
    const status = execSync(`cd "${WORKSPACE}" && git status -sb 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim()
    const unpushed = execSync(`cd "${WORKSPACE}" && git log @{u}..HEAD --oneline 2>/dev/null | wc -l`, { encoding: 'utf-8', timeout: 3000 }).trim()
    const ahead = parseInt(unpushed) || 0
    res.json({
      remote: remote || 'origin',
      branch: branch || 'master',
      status: status || 'clean',
      ahead,
      synced: ahead === 0
    })
  } catch (err) {
    res.json({ status: 'unknown', note: 'No git repo or not configured', error: err.message })
  }
})

// ─── Backup Status ─────────────────────────────────────────────────────────────

app.get('/api/backup-status', (req, res) => {
  try {
    const backupRoot = join(WORKSPACE, 'backups')
    const out = existsSync(backupRoot)
      ? execSync(`find "${backupRoot}" -name "*.tar.gz" | sort | tail -5`, { encoding: 'utf-8', timeout: 5000 }).trim()
      : ''
    const files = out ? out.split('\n').filter(Boolean) : []
    const lastBackup = files.length > 0 ? files[files.length - 1] : null
    let lastBackupTime = null
    let size = null
    if (lastBackup && existsSync(lastBackup)) {
      const stat = statSync(lastBackup)
      lastBackupTime = stat.mtime.toISOString()
      size = stat.size
    }
    res.json({
      lastBackup,
      lastBackupTime,
      status: lastBackup ? 'ok' : 'warning',
      note: lastBackup ? `${files.length} snapshot(s) found` : 'No backup archive found',
      totalSnapshots: files.length,
      size,
    })
  } catch {
    res.json({ status: 'unknown', note: 'Could not determine backup status' })
  }
})

// ─── System / Security / Files APIs ───────────────────────────────────────────

app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'read', status: 'ok', type: 'tool' },
      { name: 'write', status: 'ok', type: 'tool' },
      { name: 'edit', status: 'ok', type: 'tool' },
      { name: 'exec', status: 'ok', type: 'tool' },
      { name: 'web_search', status: 'ok', type: 'tool' },
      { name: 'web_fetch', status: 'ok', type: 'tool' },
      { name: 'image_generate', status: 'ok', type: 'tool' },
      { name: 'process', status: 'ok', type: 'tool' },
      { name: 'sessions_yield', status: 'ok', type: 'tool' },
    ]
  })
})

app.get('/api/system-metrics', (req, res) => {
  try {
    const cpuRaw = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'", { encoding: 'utf-8', timeout: 3000 }).trim()
    const memRaw = execSync("free -m | awk '/Mem:/{print $2\":\"$3}'", { encoding: 'utf-8', timeout: 3000 }).trim()
    const diskRaw = execSync("df -h / | tail -1 | awk '{print $5\":\"$4}'", { encoding: 'utf-8', timeout: 3000 }).trim()
    const [memTotal, memUsed] = (memRaw || '0:0').split(':')
    const [diskPct, diskFree] = (diskRaw || '0:0').split(':')

    res.json({
      cpu: parseFloat(cpuRaw) || 0,
      memory: { used: parseInt(memUsed, 10) || 0, total: parseInt(memTotal, 10) || 0 },
      disk: { used: (diskPct || '0').replace('%', ''), free: diskFree || '0' }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/pm2-status', (req, res) => {
  try {
    const out = execSync('cd /home/user/.openclaw/workspace/navi-os && npx pm2 jlist --silent 2>/dev/null', { encoding: 'utf-8', timeout: 5000 })
    const processes = JSON.parse(out || '[]')
    const summary = processes.map(p => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      memory: p.monit?.memory || 0,
      cpu: p.monit?.cpu || 0,
      restarts: p.pm2_env?.restart_time || 0,
      uptime: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0
    }))
    res.json({ processes: summary, total: processes.length })
  } catch (err) {
    res.json({ processes: [], total: 0, error: err.message })
  }
})

app.get('/api/agents', (req, res) => {
  res.json({ agents: [] })
})

app.get('/api/integrations', (req, res) => {
  res.json({
    integrations: [
      { name: 'OpenClaw Gateway', status: 'connected' },
      { name: 'Git', status: 'connected' },
      { name: 'Workspace', status: 'connected' },
    ]
  })
})

app.get('/api/ai-status', (req, res) => {
  // SAM: AI status endpoint - returns model info, provider, and active skills
  try {
    const defaultModel = process.env.OPENCLAW_MODEL || 'minimax-portal/MiniMax-M2'
    const provider = defaultModel.includes('openai') ? 'OpenAI' :
                     defaultModel.includes('anthropic') ? 'Anthropic' :
                     defaultModel.includes('minimax') ? 'MiniMax' : 'Unknown'
    
    // Get installed skills
    let skills = []
    try {
      const skillsDir = join(WORKSPACE, 'skills')
      if (existsSync(skillsDir)) {
        skills = readdirSync(skillsDir).filter(f => !f.startsWith('.'))
      }
    } catch {}

    res.json({
      model: defaultModel,
      provider: provider,
      status: 'connected',
      skills: skills.slice(0, 10), // Limit to 10 skills
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    res.status(500).json({ error: err.message, status: 'error' })
  }
})

app.get('/api/gateway-security', (req, res) => {
  try {
    const out = execSync('openclaw status 2>/dev/null | grep -E "Gateway|bind|auth|password" | head -10', { encoding: 'utf-8', timeout: 5000 })
    const lines = out.split('\n').filter(Boolean)
    const data = { auth: 'warning', bind: 'warning', trustedProxies: 'warning' }

    for (const line of lines) {
      if (line.includes('loopback') || line.includes('127.0.0.1')) data.bind = 'ok'
      if (line.toLowerCase().includes('auth') || line.toLowerCase().includes('password')) data.auth = 'ok'
    }

    res.json(data)
  } catch {
    res.json({ auth: 'unknown', bind: 'unknown', trustedProxies: 'unknown' })
  }
})

app.get('/api/security-audit', (req, res) => {
  try {
    const out = execSync('openclaw status --no-color 2>/dev/null', { encoding: 'utf-8', timeout: 30000 })
    
    // Find the Security audit section
    const lines = out.split('\n')
    const result = { critical: 0, warn: 0, info: 0, issues: [], raw: '' }
    let inSecuritySection = false
    const securityLines = []

    for (const line of lines) {
      if (line.trim() === 'Security audit') {
        inSecuritySection = true
        continue
      }
      if (inSecuritySection) {
        // Stop at next section (Channels or Sessions or empty line after content)
        if (line.startsWith('Channels') || line.startsWith('Sessions') || line.startsWith('Full report')) {
          break
        }
        securityLines.push(line)
      }
    }

    result.raw = securityLines.join('\n')

    // Parse summary: "Summary: 0 critical · 4 warn · 1 info"
    const summaryMatch = result.raw.match(/Summary:\s*(\d+)\s*critical.*?(\d+)\s*warn.*?(\d+)\s*info/i)
    if (summaryMatch) {
      result.critical = parseInt(summaryMatch[1], 10) || 0
      result.warn = parseInt(summaryMatch[2], 10) || 0
      result.info = parseInt(summaryMatch[3], 10) || 0
    }

    // Parse individual issues: "  WARN Description" or "  INFO Description"
    let currentIssue = null
    for (const line of securityLines) {
      const warnMatch = line.match(/^\s*WARN\s+(.+?)(?:\s+Fix:|$)/)
      const infoMatch = line.match(/^\s*INFO\s+(.+?)(?:\s+Fix:|$)/)
      const fixMatch = line.match(/^\s*Fix:\s+(.+)$/)
      const detailMatch = line.match(/^\s+gateway\.\S+\s+(.+)$/)

      if (warnMatch) {
        if (currentIssue) result.issues.push(currentIssue)
        currentIssue = { severity: 'warn', title: warnMatch[1].trim(), description: '', fix: '' }
      } else if (infoMatch) {
        if (currentIssue) result.issues.push(currentIssue)
        currentIssue = { severity: 'info', title: infoMatch[1].trim(), description: '', fix: '' }
      } else if (fixMatch && currentIssue) {
        currentIssue.fix = fixMatch[1].trim()
      } else if (detailMatch && currentIssue) {
        currentIssue.description += (currentIssue.description ? ' ' : '') + detailMatch[1].trim()
      }
    }
    if (currentIssue) result.issues.push(currentIssue)

    res.json(result)
  } catch (err) {
    res.json({ critical: 0, warn: 0, info: 0, issues: [], error: err.message })
  }
})

app.get('/api/workspace-files', (req, res) => {
  try {
    const out = execSync(`find "${WORKSPACE}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/.cache/*" 2>/dev/null | head -300`, { encoding: 'utf-8', timeout: 5000 })
    const files = out
      .split('\n')
      .filter(Boolean)
      .map(fullPath => {
        const stat = statSync(fullPath)
        return {
          path: fullPath.replace(`${WORKSPACE}/`, ''),
          name: fullPath.split('/').pop(),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        }
      })
    res.json({ files })
  } catch (err) {
    res.status(500).json({ error: err.message, files: [] })
  }
})

app.get('/api/file', (req, res) => {
  try {
    const reqPath = String(req.query.path || '').replace(/^\/+/, '')
    const fullPath = resolve(WORKSPACE, reqPath)
    if (!fullPath.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    if (!existsSync(fullPath)) return res.status(404).json({ error: 'File not found' })
    const content = readFileSync(fullPath, 'utf-8')
    res.json({ path: reqPath, content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Serve files as binary (for image previews)
app.get('/api/file-binary', (req, res) => {
  try {
    const reqPath = String(req.query.path || '').replace(/^\/+/, '')
    const fullPath = resolve(WORKSPACE, reqPath)
    if (!fullPath.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    if (!existsSync(fullPath)) return res.status(404).json({ error: 'File not found' })
    
    // Detect content type
    const ext = reqPath.split('.').pop().toLowerCase()
    const mimeTypes = {
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml',
      'bmp': 'image/bmp', 'ico': 'image/x-icon'
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'max-age=3600')
    const buffer = readFileSync(fullPath)
    res.send(buffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/file', (req, res) => {
  try {
    const reqPath = String(req.body.path || '').replace(/^\/+/, '')
    const fullPath = resolve(WORKSPACE, reqPath)
    if (!fullPath.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    writeFileSync(fullPath, String(req.body.content || ''), 'utf-8')
    res.json({ ok: true, path: reqPath })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/download', (req, res) => {
  try {
    const reqPath = String(req.query.path || '').replace(/^\/+/, '')
    const fullPath = resolve(WORKSPACE, reqPath)
    if (!fullPath.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    if (!existsSync(fullPath)) return res.status(404).json({ error: 'File not found' })
    const fileName = reqPath.split('/').pop()
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    const stream = createReadStream(fullPath)
    stream.pipe(res)
    stream.on('error', () => res.status(500).end())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/upload', (req, res) => {
  try {
    const { path: dirPath, name, content } = req.body || {}
    if (!dirPath || !name) return res.status(400).json({ error: 'path and name required' })
    const fullDir = resolve(WORKSPACE, String(dirPath).replace(/^\/+/, ''))
    if (!fullDir.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    const filePath = join(fullDir, String(name))
    if (!filePath.startsWith(WORKSPACE)) return res.status(403).json({ error: 'Invalid path' })
    mkdirSync(dirname(filePath), { recursive: true })
    const buffer = Buffer.from(content, 'base64')
    writeFileSync(filePath, buffer)
    res.json({ ok: true, path: filePath.replace(WORKSPACE + '/', '') })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/session/:id/messages', (req, res) => {
  try {
    const { id } = req.params
    const sessionsDir = '/home/user/.openclaw/agents/main/sessions'
    const sessionsFile = join(sessionsDir, 'sessions.json')
    
    let sessionFilePath = null
    
    // Find session file path from sessions.json
    if (existsSync(sessionsFile)) {
      const sessionsData = JSON.parse(readFileSync(sessionsFile, 'utf-8'))
      const sessionData = sessionsData[id]
      if (sessionData?.sessionFile) {
        sessionFilePath = sessionData.sessionFile
      }
    }
    
    // Fallback: try direct path
    if (!sessionFilePath) {
      const directPath = join(sessionsDir, `${id}.jsonl`)
      if (existsSync(directPath)) sessionFilePath = directPath
    }
    
    // Last resort: search for file
    if (!sessionFilePath) {
      const files = readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl') && !f.includes('.reset.') && !f.includes('.lock'))
      const match = files.find(f => f.startsWith(id.split(':').pop()?.substring(0, 8)))
      if (match) sessionFilePath = join(sessionsDir, match)
    }
    
    if (!sessionFilePath || !existsSync(sessionFilePath)) {
      return res.json({ messages: [], error: 'Session file not found' })
    }
    
    // Read JSONL file
    const content = readFileSync(sessionFilePath, 'utf-8')
    const lines = content.split('\n').filter(Boolean)
    
    const messages = []
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        
        // Handle OpenClaw message format: { type: "message", message: { role, content: [{type:"text",text}] } }
        if (parsed.type === 'message' && parsed.message) {
          const msg = parsed.message
          let text = ''
          if (Array.isArray(msg.content)) {
            text = msg.content.map(c => c.text || c.content || '').join('\n')
          } else if (typeof msg.content === 'string') {
            text = msg.content
          }
          messages.push({
            role: msg.role || 'unknown',
            content: text,
            timestamp: parsed.timestamp || null
          })
        }
        // Handle simple { role, content } format
        else if (parsed.role && parsed.content && parsed.type !== 'message') {
          const text = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content)
          messages.push({ role: parsed.role, content: text, timestamp: parsed.timestamp || null })
        }
      } catch {
        // ignore malformed session lines
      }
    }
    
    // Limit to last 50 messages
    const limited = messages.slice(-50)
    res.json({ messages: limited })
  } catch (err) {
    res.json({ messages: [], error: err.message })
  }
})

app.get('/api/backups', (req, res) => {
  try {
    const backupRoot = join(WORKSPACE, 'backups')
    if (!existsSync(backupRoot)) return res.json({ backups: [] })

    const manifests = execSync(`find "${backupRoot}" -name manifest.json | sort`, { encoding: 'utf-8', timeout: 5000 })
      .split('\n')
      .filter(Boolean)

    const backups = manifests
      .map(path => JSON.parse(readFileSync(path, 'utf-8')))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({ backups })
  } catch (err) {
    res.status(500).json({ error: err.message, backups: [] })
  }
})

app.post('/api/backups/create', (req, res) => {
  try {
    const type = String(req.body?.type || 'workspace')
    const label = String(req.body?.label || 'ui')
    const safeType = ['navi-os', 'workspace', 'config', 'full'].includes(type) ? type : 'workspace'
    const safeLabel = label.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 40) || 'ui'
    const script = join(WORKSPACE, 'scripts', '06-backup-create.sh')
    const prune = join(WORKSPACE, 'scripts', '09-backup-prune.sh')
    const archive = execSync(`${script} ${safeType} ${safeLabel}`, { encoding: 'utf-8', timeout: 120000 }).trim()
    if (existsSync(prune)) {
      execSync(`${prune} 7`, { encoding: 'utf-8', timeout: 30000 })
    }
    res.json({ ok: true, archive, type: safeType, label: safeLabel })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.post('/api/ideas/:id/accept', (req, res) => {
  try {
    const { id } = req.params
    const ideasFile = join(DATA_DIR, 'ideas.json')
    const proposalsFile = join(DATA_DIR, 'proposals.json')
    
    // Load ideas
    const ideasData = existsSync(ideasFile) ? JSON.parse(readFileSync(ideasFile, 'utf-8')) : { ideas: [] }
    const ideaIdx = ideasData.ideas.findIndex(i => i.id === id)
    if (ideaIdx === -1) {
      return res.status(404).json({ error: 'Idea not found' })
    }
    const idea = ideasData.ideas[ideaIdx]
    const now = new Date().toISOString()
    
    // Remove from ideas
    ideasData.ideas.splice(ideaIdx, 1)
    writeFileSync(ideasFile, JSON.stringify(ideasData, null, 2))
    
    // Add to proposals — status: debate (waiting for chief assigned to manage)
    const proposalsData = existsSync(proposalsFile) ? JSON.parse(readFileSync(proposalsFile, 'utf-8')) : { proposals: [] }
    const newProposal = {
      id: `prop-${Date.now()}`,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      author: idea.author || 'navi',
      assignee: idea.proposedTo || idea.assignee || null,
      status: 'debate',
      priority: idea.priority || 'media',
      track: idea.track || 'B',
      source: 'idea',
      originalId: idea.id,
      debateOutcome: null,
      debateNotes: [],
      createdAt: now,
      updatedAt: now
    }
    proposalsData.proposals = proposalsData.proposals || []
    proposalsData.proposals.unshift(newProposal)
    writeFileSync(proposalsFile, JSON.stringify(proposalsData, null, 2))
    
    // Fire automations for idea.accepted
    try {
      fetch('http://localhost:/api/internal/automations/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: 'idea.accepted',
          triggerData: {
            ideaTitle: idea.title,
            ideaDescription: idea.description,
            ideaAuthor: idea.author,
            assignee: newProposal.assignee,
            proposalId: newProposal.id,
            priority: newProposal.priority
          }
        })
      }).catch(() => {})
    } catch (_) {}
    
    res.json({ success: true, proposal: newProposal })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/ideas/:id/reject', (req, res) => {
  try {
    const { id } = req.params
    const ideasFile = join(DATA_DIR, 'ideas.json')
    
    const ideasData = existsSync(ideasFile) ? JSON.parse(readFileSync(ideasFile, 'utf-8')) : { ideas: [] }
    const ideaIdx = ideasData.ideas.findIndex(i => i.id === id)
    if (ideaIdx === -1) {
      return res.status(404).json({ error: 'Idea not found' })
    }
    
    const idea = ideasData.ideas[ideaIdx]
    ideasData.ideas[ideaIdx].status = 'rejected'
    writeFileSync(ideasFile, JSON.stringify(ideasData, null, 2))
    
    // Fire automations for idea.rejected
    try {
      fetch('http://localhost:/api/internal/automations/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: 'idea.rejected',
          triggerData: { ideaTitle: idea.title, ideaAuthor: idea.author }
        })
      }).catch(() => {})
    } catch (_) {}
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Proposals API ─────────────────────────────────────────────────────────────

app.get('/api/proposals', (req, res) => {
  try {
    const dataFile = join(WORKSPACE, 'data', 'proposals.json')
    if (!existsSync(dataFile)) {
      return res.json({ proposals: [] })
    }
    const data = JSON.parse(readFileSync(dataFile, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message, proposals: [] })
  }
})

app.post('/api/proposals', (req, res) => {
  try {
    const dataFile = join(WORKSPACE, 'data', 'proposals.json')
    const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : { proposals: [] }
    const VALID_STATUSES = ['pending', 'debate', 'accepted', 'processing', 'done', 'rejected']
    
    const newProposal = {
      id: `prop-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: VALID_STATUSES.includes(req.body?.status) ? req.body.status : 'pending',
      debateOutcome: null,
      debateNotes: []
    }
    
    data.proposals = data.proposals || []
    data.proposals.unshift(newProposal)
    
    writeFileSync(dataFile, JSON.stringify(data, null, 2))
    res.json(newProposal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/proposals/:id', (req, res) => {
  try {
    const { id } = req.params
    const dataFile = join(WORKSPACE, 'data', 'proposals.json')
    const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : { proposals: [] }
    
    const idx = data.proposals.findIndex(p => p.id === id)
    if (idx === -1) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    const oldProposal = data.proposals[idx]
    const oldStatus = oldProposal.status
    const newStatus = req.body.status
    
    data.proposals[idx] = { ...data.proposals[idx], ...req.body, updatedAt: new Date().toISOString() }
    writeFileSync(dataFile, JSON.stringify(data, null, 2))
    
    // Fire automations based on status transitions — ANY status change fires proposal.status_changed
    if (newStatus && newStatus !== oldStatus) {
      const triggerType = `debate.${newStatus === 'accepted' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'status_changed'}`
      // Fire the debate.* trigger for debate column transitions
      if (['debate.approved', 'debate.rejected', 'debate.status_changed'].includes(triggerType)) {
        try {
          fetch('http://localhost:/api/internal/automations/fire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              triggerType,
              triggerData: {
                proposalId: id,
                proposalTitle: oldProposal.title,
                description: oldProposal.description,
                author: oldProposal.author,
                assignee: oldProposal.assignee,
                priority: oldProposal.priority,
                debateNotes: req.body.debateNotes || []
              }
            })
          }).catch(() => {})
        } catch (_) {}
      }
      // Always fire proposal.status_changed for any transition (including pending→debate, debate→processing, etc.)
      try {
        fetch('http://localhost:/api/internal/automations/fire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            triggerType: 'proposal.status_changed',
            triggerData: {
              proposalId: id,
              proposalTitle: oldProposal.title,
              description: oldProposal.description,
              author: oldProposal.author,
              assignee: oldProposal.assignee,
              priority: oldProposal.priority,
              oldStatus,
              newStatus
            }
          })
        }).catch(() => {})
      } catch (_) {}
    }
    
    res.json(data.proposals[idx])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/proposals/:id', (req, res) => {
  try {
    const { id } = req.params
    const dataFile = join(WORKSPACE, 'data', 'proposals.json')
    const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf-8')) : { proposals: [] }
    
    const idx = data.proposals.findIndex(p => p.id === id)
    if (idx === -1) {
      return res.status(404).json({ error: 'Proposal not found' })
    }
    
    data.proposals.splice(idx, 1)
    writeFileSync(dataFile, JSON.stringify(data, null, 2))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Chiefs Council ───────────────────────────────────────────────────────────

function getChiefsCouncil() {
  return readJsonSafe(CHIEFS_COUNCIL_FILE, {
    meta: { version: 1, path: CHIEFS_COUNCIL_FILE, updatedAt: new Date().toISOString() },
    topics: [],
  })
}

// Standup API
const MEETINGS_DIR = join(WORKSPACE, 'team/meetings')

function getMeetings() {
  try {
    if (!existsSync(MEETINGS_DIR)) return []
    const files = readdirSync(MEETINGS_DIR).filter(f => f.endsWith('-daily-standup.md') || f.endsWith('-manual-standup.md'))
    return files.sort().reverse().map(file => {
      const content = readFileSync(join(MEETINGS_DIR, file), 'utf-8')
      const date = file.replace('-daily-standup.md', '').replace('-manual-standup.md', '')
      const chiefs = []
      if (content.includes('ELOM')) chiefs.push('ELOM')
      if (content.includes('WARREN')) chiefs.push('WARREN')
      if (content.includes('JEFF')) chiefs.push('JEFF')
      if (content.includes('SAM')) chiefs.push('SAM')
      // Extract executive summary
      const summaryMatch = content.match(/\*\*Executive Summary\*\*\s*\n\s*\n(.+?)(?=\n\n---|\n##)/s)
      const summary = summaryMatch ? summaryMatch[1].replace(/\[TBD.*?\]/g, '').trim() : null
      // Extract actions
      const actionMatches = content.match(/\|\s*(.+?)\s*\|\s*([A-Z]+)\s*\|/g) || []
      const actions = actionMatches.slice(1).map(a => {
        const parts = a.split('|').map(p => p.trim())
        return { text: parts[1] || '', owner: parts[2] || '', done: false }
      }).filter(a => a.text && a.text !== '[Action]')
      return { file, date, chiefs, summary, actions }
    })
  } catch { return [] }
}

app.get('/api/standups', (req, res) => {
  const meetings = getMeetings()
  res.json({ meetings })
})

app.get('/api/standup/:file', (req, res) => {
  const file = req.params.file
  const safePath = join(MEETINGS_DIR, file)
  if (!safePath.startsWith(MEETINGS_DIR)) return res.status(403).json({ error: 'Invalid path' })
  try {
    const content = readFileSync(safePath, 'utf-8')
    res.json({ content })
  } catch { res.status(404).json({ error: 'Not found' }) }
})

app.post('/api/standup/trigger', async (req, res) => {
  // Trigger the standup orchestrator script asynchronously
  const { exec } = await import('child_process')
  exec(`bash ${WORKSPACE}/scripts/09-standup-orchestrator.sh`, (err) => {
    if (err) console.error('Standup error:', err)
  })
  res.json({ success: true, message: 'Standup triggered', date: new Date().toISOString() })
})

app.get('/api/chief/:id/status', (req, res) => {
  const chiefId = req.params.id.toLowerCase()
  const chiefDir = join(WORKSPACE, 'team', chiefId)
  const memoryFile = join(chiefDir, 'MEMORY.md')
  const backlogFile = join(chiefDir, 'BACKLOG.md')
  try {
    let currentProject = 'Sense projecte actiu'
    let status = 'idle'
    let commitment = null
    if (existsSync(memoryFile)) {
      const content = readFileSync(memoryFile, 'utf-8')
      // Find active project
      const projMatch = content.match(/\|\s*([^\|]+?)\s*\|\s*(IN PROGRESS|IN-PROGRESS|In Progress)\s*\|/i)
      if (projMatch) currentProject = projMatch[1].trim()
      // Find status
      if (/IN PROGRESS|In-Progress/i.test(content)) status = 'in-progress'
      else if (/REVIEW/i.test(content)) status = 'review'
      else if (/DONE|COMPLETED/i.test(content)) status = 'done'
      // Find commitment from last standup notes
      const notesMatch = content.match(/\*\*Commitments?\*\*.*?\n\s*\n(.+?)(?=\n\n|\*\*|$)/is)
      if (notesMatch) commitment = notesMatch[1].trim().substring(0, 120)
    }
    res.json({ chiefId, currentProject, status, commitment })
  } catch { res.json({ chiefId, currentProject: 'Sense projecte actiu', status: 'unknown', commitment: null }) }
})

function saveChiefsCouncil(data) {
  data.meta = { ...(data.meta || {}), version: 1, path: CHIEFS_COUNCIL_FILE, updatedAt: new Date().toISOString() }
  writeJsonSafe(CHIEFS_COUNCIL_FILE, data)
}

// GET /api/chiefs-council — list all topics
app.get('/api/chiefs-council', (req, res) => {
  try {
    const data = getChiefsCouncil()
    res.json({ topics: data.topics || [] })
  } catch (err) {
    res.status(500).json({ error: err.message, topics: [] })
  }
})

// GET /api/chiefs-council/:id — get single topic
app.get('/api/chiefs-council/:id', (req, res) => {
  try {
    const data = getChiefsCouncil()
    const topic = (data.topics || []).find(t => t.id === req.params.id)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })
    res.json(topic)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/chiefs-council — create a new topic (Navi initiates)
app.post('/api/chiefs-council', (req, res) => {
  try {
    const { title, description } = req.body || {}
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title is required' })
    }
    const data = getChiefsCouncil()
    const now = new Date().toISOString()
    const topic = {
      id: `topic-${Date.now()}`,
      title: String(title).trim(),
      description: String(description || '').trim(),
      createdAt: now,
      responses: [],
    }
    data.topics = [topic, ...(data.topics || [])]
    saveChiefsCouncil(data)
    res.json(topic)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/chiefs-council/:id/responses — chief responds
app.post('/api/chiefs-council/:id/responses', (req, res) => {
  try {
    const { chiefId, text } = req.body || {}
    const VALID_CHIEF_IDS = ['elom', 'warren', 'jeff', 'sam']
    if (!chiefId || !VALID_CHIEF_IDS.includes(chiefId)) {
      return res.status(400).json({ error: 'valid chiefId required (elom, warren, jeff, sam)' })
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text is required' })
    }
    const data = getChiefsCouncil()
    const topicIdx = (data.topics || []).findIndex(t => t.id === req.params.id)
    if (topicIdx === -1) return res.status(404).json({ error: 'Topic not found' })

    const topic = { ...data.topics[topicIdx] }
    topic.responses = [...(topic.responses || [])]

    // Remove existing response for this chief if any
    topic.responses = topic.responses.filter(r => r.chiefId !== chiefId)
    topic.responses.push({
      chiefId,
      text: String(text).trim(),
      timestamp: new Date().toISOString(),
    })

    data.topics[topicIdx] = topic
    saveChiefsCouncil(data)
    res.json(topic)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Automations Engine ───────────────────────────────────────────────────────

const AUTOMATIONS_FILE = join(DATA_DIR, 'automations.json')

function getAutomations() {
  return readJsonSafe(AUTOMATIONS_FILE, {
    meta: { version: 1, path: AUTOMATIONS_FILE, updatedAt: new Date().toISOString() },
    automations: [],
    executionLog: []
  })
}

function saveAutomations(data) {
  data.meta = { ...(data.meta || {}), version: 1, path: AUTOMATIONS_FILE, updatedAt: new Date().toISOString() }
  writeJsonSafe(AUTOMATIONS_FILE, data)
}

// GET /api/automations — list all automations
app.get('/api/automations', (req, res) => {
  try {
    const data = getAutomations()
    res.json({
      automations: data.automations || [],
      meta: data.meta
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/automations/:id — get single automation
app.get('/api/automations/:id', (req, res) => {
  try {
    const data = getAutomations()
    const auto = (data.automations || []).find(a => a.id === req.params.id)
    if (!auto) return res.status(404).json({ error: 'Automation not found' })
    res.json(auto)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/automations — create new automation
app.post('/api/automations', (req, res) => {
  try {
    const data = getAutomations()
    const body = req.body || {}
    const now = new Date().toISOString()
    
    if (!body.name || !body.trigger || !body.actions) {
      return res.status(400).json({ error: 'name, trigger and actions are required' })
    }

    const automation = {
      id: body.id || `auto-${Date.now()}`,
      name: String(body.name).trim(),
      description: String(body.description || '').trim(),
      enabled: body.enabled !== false,
      trigger: body.trigger,
      conditions: Array.isArray(body.conditions) ? body.conditions : [],
      actions: Array.isArray(body.actions) ? body.actions : [],
      lastTriggered: null,
      triggerCount: 0,
      createdAt: now
    }

    data.automations = [...(data.automations || []), automation]
    saveAutomations(data)
    res.json({ ok: true, automation })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/automations/:id — update automation
app.patch('/api/automations/:id', (req, res) => {
  try {
    const data = getAutomations()
    const idx = (data.automations || []).findIndex(a => a.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Automation not found' })

    data.automations[idx] = {
      ...data.automations[idx],
      ...req.body,
      id: req.params.id // immutable
    }
    saveAutomations(data)
    res.json(data.automations[idx])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/automations/:id
app.delete('/api/automations/:id', (req, res) => {
  try {
    const data = getAutomations()
    const idx = (data.automations || []).findIndex(a => a.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Automation not found' })

    data.automations.splice(idx, 1)
    saveAutomations(data)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/automations/:id/toggle — enable/disable
app.post('/api/automations/:id/toggle', (req, res) => {
  try {
    const data = getAutomations()
    const idx = (data.automations || []).findIndex(a => a.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Automation not found' })

    data.automations[idx].enabled = !data.automations[idx].enabled
    saveAutomations(data)
    res.json({ ok: true, enabled: data.automations[idx].enabled })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/automations/:id/trigger — manually trigger an automation (for testing)
app.post('/api/automations/:id/trigger', (req, res) => {
  try {
    const data = getAutomations()
    const automation = (data.automations || []).find(a => a.id === req.params.id)
    if (!automation) return res.status(404).json({ error: 'Automation not found' })
    if (!automation.enabled) return res.status(400).json({ error: 'Automation is disabled' })

    const result = executeAutomation(automation, req.body || {}, data)
    saveAutomations(data)
    res.json({ ok: true, result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/automations/log — get execution log
app.get('/api/automations/log', (req, res) => {
  try {
    const data = getAutomations()
    const log = (data.executionLog || []).slice(-100) // last 100 entries
    res.json({ log })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Automation Execution Engine ──────────────────────────────────────────────

async function executeAutomation(automation, triggerData = {}, globalData) {
  const now = new Date().toISOString()
  const results = []

  for (const action of automation.actions) {
    try {
      let result = null
      switch (action.type) {
        case 'proposal.create': {
          // Create a proposal from trigger data
          const proposalsFile = join(DATA_DIR, 'proposals.json')
          const proposalsData = existsSync(proposalsFile) ? JSON.parse(readFileSync(proposalsFile, 'utf-8')) : { proposals: [] }
          const newProposal = {
            id: `proposal-${Date.now()}`,
            title: triggerData.ideaTitle || triggerData.title || automation.name,
            description: triggerData.ideaDescription || triggerData.description || automation.description || '',
            author: triggerData.author || triggerData.ideaAuthor || 'navi',
            assignee: triggerData.assignee || automation.trigger?.assignee || null,
            status: action.params?.status || 'debate',
            priority: action.params?.priority || 'media',
            track: action.params?.track || 'B',
            createdAt: now,
            updatedAt: now,
            source: 'automation',
            sourceAutomation: automation.id,
            debateOutcome: null,
            debateNotes: []
          }
          proposalsData.proposals = proposalsData.proposals || []
          proposalsData.proposals.unshift(newProposal)
          writeFileSync(proposalsFile, JSON.stringify(proposalsData, null, 2))
          result = { proposalId: newProposal.id, status: newProposal.status }
          break
        }

        case 'pm_board.create_task': {
          const pmFile = PM_BOARD_FILE
          const pmData = readJsonSafe(pmFile, { meta: {}, tasks: [] })
          const newTask = {
            id: `pm-auto-${Date.now()}`,
            title: triggerData.title || triggerData.proposalTitle || automation.name,
            description: triggerData.description || '',
            assignee: triggerData.assignee || triggerData.author || 'sam',
            status: 'todo',
            priority: triggerData.priority || 'media',
            createdDate: now,
            updatedDate: now,
            deliverableLink: '',
            notes: [`Creat automàticament per: ${automation.name}`],
            history: [{ at: now, by: 'automation', action: 'created', to: 'todo' }]
          }
          pmData.tasks = [...(pmData.tasks || []), newTask]
          savePmBoard(pmData)
          result = { taskId: newTask.id }
          break
        }

        case 'backlog.add': {
          const agentId = triggerData.assignee || triggerData.author || 'sam'
          const backlogFile = join(WORKSPACE, 'team', agentId, 'BACKLOG.md')
          if (existsSync(backlogFile)) {
            const taskText = `\n## TASCA: ${triggerData.title || triggerData.proposalTitle || automation.name}\n**Data:** ${now}\n**Source:** ${automation.id}\n${triggerData.description || ''}\n`
            const existing = readFileSync(backlogFile, 'utf-8')
            const updated = existing + taskText
            writeFileSync(backlogFile, updated, 'utf-8')
            result = { agentId, added: true }
          } else {
            result = { agentId, added: false, error: 'Backlog file not found' }
          }
          break
        }

        case 'message.send': {
          // For now, just log it — actual messaging would go through OpenClaw
          const template = action.params?.template || 'Notificació: {title}'
          const message = template
            .replace('{title}', triggerData.title || '')
            .replace('{description}', triggerData.description || '')
            .replace('{priority}', triggerData.priority || '')
            .replace('{oldStatus}', triggerData.oldStatus || '')
            .replace('{newStatus}', triggerData.newStatus || '')
            .replace('{taskTitle}', triggerData.taskTitle || '')
            .replace('{taskId}', triggerData.taskId || '')
            .replace('{assignee}', triggerData.assignee || '')
            .replace('{proposalTitle}', triggerData.proposalTitle || '')
          result = { message, sent: true, channel: action.params?.channel || 'internal' }
          break
        }

        case 'proposal.update_status': {
          const proposalsFile = join(DATA_DIR, 'proposals.json')
          const proposalsData = existsSync(proposalsFile) ? JSON.parse(readFileSync(proposalsFile, 'utf-8')) : { proposals: [] }
          const targetId = triggerData.proposalId || triggerData.id
          const idx = (proposalsData.proposals || []).findIndex(p => p.id === targetId)
          if (idx !== -1) {
            proposalsData.proposals[idx].status = action.params?.status || 'done'
            proposalsData.proposals[idx].updatedAt = now
            writeFileSync(proposalsFile, JSON.stringify(proposalsData, null, 2))
            result = { proposalId: targetId, newStatus: action.params?.status }
          } else {
            result = { error: 'Proposal not found' }
          }
          break
        }

        case 'notification.send': {
          // Log notification for now
          result = {
            notification: action.params?.message || 'Notification sent',
            channel: action.params?.channel || 'telegram',
            sent: true
          }
          break
        }

        case 'debate.set_outcome': {
          // Set debate outcome on a proposal
          const proposalsFile = join(DATA_DIR, 'proposals.json')
          const proposalsData = existsSync(proposalsFile) ? JSON.parse(readFileSync(proposalsFile, 'utf-8')) : { proposals: [] }
          const targetId = triggerData.proposalId || triggerData.id
          const idx = (proposalsData.proposals || []).findIndex(p => p.id === targetId)
          if (idx !== -1) {
            proposalsData.proposals[idx].debateOutcome = action.params?.outcome || 'approved'
            proposalsData.proposals[idx].debateNotes = triggerData.debateNotes || []
            proposalsData.proposals[idx].updatedAt = now
            writeFileSync(proposalsFile, JSON.stringify(proposalsData, null, 2))
            result = { proposalId: targetId, outcome: action.params?.outcome }
          }
          break
        }

        default:
          result = { error: `Unknown action type: ${action.type}` }
      }

      results.push({ action: action.type, success: true, result })
    } catch (err) {
      results.push({ action: action.type, success: false, error: err.message })
    }
  }

  // Update automation stats
  automation.lastTriggered = now
  automation.triggerCount = (automation.triggerCount || 0) + 1

  // Log execution
  globalData.executionLog = globalData.executionLog || []
  globalData.executionLog.push({
    automationId: automation.id,
    automationName: automation.name,
    trigger: automation.trigger?.type,
    triggerData,
    results,
    executedAt: now,
    success: results.every(r => r.success)
  })
  // Keep last 200 log entries
  if (globalData.executionLog.length > 200) {
    globalData.executionLog = globalData.executionLog.slice(-200)
  }

  return results
}

// ─── Fire automations on events ───────────────────────────────────────────────

// Hook: idea accepted (called by the ideas endpoint)
app.post('/api/internal/automations/fire', async (req, res) => {
  try {
    const { triggerType, triggerData } = req.body || {}
    if (!triggerType) return res.status(400).json({ error: 'triggerType required' })

    const data = getAutomations()
    const matching = (data.automations || []).filter(a =>
      a.enabled && a.trigger?.type === triggerType
    )

    const results = []
    for (const automation of matching) {
      const result = await executeAutomation(automation, triggerData, data)
      results.push({ automationId: automation.id, result })
    }
    saveAutomations(data)

    res.json({ fired: results.length, results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Obsidian-Format Action Logger ───────────────────────────────────────────
const LOGS_DIR = join(WORKSPACE, 'memory', 'Logs')

function logAction({ type, title, body, tags, source, metadata }) {
  try {
    const DATE = new Date()
    const dateStr = DATE.toISOString().split('T')[0]
    const timeStr = DATE.toISOString().split('T')[1].slice(0, 8)
    const id = `${dateStr}-${Date.now()}`
    const slug = (title || type || 'log')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
    const filename = `${id}-${slug}.md`
    const path = join(LOGS_DIR, filename)
    mkdirSync(LOGS_DIR, { recursive: true })
    const frontmatter = `---
id: ${id}
type: ${type || 'action'}
date: ${dateStr}
time: ${timeStr}
source: ${source || 'system'}
${tags && tags.length ? `tags: [${tags.join(', ')}]\n` : ''}---
`
    const content = `${frontmatter}# ${title || `${type} · ${source || 'System'}`}

${body || ''}
${metadata ? `\n**Metadata:**\n${Object.entries(metadata).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}\n` : ''}

---

_Logged: ${DATE.toLocaleString('ca-ES', { dateStyle: 'full', timeStyle: 'medium' })}_
`
    writeFileSync(path, content)
    return { ok: true, file: filename, id }
  } catch (err) {
    console.error('Log action error:', err)
    return { ok: false, error: err.message }
  }
}

app.post('/api/logs', (req, res) => {
  try { res.json(logAction(req.body)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/logs', (req, res) => {
  try {
    if (!existsSync(LOGS_DIR)) return res.json({ logs: [] })
    const files = readdirSync(LOGS_DIR).filter(f => f.endsWith('.md')).sort().reverse().slice(0, 50)
    const logs = files.map(f => {
      const content = readFileSync(join(LOGS_DIR, f), 'utf-8')
      const m = {}
      content.replace(/^(\w+): (.+)/m, (_, k, v) => { m[k] = v })
      return { file: f, title: content.match(/^# (.+)/m)?.[1] || f, date: m.date || f.slice(0, 10), type: m.type || 'action' }
    })
    res.json({ logs })
  } catch (err) { res.json({ logs: [], error: err.message }) }
})

app.get('/api/logs/:filename', (req, res) => {
  try {
    const safeName = req.params.filename.replace(/\.\./, '')
    const path = join(LOGS_DIR, safeName)
    if (!path.startsWith(LOGS_DIR)) return res.status(403).json({ error: 'Invalid filename' })
    if (!existsSync(path)) return res.status(404).json({ error: 'Not found' })
    res.type('text/markdown').send(readFileSync(path, 'utf-8'))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Inbox (Ideas & Notes) ────────────────────────────────────────────────────
const INBOX_DIR = join(WORKSPACE, 'memory', 'Inbox')
const INBOX_INDEX = join(WORKSPACE, 'memory', 'Inbox', 'index.json')

function inboxList() {
  try {
    if (!existsSync(INBOX_DIR)) return []
    const files = readdirSync(INBOX_DIR).filter(f => f.endsWith('.md') && f !== 'index.md')
    const items = files.map(file => {
      const path = join(INBOX_DIR, file)
      const content = readFileSync(path, 'utf-8')
      const titleMatch = content.match(/^# (.+)/m)
      const title = titleMatch ? titleMatch[1] : file.replace('.md', '')
      const dateMatch = content.match(/\*\*Created:\*\* (.+)/)
      const statusMatch = content.match(/\*\*Status:\*\* (.+)/)
      const tagsMatch = content.match(/Tags?: (.+)/)
      return {
        file,
        title,
        created: dateMatch ? dateMatch[1] : file.slice(0, 10),
        status: statusMatch ? statusMatch[1].toLowerCase() : 'new',
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : []
      }
    })
    return items.sort((a, b) => b.created.localeCompare(a.created))
  } catch { return [] }
}

function inboxSave(item) {
  const slug = (item.title || 'idea')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `${timestamp}-${slug}.md`
  const path = join(INBOX_DIR, filename)
  mkdirSync(INBOX_DIR, { recursive: true })
  const tags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
  const content = `---
source: ${item.source || 'inbox'}
createdAt: ${new Date().toISOString()}
status: new
type: ${item.type || 'idea'}
---

# ${item.title || 'Idea'}

${item.body || ''}

---

**Status:** New  
**Tags:** ${tags || 'none'}
**Source:** ${item.source || 'inbox'}

---

*Captured from ${item.source || 'inbox'} on ${new Date().toLocaleString('ca-ES', { dateStyle: 'full', timeStyle: 'short' })}*
`
  writeFileSync(path, content)
  return { ok: true, file: filename }
}

app.get('/api/inbox', (req, res) => {
  const items = inboxList()
  res.json({ items, count: items.length })
})

app.post('/api/inbox', (req, res) => {
  try {
    const { title, body, tags, source, type } = req.body
    if (!title && !body) return res.status(400).json({ error: 'title or body required' })
    const result = inboxSave({ title, body, tags, source: source || 'api', type: type || 'idea' })
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/inbox/:filename', (req, res) => {
  try {
    const { status, tags, title } = req.body
    const safeName = req.params.filename.replace(/\.\./, '')
    const path = join(INBOX_DIR, safeName)
    if (!path.startsWith(INBOX_DIR)) return res.status(403).json({ error: 'Invalid filename' })
    if (!existsSync(path)) return res.status(404).json({ error: 'Not found' })
    let content = readFileSync(path, 'utf-8')
    if (status) content = content.replace(/\*\*Status:\*\* .+/, `**Status:** ${status.charAt(0).toUpperCase() + status.slice(1)}`)
    if (tags) content = content.replace(/\*\*Tags:\*\* .+/, `**Tags:** ${tags}`)
    if (title) content = content.replace(/^# .+/m, `# ${title}`)
    writeFileSync(path, content)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/inbox/:filename', (req, res) => {
  try {
    const safeName = req.params.filename.replace(/\.\./, '')
    const path = join(INBOX_DIR, safeName)
    if (!path.startsWith(INBOX_DIR)) return res.status(403).json({ error: 'Invalid filename' })
    if (existsSync(path)) unlinkSync(path)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Somiar de Dia / de Nit ─────────────────────────────────────────────────
const SOMIAR_ENABLED_DAY = join(WORKSPACE, '.somiar-de-dia.enabled')
const SOMIAR_ENABLED_NIT = join(WORKSPACE, '.somiar-de-nit.enabled')

function getSomiarEnabled(mode) {
  const file = mode === 'dia' ? SOMIAR_ENABLED_DAY : SOMIAR_ENABLED_NIT
  return existsSync(file)
}

function setSomiarEnabled(mode, enabled) {
  const file = mode === 'dia' ? SOMIAR_ENABLED_DAY : SOMIAR_ENABLED_NIT
  if (enabled) {
    writeFileSync(file, new Date().toISOString())
  } else {
    if (existsSync(file)) unlinkSync(file)
  }
  // Also update the automations.json entry
  try {
    const data = JSON.parse(readFileSync(AUTOMATIONS_FILE, 'utf-8'))
    const id = mode === 'dia' ? 'somiar-de-dia' : 'somiar-de-nit'
    const idx = (data.automations || []).findIndex(a => a.id === id)
    if (idx !== -1) {
      data.automations[idx].enabled = enabled
      data.automations[idx].updatedAt = new Date().toISOString()
      writeFileSync(AUTOMATIONS_FILE, JSON.stringify(data, null, 2))
    }
  } catch {}
}

app.get('/api/somiar/:mode/status', (req, res) => {
  const mode = req.params.mode // 'dia' or 'nit'
  if (!['dia', 'nit'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' })
  const enabled = getSomiarEnabled(mode)
  const lastRun = (() => {
    try {
      const f = mode === 'dia'
        ? join(WORKSPACE, '.somiar-de-dia.last')
        : join(WORKSPACE, '.somiar-de-nit.last')
      return existsSync(f) ? readFileSync(f, 'utf-8').trim() : null
    } catch { return null }
  })()
  const scriptsDir = join(WORKSPACE, '.somiar-cycles')
  const cycles = existsSync(scriptsDir)
    ? readdirSync(scriptsDir).filter(f => f.includes(`somiar-de-${mode}`)).length
    : 0
  res.json({ mode, enabled, lastRun, cycles })
})

app.post('/api/somiar/:mode/toggle', (req, res) => {
  const mode = req.params.mode
  if (!['dia', 'nit'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' })
  const current = getSomiarEnabled(mode)
  setSomiarEnabled(mode, !current)
  res.json({ ok: true, enabled: !current })
})

app.post('/api/somiar/:mode/run', async (req, res) => {
  const mode = req.params.mode
  if (!['dia', 'nit'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' })
  if (!getSomiarEnabled(mode)) {
    return res.json({ ok: false, reason: 'Somiar is disabled' })
  }
  // Run the script asynchronously
  const { exec } = await import('child_process')
  const script = mode === 'dia'
    ? `${WORKSPACE}/scripts/somiar-de-dia.sh`
    : `${WORKSPACE}/scripts/somiar-de-nit.sh`
  exec(`bash ${script}`, { cwd: WORKSPACE }, (err, stdout, stderr) => {
    if (err) console.error(`Somiar ${mode} error:`, err)
    else console.log(`Somiar ${mode} output:`, stdout.slice(0, 200))
  })
  res.json({ ok: true, message: `Somiar de ${mode} triggered`, time: new Date().toISOString() })
})

// ─── Serve static React build ─────────────────────────────────────────────────

const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // Catch-all for SPA routes (excluding /api)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const PORT = globalThis.process?.env?.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Navi OS API server running on http://0.0.0.0:${PORT}`)
})
