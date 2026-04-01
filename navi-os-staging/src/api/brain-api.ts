/**
 * Brain API - Server-side file system operations for Navi OS Brain module
 *
 * These functions read directly from the filesystem.
 * Mounted as Express routes in the OpenClaw gateway or served via a local server.
 *
 * Endpoints:
 *   GET /api/memory/files       → list all memory/*.md files
 *   GET /api/memory/file?path=  → read a specific memory file
 *   GET /api/briefs             → list all daily-*.md briefs
 *   GET /api/skills             → list skills from skills/index.md
 *   GET /api/cron-health        → fetch cron job status
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const MEMORY_DIR = path.join(WORKSPACE, 'memory')
const SKILLS_DIR = path.join(WORKSPACE, 'skills')
const SKILLS_INDEX = path.join(SKILLS_DIR, 'index.md')

// ─── Memory Files ────────────────────────────────────────────────────────────

export async function getMemoryFiles(): Promise<{ files: MemoryFile[] }> {
  const files: MemoryFile[] = []

  if (!fs.existsSync(MEMORY_DIR)) {
    return { files }
  }

  const entries = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fullPath = path.join(MEMORY_DIR, f)
      const stat = fs.statSync(fullPath)
      return {
        name: f,
        path: fullPath,
        modified: stat.mtime.toISOString(),
        size: stat.size,
        pinned: ['MEMORY.md', 'BACKLOG.md'].includes(f),
      } as MemoryFile
    })
    .sort((a, b) => {
      // Pinned files first, then by date descending
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.modified).getTime() - new Date(a.modified).getTime()
    })

  return { files: entries }
}

export async function getMemoryFile(reqPath: string): Promise<{ content: string; path: string } | { error: string }> {
  // Sanitize: only allow relative paths inside memory dir
  const relativePath = reqPath.replace(/^\/+/, '')
  const fullPath = path.resolve(MEMORY_DIR, relativePath)

  if (!fullPath.startsWith(MEMORY_DIR)) {
    return { error: 'Invalid path: outside memory directory' }
  }

  if (!fs.existsSync(fullPath)) {
    return { error: 'File not found' }
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8')
    return { content, path: fullPath }
  } catch {
    return { error: 'Failed to read file' }
  }
}

// ─── Daily Briefs ─────────────────────────────────────────────────────────────

export async function getBriefs(): Promise<{ briefs: Brief[] }> {
  const briefs: Brief[] = []

  if (!fs.existsSync(MEMORY_DIR)) {
    return { briefs }
  }

  const entries = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.startsWith('daily-') && f.endsWith('.md'))
    .map(f => {
      const fullPath = path.join(MEMORY_DIR, f)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const stat = fs.statSync(fullPath)
      const dateMatch = f.match(/(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : f.replace('daily-', '').replace('.md', '')

      // Extract title from first H2 or first line
      const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : `Brief ${date}`

      // Determine status from content
      const status: 'delivered' | 'pending' =
        content.includes('*Generated at') ? 'delivered' : 'pending'

      // Preview: first non-empty line after first heading
      const lines = content.split('\n').filter(l => l.trim())
      const preview = lines.length > 2 ? lines.slice(1, 3).join(' | ').substring(0, 120) : ''

      return {
        id: f,
        date,
        title,
        status,
        preview,
        modified: stat.mtime.toISOString(),
      } as Brief
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return { briefs: entries }
}

// ─── Skills Directory ─────────────────────────────────────────────────────────

export async function getSkills(): Promise<{ skills: SkillEntry[] }> {
  const skills: SkillEntry[] = []

  if (!fs.existsSync(SKILLS_INDEX)) {
    return { skills }
  }

  const content = fs.readFileSync(SKILLS_INDEX, 'utf-8')
  const lines = content.split('\n')

  // Parse markdown table rows
  let section = 'built-in'
  for (const line of lines) {
    if (line.includes('## Custom Skills')) {
      section = 'custom'
      continue
    }
    if (line.startsWith('|') && !line.includes('---') && line.includes('|')) {
      const cols = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cols.length >= 4 && cols[0] !== 'Name') {
        const [name, owner, status, category, lastUpdated] = cols
        skills.push({
          name,
          owner,
          status: status as 'active' | 'deprecated',
          category,
          lastUpdated,
          source: section as 'built-in' | 'custom',
        })
      }
    }
  }

  return { skills }
}

// ─── Cron Health ──────────────────────────────────────────────────────────────

export async function getCronHealth(): Promise<{ jobs: CronJob[] }> {
  // Read cron status from workspace scripts
  const scriptsDir = path.join(WORKSPACE, 'scripts')
  const jobs: CronJob[] = []

  if (!fs.existsSync(scriptsDir)) {
    return { jobs }
  }

  const cronFiles = fs.readdirSync(scriptsDir)
    .filter(f => f.startsWith('cron-') && f.endsWith('.sh'))

  for (const file of cronFiles) {
    const fullPath = path.join(scriptsDir, file)
    const stat = fs.statSync(fullPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const name = file.replace('cron-', '').replace('.sh', '')

    // Determine status from last lines
    const lines = content.split('\n')
    const lastLine = lines[lines.length - 1] || ''
    const disabled = content.includes('# DISABLED') || content.includes('exit 0')
    const errorMatch = content.match(/# LAST ERROR: (.+)/)

    jobs.push({
      name,
      status: disabled ? 'disabled' : 'healthy',
      lastRun: stat.mtime.toISOString(),
      nextRun: estimateNextRun(name, stat.mtime),
      error: disabled ? 'Manually disabled' : (errorMatch ? errorMatch[1] : null),
    })
  }

  return { jobs }
}

function estimateNextRun(name: string, lastRun: Date): string {
  // Rough estimates based on typical cron schedules
  const schedules: Record<string, number> = {
    daily: 24 * 60 * 60 * 1000,
    backup: 24 * 60 * 60 * 1000,
    audit: 24 * 60 * 60 * 1000,
    rolling: 6 * 60 * 60 * 1000,
  }
  const interval = schedules[name] || 24 * 60 * 60 * 1000
  const next = new Date(lastRun.getTime() + interval)
  return next.toISOString()
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryFile {
  name: string
  path: string
  modified: string
  size: number
  pinned: boolean
}

interface Brief {
  id: string
  date: string
  title: string
  status: 'delivered' | 'pending'
  preview: string
  modified: string
}

interface SkillEntry {
  name: string
  owner: string
  status: 'active' | 'deprecated'
  category: string
  lastUpdated: string
  source: 'built-in' | 'custom'
}

interface CronJob {
  name: string
  status: 'healthy' | 'failed' | 'disabled'
  lastRun: string
  nextRun: string
  error: string | null
}
