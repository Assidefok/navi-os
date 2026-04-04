/**
 * Brain API - Unified Memory & Search for Navi OS Brain module
 *
 * Endpoints:
 *   GET /api/memory/files       → list all memory/*.md files
 *   GET /api/memory/file?path=  → read a specific memory file
 *   GET /api/briefs             → list all daily-*.md briefs
 *   GET /api/chiefs             → list all chief MEMORY.md files
 *   GET /api/brain/search?q=   → keyword search across briefs, memory, chiefs
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORKSPACE = '/home/user/.openclaw/workspace'
const MEMORY_DIR = path.join(WORKSPACE, 'memory')
const TEAM_DIR = path.join(WORKSPACE, 'team')

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
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.modified).getTime() - new Date(a.modified).getTime()
    })

  return { files: entries }
}

export async function getMemoryFile(reqPath: string): Promise<{ content: string; path: string } | { error: string }> {
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

      const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^##\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : `Brief ${date}`

      const status: 'delivered' | 'pending' =
        content.includes('*Generated at') ? 'delivered' : 'pending'

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

// ─── Chiefs Memory ────────────────────────────────────────────────────────────

const CHIEFS = [
  { id: 'elom', name: 'ELOM', title: 'Chief Visionary Officer', emoji: '🚀' },
  { id: 'warren', name: 'WARREN', title: 'Chief Quality Officer', emoji: '📊' },
  { id: 'jeff', name: 'JEFF', title: 'Chief Operations Officer', emoji: '⚡' },
  { id: 'sam', name: 'SAM', title: 'Chief AI Officer', emoji: '🤖' },
]

export async function getChiefs(): Promise<{ chiefs: Chief[] }> {
  const chiefs: Chief[] = []

  for (const chief of CHIEFS) {
    const memoryPath = path.join(TEAM_DIR, chief.id, 'MEMORY.md')
    if (!fs.existsSync(memoryPath)) continue

    try {
      const content = fs.readFileSync(memoryPath, 'utf-8')
      const stat = fs.statSync(memoryPath)

      // Extract title from content
      const titleMatch = content.match(/^#\s+MEMORY\.md\s+-\s+(.+)$/m)
        || content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : chief.name

      // Extract active projects section for preview
      const projectsMatch = content.match(/## Active Projects\n([\s\S]*?)(?=\n##|$)/)
      const projectsPreview = projectsMatch
        ? projectsMatch[1].replace(/^\|.*$/gm, '').trim().substring(0, 100)
        : ''

      // Extract last updated
      const updatedMatch = content.match(/_Last updated:\s*(.+)$/m)
      const lastUpdated = updatedMatch ? updatedMatch[1].trim() : stat.mtime.toISOString()

      chiefs.push({
        id: chief.id,
        name: chief.name,
        title: chief.title,
        emoji: chief.emoji,
        memoryPath: `team/${chief.id}/MEMORY.md`,
        lastUpdated,
        status: 'active',
        preview: projectsPreview,
        modified: stat.mtime.toISOString(),
      })
    } catch {
      // skip
    }
  }

  return { chiefs }
}

// ─── Unified Search ───────────────────────────────────────────────────────────

export async function searchBrain(query: string): Promise<{ results: SearchResult[] }> {
  if (!query || query.trim().length < 2) {
    return { results: [] }
  }

  const q = query.toLowerCase().trim()
  const keywords = q.split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []

  // Helper: check if content matches any keyword
  const matches = (content: string): boolean => {
    const lower = content.toLowerCase()
    return keywords.some(kw => lower.includes(kw))
  }

  // Helper: extract snippet around first match
  const extractSnippet = (content: string, maxLen = 200): string => {
    const lower = content.toLowerCase()
    const firstKw = keywords.find(kw => lower.includes(kw))
    if (!firstKw) return content.substring(0, maxLen)

    const idx = lower.indexOf(firstKw)
    const start = Math.max(0, idx - 60)
    const end = Math.min(content.length, idx + maxLen - 60)
    let snippet = content.substring(start, end)
    if (start > 0) snippet = '…' + snippet
    if (end < content.length) snippet = snippet + '…'
    return snippet.replace(/\n+/g, ' ').trim()
  }

  // Helper: score by number of keyword matches
  const score = (content: string): number => {
    const lower = content.toLowerCase()
    return keywords.filter(kw => lower.includes(kw)).length
  }

  // 1. Search daily briefs
  if (fs.existsSync(MEMORY_DIR)) {
    const briefFiles = fs.readdirSync(MEMORY_DIR).filter(f => f.startsWith('daily-') && f.endsWith('.md'))
    for (const file of briefFiles) {
      const fullPath = path.join(MEMORY_DIR, file)
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (!matches(content)) continue

      const stat = fs.statSync(fullPath)
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/)
      const date = dateMatch ? dateMatch[1] : file.replace('daily-', '').replace('.md', '')

      results.push({
        id: file,
        type: 'brief',
        title: `Brief ${date}`,
        source: file,
        sourcePath: `memory/${file}`,
        snippet: extractSnippet(content),
        score: score(content),
        modified: stat.mtime.toISOString(),
      })
    }
  }

  // 2. Search memory files
  if (fs.existsSync(MEMORY_DIR)) {
    const memFiles = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'))
    for (const file of memFiles) {
      // Skip daily briefs (already searched)
      if (file.startsWith('daily-')) continue

      const fullPath = path.join(MEMORY_DIR, file)
      const content = fs.readFileSync(fullPath, 'utf-8')
      if (!matches(content)) continue

      const stat = fs.statSync(fullPath)
      results.push({
        id: file,
        type: 'memory',
        title: file.replace('.md', ''),
        source: file,
        sourcePath: `memory/${file}`,
        snippet: extractSnippet(content),
        score: score(content),
        modified: stat.mtime.toISOString(),
      })
    }
  }

  // 3. Search chief MEMORY.md files
  for (const chief of CHIEFS) {
    const memoryPath = path.join(TEAM_DIR, chief.id, 'MEMORY.md')
    if (!fs.existsSync(memoryPath)) continue

    const content = fs.readFileSync(memoryPath, 'utf-8')
    if (!matches(content)) continue

    const stat = fs.statSync(memoryPath)
    const titleMatch = content.match(/^#\s+MEMORY\.md\s+-\s+(.+)$/m)
      || content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : chief.name

    results.push({
      id: chief.id,
      type: 'chief',
      title: `${chief.emoji} ${chief.name} — ${chief.title}`,
      source: `team/${chief.id}/MEMORY.md`,
      sourcePath: `team/${chief.id}/MEMORY.md`,
      snippet: extractSnippet(content),
      score: score(content),
      modified: stat.mtime.toISOString(),
    })
  }

  // Sort by score desc, then modified desc
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(b.modified).getTime() - new Date(a.modified).getTime()
  })

  return { results }
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

interface Chief {
  id: string
  name: string
  title: string
  emoji: string
  memoryPath: string
  lastUpdated: string
  status: string
  preview: string
  modified: string
}

interface SearchResult {
  id: string
  type: 'brief' | 'memory' | 'chief'
  title: string
  source: string
  sourcePath: string
  snippet: string
  score: number
  modified: string
}
