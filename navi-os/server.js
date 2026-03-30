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

// ─── Cron Health ──────────────────────────────────────────────────────────────

app.get('/api/cron-health', (req, res) => {
  try {
    const scriptsDir = join(WORKSPACE, 'scripts')
    const jobs = []

    if (existsSync(scriptsDir)) {
      const cronFiles = readdirSync(scriptsDir).filter(f => f.endsWith('.sh') && !f.startsWith('.'))

      for (const file of cronFiles) {
        const fullPath = join(scriptsDir, file)
        const content = readFileSync(fullPath, 'utf-8')
        const stat = statSync(fullPath)
        // Name from filename e.g. "01-repo-backup.sh" -> "repo-backup"
        const name = file.replace(/^\d+-/, '').replace('.sh', '')
        const disabled = /^\s*#\s*DISABLED/m.test(content) || /^\s*#DISABLED/m.test(content)
        const errorMatch = content.match(/# LAST ERROR: (.+)/)

        const schedules = {
          'repo-backup': { interval: 86400000, label: 'Diari 02:00' },
          'overnight-audit': { interval: 86400000, label: 'Diari 03:00' },
          'daily-brief': { interval: 86400000, label: 'Diari 08:00' },
          'daily-news': { interval: 86400000, label: 'Diari 07:00' },
          'rolling-docs': { interval: 21600000, label: 'Cada 6h' },
        }
        const sched = schedules[name] || { interval: 86400000, label: 'Diari' }
        const nextRun = new Date(stat.mtime.getTime() + sched.interval).toISOString()

        jobs.push({
          name,
          nameLabel: sched.label,
          status: disabled ? 'disabled' : 'healthy',
          lastRun: stat.mtime.toISOString(),
          nextRun,
          error: disabled ? 'Manually disabled' : (errorMatch ? errorMatch[1] : null),
        })
      }
    }

    res.json({ jobs })
  } catch (err) {
    res.status(500).json({ error: err.message })
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
