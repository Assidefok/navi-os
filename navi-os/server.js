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
          sessionFile: data.sessionFile || null,
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
          sessionFile: data.sessionFile || null,
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
          sessionFile: data.sessionFile || null,
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
    const out = execSync('openclaw security-audit 2>/dev/null | head -30', { encoding: 'utf-8', timeout: 8000 })
    const lines = out.split('\n')
    const result = { critical: 0, warn: 0, info: 0, issues: [] }

    for (const line of lines) {
      const lower = line.toLowerCase()
      if (lower.includes('critical')) result.critical += 1
      else if (lower.includes('warn')) result.warn += 1
      else if (lower.includes('info')) result.info += 1
    }

    res.json(result)
  } catch {
    res.json({ critical: 0, warn: 0, info: 0, issues: [] })
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
    
    const newProposal = {
      id: `prop-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'pending'
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
    
    data.proposals[idx] = { ...data.proposals[idx], ...req.body, updatedAt: new Date().toISOString() }
    writeFileSync(dataFile, JSON.stringify(data, null, 2))
    res.json(data.proposals[idx])
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

const PORT = globalThis.process?.env?.PORT || 3001
app.listen(PORT, () => {
  console.log(`Navi OS API server running on http://localhost:${PORT}`)
})
