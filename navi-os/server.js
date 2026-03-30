/**
 * Navi OS - Simple API Server
 * Serves Brain API endpoints + static React build
 */

import express from 'express'
import cors from 'cors'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const MEMORY_DIR = join(WORKSPACE, 'memory')
const SKILLS_DIR = join(WORKSPACE, 'skills')

const app = express()
app.use(cors())
app.use(express.json())

// ─── Memory Files ─────────────────────────────────────────────────────────────

app.get('/api/memory/files', (req, res) => {
  try {
    const files = []
    if (existsSync(MEMORY_DIR)) {
      const entries = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'))
      for (const f of entries) {
        const fullPath = join(MEMORY_DIR, f)
        const stat = statSync(fullPath)
        files.push({
          name: f,
          path: fullPath,
          modified: stat.mtime.toISOString(),
          size: stat.size,
          pinned: ['MEMORY.md', 'BACKLOG.md'].includes(f),
        })
      }
    }
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
    
    for (const [key, data] of Object.entries(raw)) {
      if (key.includes(':subagent:')) {
        sessions.push({
          id: key,
          label: data.label || key.split(':').pop(),
          type: 'subagent',
          status: data.status || 'unknown',
          model: data.model || 'unknown',
          runtimeMs: data.runtimeMs || 0,
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel: data.lastChannel || 'unknown',
        })
      } else if (key.includes(':cron:')) {
        const nameMatch = key.match(/cron:([^:]+)/)
        sessions.push({
          id: key,
          label: data.label || (nameMatch ? `Cron: ${nameMatch[1]}` : key),
          type: 'cron',
          status: data.status || 'unknown',
          model: data.model || 'MiniMax-M2.7',
          runtimeMs: data.runtimeMs || 0,
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel: data.lastChannel || 'system',
        })
      } else if (key.includes(':main:')) {
        sessions.push({
          id: key,
          label: 'Sessio Principal',
          type: 'main',
          status: data.status || 'unknown',
          model: data.model || 'MiniMax-M2.7',
          runtimeMs: data.runtimeMs || 0,
          totalTokens: data.totalTokens || 0,
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          channel: data.lastChannel || 'webchat',
        })
      }
    }
    
    const activeCount = sessions.filter(s => s.status === 'running').length
    res.json({ sessions, activeCount })
  } catch (err) {
    res.status(500).json({ error: err.message, sessions: [] })
  }
})

// ─── OpenClaw Cron Health ─────────────────────────────────────────────────────

app.get('/api/cron-health', (req, res) => {
  try {
    const jobs = []
    
    const schedules = {
      'repo-backup':   { label: 'Diari 02:00', interval: 86400000 },
      'overnight-audit': { label: 'Diari 03:00', interval: 86400000 },
      'daily-brief':   { label: 'Diari 08:00', interval: 86400000 },
      'daily-news':    { label: 'Diari 07:00', interval: 86400000 },
      'rolling-docs':  { label: 'Cada 6h',    interval: 21600000 },
    }
    
    const scriptsDir = join(WORKSPACE, 'scripts')
    if (existsSync(scriptsDir)) {
      const cronFiles = readdirSync(scriptsDir).filter(f => f.endsWith('.sh') && !f.startsWith('.'))
      
      for (const file of cronFiles) {
        const fullPath = join(scriptsDir, file)
        const content = readFileSync(fullPath, 'utf-8')
        const stat = statSync(fullPath)
        const name = file.replace(/^\d+-/, '').replace('.sh', '')
        const sched = schedules[name] || { label: 'Personalitzat', interval: 86400000 }
        const disabled = /^\s*#\s*DISABLED/m.test(content) || /^\s*#DISABLED/m.test(content)
        const errorMatch = content.match(/# LAST ERROR: (.+)/)
        
        // Use file mtime as last run time (cron jobs touch their scripts on execution)
        let lastRun = stat.mtime.toISOString()
        
        // Check if last run is within expected interval (with 10% tolerance)
        const now = Date.now()
        const elapsed = now - new Date(lastRun).getTime()
        const expectedInterval = sched.interval
        const isStale = elapsed > expectedInterval * 1.1
        
        let status = disabled ? 'disabled' : (isStale ? 'failed' : 'healthy')
        
        const nextRun = new Date(new Date(lastRun).getTime() + expectedInterval).toISOString()
        
        jobs.push({
          name,
          nameLabel: sched.label,
          status,
          lastRun,
          nextRun,
          error: disabled ? 'Manually disabled' : (errorMatch ? errorMatch[1] : null),
        })
      }
    }
    
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

// ─── Serve static React build ─────────────────────────────────────────────────

const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // Catch-all: serve index.html for non-API routes (Express 5 compatible)
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'))
    } else {
      next()
    }
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Navi OS API server running on http://localhost:${PORT}`)
})
