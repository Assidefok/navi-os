/**
 * Navi OS - Simple API Server
 * Serves Brain API endpoints + static React build
 */

import express from 'express'
import cors from 'cors'
import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

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
    const { execSync } = require('child_process')
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
    const { execSync } = require('child_process')
    const workspace = WORKSPACE
    const out = execSync(`find "${workspace}" -name "*.tar" -o -name "*.zip" -o -name "backup*" 2>/dev/null | head -5`, { encoding: 'utf-8', timeout: 5000 }).trim()
    const files = out.split('\n').filter(Boolean)
    const gitDate = execSync(`cd "${workspace}" && git log -1 --format="%ai" 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim()
    res.json({
      lastBackup: files.length > 0 ? files[0] : null,
      lastBackupTime: gitDate || null,
      status: files.length > 0 ? 'ok' : 'warning',
      note: files.length > 0 ? `${files.length} archive(s) found` : 'No backup archive found'
    })
  } catch (err) {
    res.json({ status: 'unknown', note: 'Could not determine backup status' })
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
