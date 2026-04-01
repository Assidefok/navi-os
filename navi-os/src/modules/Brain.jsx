import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Brain as BrainIcon, FolderOpen, FileText, Clock, Search, BookOpen,
  ChevronRight, ChevronDown, Pin, X, CheckCircle2,
  AlertCircle, MinusCircle, RefreshCw, Users, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Play, Loader2, Zap, Globe, Lock, Eye, MessageSquare, Sparkles, Hash, Tag, FileSearch,
  BarChart3, Calendar, HardDrive, Star, ArrowLeft, SlidersHorizontal, PanelLeftClose, PanelLeft,
  AlignLeft, List, ChevronUp
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import FeatureCard from '../components/ui/FeatureCard'
import TeamOverview from '../components/TeamOverview'
import MissionControl from './MissionControl'
import './Brain.css'

const API_BASE = '/api'

// ─── Markdown Renderer ─────────────────────────────────────────────────────────

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text, options = {}) {
  if (!text) return <p className="empty-markdown">No content</p>
  try {
    const html = marked.parse(text)
    const sanitized = DOMPurify.sanitize(html)
    return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: sanitized }} />
  } catch { return <p>{text}</p> }
}

// ─── Security Badge ────────────────────────────────────────────────────────────

function SecurityBadge({ level }) {
  const config = {
    safe: { icon: ShieldCheck, color: '#30d158', label: 'Segura' },
    medium: { icon: ShieldAlert, color: '#ffb800', label: 'Mig segura' },
    unverified: { icon: Shield, color: '#ff9f0a', label: 'No verificada' },
    unsafe: { icon: ShieldX, color: '#ff453a', label: 'No segura' },
  }
  const c = config[level] || config.unverified
  const Icon = c.icon
  return (
    <span className="security-badge" style={{ color: c.color, background: `${c.color}20` }} title={c.label}>
      <Icon size={12} />
      {c.label}
    </span>
  )
}

// ─── Fuzzy Search ──────────────────────────────────────────────────────────────

function fuzzyScore(query, target) {
  if (!query) return { score: 0, matches: [] }
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  const matches = []

  if (t.includes(q)) {
    const idx = t.indexOf(q)
    matches.push({ start: idx, end: idx + q.length })
    return { score: 100 + (q.length / t.length) * 50, matches }
  }

  let score = 0
  let qIdx = 0
  let lastMatchIdx = -1
  let consecutive = 0

  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      matches.push({ start: i, end: i + 1 })
      const dist = lastMatchIdx >= 0 ? i - lastMatchIdx : 0
      score += 10 - dist
      if (dist === 1) consecutive++
      lastMatchIdx = i
      qIdx++
    }
  }

  if (qIdx < q.length) return { score: 0, matches: [] }
  score += consecutive * 5
  return { score: Math.min(score, 90), matches }
}

function highlightText(text, matches) {
  if (!matches || matches.length === 0 || !text) return text
  const result = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.start > lastEnd) result.push(text.slice(lastEnd, m.start))
    result.push(<mark key={m.start} className="search-highlight">{text.slice(m.start, m.end)}</mark>)
    lastEnd = m.end
  }
  if (lastEnd < text.length) result.push(text.slice(lastEnd))
  return result
}

// ─── Extract Headers from Markdown ────────────────────────────────────────────

function extractHeaders(content) {
  if (!content) return []
  const lines = content.split('\n')
  const headers = []
  const slugMap = {}

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)

    if (h1) {
      const text = h1[1].trim()
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
      headers.push({ level: 1, text, id })
    } else if (h2) {
      const text = h2[1].trim()
      let id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
      if (slugMap[id]) { slugMap[id]++; id = `${id}-${slugMap[id]}` } else { slugMap[id] = 1 }
      headers.push({ level: 2, text, id })
    } else if (h3) {
      const text = h3[1].trim()
      let id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
      if (slugMap[id]) { slugMap[id]++; id = `${id}-${slugMap[id]}` } else { slugMap[id] = 1 }
      headers.push({ level: 3, text, id })
    }
  }

  return headers
}

function extractTags(content) {
  const tagRegex = /#([a-zA-Z][a-zA-Z0-9_-]*)/g
  const tags = new Set()
  let match
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase()
    if (!['todo', 'note', 'info', 'warning', 'error'].includes(tag)) {
      tags.add(tag)
    }
  }
  return Array.from(tags).slice(0, 20)
}

// ─── Memory Explorer ──────────────────────────────────────────────────────────

function MemoryExplorer({ onClose }) {
  const [files, setFiles] = useState([])
  const [fileContents, setFileContents] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentFiles, setRecentFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [stats, setStats] = useState({ count: 0, size: 0, oldest: null, newest: null })
  const [showIndex, setShowIndex] = useState(true)
  const [expandedFiles, setExpandedFiles] = useState({}) // fileName -> boolean
  const [selectedHeader, setSelectedHeader] = useState(null)
  const [allTags, setAllTags] = useState([])
  const [filterTag, setFilterTag] = useState(null)
  const [sortBy, setSortBy] = useState('modified')
  const searchInputRef = useRef(null)
  const previewRef = useRef(null)
  const headerRefs = useRef({})

  // Load file list
  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/memory/files`)
      const data = await res.json()
      const fileList = data.files || []
      setFiles(fileList)

      const totalSize = fileList.reduce((a, f) => a + (f.size || 0), 0)
      const dates = fileList.map(f => new Date(f.modified)).filter(d => !isNaN(d)).sort((a, b) => a - b)
      setStats({
        count: fileList.length,
        size: totalSize,
        oldest: dates[0] || null,
        newest: dates[dates.length - 1] || null,
      })

      const tagSet = new Set()
      fileList.forEach(f => {
        const tagMatch = f.name.match(/^#?(.+?)\.md$/i)
        if (tagMatch) {
          const potential = tagMatch[1].replace(/[_-]/g, ' ').toLowerCase()
          if (potential.length > 2 && !['memory', 'daily', 'backlog', 'notes'].includes(potential)) {
            tagSet.add(potential)
          }
        }
      })
      setAllTags(Array.from(tagSet).sort())

      try {
        const recent = JSON.parse(localStorage.getItem('navi-recent-files') || '[]')
        setRecentFiles(recent.filter(r => fileList.some(f => f.name === r.name)).slice(0, 5))
      } catch { setRecentFiles([]) }
    } catch { setFiles([]) }
    setLoading(false)
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => loadFiles())
  }, [loadFiles])

  // Load content for selected file
  const selectFile = useCallback(async (file) => {
    setSelectedFile(file)
    setSelectedHeader(null)

    if (file && !fileContents[file.name]) {
      setLoadingContent(true)
      try {
        const res = await fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(file.name)}`)
        const data = await res.json()
        setFileContents(prev => ({ ...prev, [file.name]: data.content || '' }))
      } catch { setFileContents(prev => ({ ...prev, [file.name]: '' })) }
      setLoadingContent(false)
    }

    if (file) {
      setExpandedFiles(prev => ({ ...prev, [file.name]: true }))
      try {
        const recent = JSON.parse(localStorage.getItem('navi-recent-files') || '[]')
        const updated = [{ name: file.name, modified: file.modified, at: Date.now() }]
          .concat(recent.filter(r => r.name !== file.name))
          .slice(0, 8)
        localStorage.setItem('navi-recent-files', JSON.stringify(updated))
        setRecentFiles(updated.slice(0, 5))
      } catch {}
    }
  }, [fileContents])

  // Toggle file expand in index
  const toggleExpand = (fileName) => {
    setExpandedFiles(prev => ({ ...prev, [fileName]: !prev[fileName] }))
  }

  // Navigate to header in preview
  const scrollToHeader = (header) => {
    setSelectedHeader(header)
    if (headerRefs.current[header.id]) {
      headerRefs.current[header.id].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // When content loads, rebuild header refs map
  useEffect(() => {
    if (!selectedFile || !fileContents[selectedFile.name]) return
    const content = fileContents[selectedFile.name]
    const headers = extractHeaders(content)

    // Assign ref callbacks
    requestAnimationFrame(() => {
      headers.forEach(h => {
        const el = document.getElementById(h.id)
        if (el) headerRefs.current[h.id] = el
      })
    })
  }, [selectedFile, fileContents])

  // Group files by category
  const groupedFiles = useMemo(() => {
    let list = files
    if (filterTag) {
      list = list.filter(f => f.name.toLowerCase().includes(filterTag.toLowerCase()))
    }

    const pinned = list.filter(f => f.pinned)
    const daily = list.filter(f => f.name.startsWith('daily-'))
    const others = list.filter(f => !f.pinned && !f.name.startsWith('daily-'))

    const sort = (arr) => {
      if (sortBy === 'name') return [...arr].sort((a, b) => a.name.localeCompare(b.name))
      if (sortBy === 'size') return [...arr].sort((a, b) => (b.size || 0) - (a.size || 0))
      return [...arr].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.modified).getTime() - new Date(a.modified).getTime()
      })
    }

    return {
      pinned: sort(pinned),
      daily: sort(daily),
      others: sort(others),
    }
  }, [files, filterTag, sortBy])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.trim()
    const results = []

    for (const file of files) {
      const nameScore = fuzzyScore(q, file.name)
      const content = fileContents[file.name] || ''
      const contentScore = content ? fuzzyScore(q, content) : { score: 0, matches: [] }
      const totalScore = nameScore.score * 2 + contentScore.score

      if (totalScore > 0) {
        results.push({
          file,
          nameScore,
          contentScore,
          totalScore,
          snippet: content ? extractSnippet(content, q) : file.name,
          matchedInContent: contentScore.score > 0,
          matchedInName: nameScore.score > 0,
        })
      }
    }

    return results.sort((a, b) => b.totalScore - a.totalScore)
  }, [searchQuery, files, fileContents])

  function extractSnippet(content, query, maxLen = 160) {
    if (!content) return ''
    const lower = content.toLowerCase()
    const idx = lower.indexOf(query.toLowerCase())
    if (idx < 0) return content.slice(0, maxLen)
    const start = Math.max(0, idx - 50)
    const end = Math.min(content.length, idx + query.length + 110)
    let snippet = content.slice(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    return snippet
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('ca-ES', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return iso }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const content = selectedFile ? (fileContents[selectedFile.name] || '') : ''
  const contentHeaders = useMemo(() => {
    if (!content) return []
    return extractHeaders(content)
  }, [content])

  const selectedTags = useMemo(() => {
    if (!selectedFile || !fileContents[selectedFile.name]) return []
    return extractTags(fileContents[selectedFile.name])
  }, [selectedFile, fileContents])

  // ─── Render Index Item ───────────────────────────────────────────────────

  function renderIndexItem(file, depth = 0) {
    const isExpanded = expandedFiles[file.name]
    const hasContent = fileContents[file.name]
    const headers = hasContent ? extractHeaders(fileContents[file.name]) : []
    const isActive = selectedFile?.name === file.name

    return (
      <div key={file.name} className="index-file-node">
        <div
          className={`index-file-row ${isActive ? 'active' : ''} ${depth > 0 ? 'indented' : ''}`}
          onClick={() => selectFile(file)}
        >
          {headers.length > 0 ? (
            <button
              className="expand-btn"
              onClick={(e) => { e.stopPropagation(); toggleExpand(file.name) }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <span className="expand-placeholder" />
          )}

          {file.pinned ? <Pin size={11} className="pin-icon" /> : <FileText size={11} />}
          <span className="index-file-name">{file.name}</span>
          {file.name.startsWith('daily-') && (
            <span className="index-file-badge">daily</span>
          )}
        </div>

        {isExpanded && headers.length > 0 && (
          <div className="index-headers">
            {headers.map((header, i) => (
              <button
                key={i}
                className={`index-header-row level-${header.level} ${selectedHeader?.id === header.id ? 'active' : ''}`}
                onClick={() => scrollToHeader(header)}
                title={header.text}
              >
                <AlignLeft size={10} className="header-icon" />
                <span className="header-text">{header.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="memory-explorer">
      {/* ── Index Sidebar ── */}
      {showIndex && (
        <div className="explorer-index">
          <div className="index-header">
            <div className="index-title">
              <List size={13} />
              <span>Index</span>
              <span className="index-count">{files.length}</span>
            </div>
            <button className="icon-btn" onClick={loadFiles} title="Refresh">
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Filter / sort controls */}
          <div className="index-controls">
            {allTags.length > 0 && (
              <div className="index-tag-filter">
                {allTags.slice(0, 6).map(tag => (
                  <button
                    key={tag}
                    className={`index-tag-btn ${filterTag === tag ? 'active' : ''}`}
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            <div className="index-sort-btns">
              <button className={`idx-sort ${sortBy === 'modified' ? 'active' : ''}`} onClick={() => setSortBy('modified')}>Recent</button>
              <button className={`idx-sort ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>A-Z</button>
            </div>
          </div>

          {/* Recent files */}
          {recentFiles.length > 0 && !searchQuery && !filterTag && (
            <div className="index-section">
              <div className="index-section-label">
                <Star size={10} /> Recents
              </div>
              {recentFiles.map(r => {
                const f = files.find(x => x.name === r.name) || r
                return (
                  <div
                    key={r.name}
                    className={`index-recent-row ${selectedFile?.name === r.name ? 'active' : ''}`}
                    onClick={() => selectFile(f)}
                  >
                    <span className="recent-dot" />
                    <span className="index-file-name">{r.name}</span>
                    <span className="recent-time">{formatDate(r.modified)}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* File tree */}
          <div className="index-tree">
            {loading ? (
              <div className="index-loading">
                <Loader2 size={16} className="spin" />
              </div>
            ) : searchQuery && searchResults ? (
              <div className="index-search-results">
                <div className="index-section-label">
                  <Search size={10} /> {searchResults.length} resultats
                </div>
                {searchResults.map(({ file, totalScore, snippet }) => (
                  <div
                    key={file.name}
                    className={`index-file-row ${selectedFile?.name === file.name ? 'active' : ''}`}
                    onClick={() => selectFile(file)}
                  >
                    <span className="expand-placeholder" />
                    <FileText size={11} />
                    <div className="index-file-content">
                      <span className="index-file-name">
                        {highlightText(file.name, fuzzyScore(searchQuery, file.name).matches)}
                      </span>
                      <span className="index-result-snippet">
                        {highlightText(snippet, fuzzyScore(searchQuery, snippet).matches)}
                      </span>
                    </div>
                    <span className="result-score">{Math.round(totalScore)}</span>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <div className="index-empty">Cap resultat per "{searchQuery}"</div>
                )}
              </div>
            ) : (
              <>
                {groupedFiles.pinned.length > 0 && (
                  <div className="index-section">
                    <div className="index-section-label">
                      <Pin size={10} /> Pinned
                    </div>
                    {groupedFiles.pinned.map(f => renderIndexItem(f))}
                  </div>
                )}
                {groupedFiles.daily.length > 0 && (
                  <div className="index-section">
                    <div className="index-section-label">
                      <Calendar size={10} /> Daily Notes
                    </div>
                    {groupedFiles.daily.map(f => renderIndexItem(f))}
                  </div>
                )}
                {groupedFiles.others.length > 0 && (
                  <div className="index-section">
                    <div className="index-section-label">
                      <FolderOpen size={10} /> Altres
                    </div>
                    {groupedFiles.others.map(f => renderIndexItem(f))}
                  </div>
                )}
                {files.length === 0 && (
                  <div className="index-empty">Cap fitxer de memòria</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      <button
        className="index-toggle-btn"
        onClick={() => setShowIndex(v => !v)}
        title={showIndex ? 'Amaga index' : 'Mostra index'}
      >
        {showIndex ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
      </button>

      {/* ── Preview Panel ── */}
      <div className="explorer-preview">
        {/* Preview top bar */}
        <div className="explorer-preview-topbar">
          <div className="preview-topbar-left">
            {!showIndex && (
              <button className="icon-btn" onClick={() => setShowIndex(true)} title="Mostra index">
                <PanelLeft size={14} />
              </button>
            )}
            {selectedFile ? (
              <div className="preview-breadcrumb">
                {selectedFile.pinned && <Pin size={12} className="pin-icon" />}
                <span className="breadcrumb-filename">{selectedFile.name}</span>
                <span className="breadcrumb-meta">{formatDate(selectedFile.modified)} · {formatSize(selectedFile.size)}</span>
              </div>
            ) : (
              <span className="preview-placeholder-text">Selecciona un fitxer</span>
            )}
          </div>

          {/* Search */}
          <div className="explorer-search-wrap inline">
            <Search size={13} className="search-icon" />
            <input
              ref={searchInputRef}
              className="explorer-search small"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Header outline (sticky, right side of preview) */}
        {selectedFile && contentHeaders.length > 0 && (
          <div className="preview-outline">
            <div className="outline-label">
              <AlignLeft size={11} /> Contingut
            </div>
            {contentHeaders.map((header, i) => (
              <button
                key={i}
                className={`outline-item level-${header.level} ${selectedHeader?.id === header.id ? 'active' : ''}`}
                onClick={() => scrollToHeader(header)}
                title={header.text}
              >
                {header.text}
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="explorer-content-area" ref={previewRef}>
          {selectedFile ? (
            <>
              {/* File header */}
              <div className="preview-file-header">
                <div className="preview-tags-row">
                  {selectedTags.map(tag => (
                    <span key={tag} className="preview-tag-chip">
                      <Hash size={10} />{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Markdown content */}
              <div className="preview-content markdown-content">
                {loadingContent && !content ? (
                  <div className="explorer-loading">
                    <Loader2 size={24} className="spin" />
                    <span>Carregant...</span>
                  </div>
                ) : (
                  renderMarkdown(content)
                )}
              </div>
            </>
          ) : (
            <div className="empty-preview">
              <div className="empty-preview-icon">
                <FileText size={48} />
              </div>
              <h3>Memory Explorer</h3>
              <p>Selecciona un fitxer de l'index per veure'n el contingut</p>
              <div className="quick-tips">
                <span className="tip"><kbd>#tag</kbd> Filtra per tag</span>
                <span className="tip"><kbd>/</kbd> Cerca</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Alias for backward compat
const MemoryViewer = MemoryExplorer

// ─── Section: Morning Briefs Archive ──────────────────────────────────────────

function MorningBriefsSection() {
  const [briefs, setBriefs] = useState([])
  const [selectedBrief, setSelectedBrief] = useState(null)
  const [briefContent, setBriefContent] = useState('')
  const [briefModal, setBriefModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/briefs`)
      .then(r => r.json())
      .then(d => { setBriefs(d.briefs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const openBrief = async (brief) => {
    setSelectedBrief(brief)
    try {
      const res = await fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(brief.id)}`)
      const data = await res.json()
      setBriefContent(data.content || '')
    } catch { setBriefContent('# Error\nCould not load brief.') }
    setBriefModal(true)
  }

  const stats = {
    delivered: briefs.filter(b => b.status === 'delivered').length,
    pending: briefs.filter(b => b.status === 'pending').length,
    total: briefs.length,
  }

  return (
    <div className="briefs-section">
      <div className="section-stats">
        <span className="stat"><CheckCircle2 size={14} className="green" /> {stats.delivered} delivered</span>
        <span className="stat"><AlertCircle size={14} className="amber" /> {stats.pending} pending</span>
        <span className="stat"><FileText size={14} /> {stats.total} total</span>
      </div>
      <div className="briefs-list">
        {briefs.map(brief => (
          <div key={brief.id} className="brief-card" onClick={() => openBrief(brief)}>
            <div className="brief-card-header">
              <span className="brief-date">{brief.date}</span>
              <span className={`status-badge ${brief.status}`}>{brief.status === 'delivered' ? 'Delivered' : 'Pending'}</span>
            </div>
            <h4 className="brief-title">{brief.title}</h4>
            {brief.preview && <p className="brief-preview">{brief.preview}...</p>}
          </div>
        ))}
        {briefs.length === 0 && !loading && <div className="empty-state">No daily briefs found</div>}
      </div>
      <Modal isOpen={briefModal} onClose={() => setBriefModal(false)} title={selectedBrief?.title} width="65%" height="75%">
        <div className="brief-content markdown-content">{renderMarkdown(briefContent)}</div>
      </Modal>
    </div>
  )
}

// ─── Section: Skills Directory ────────────────────────────────────────────────

function SkillDetailModal({ skill, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(skill.enabled !== false)

  useEffect(() => {
    fetch(`${API_BASE}/skill-content?name=${encodeURIComponent(skill.name)}`)
      .then(r => r.ok ? r.text() : '')
      .then(t => { setContent(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [skill.name])

  const handleToggle = () => {
    const newVal = !enabled
    setEnabled(newVal)
    fetch('/api/skill-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: skill.name, enabled: newVal })
    }).catch(() => {})
  }

  const getSecurityLevel = () => {
    if (skill.trusted) return 'safe'
    if (skill.source === 'built-in') return 'medium'
    if (skill.source === 'clawhub') return 'unverified'
    return 'unsafe'
  }

  return (
    <div className="skill-modal-backdrop" onClick={onClose}>
      <div className="skill-modal" onClick={e => e.stopPropagation()}>
        <div className="skill-modal-header">
          <div className="skill-modal-title">
            <BookOpen size={20} className={skill.source === 'custom' ? 'green' : 'sky'} />
            <span>{skill.name}</span>
          </div>
          <button className="skill-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="skill-modal-meta">
          <SecurityBadge level={getSecurityLevel()} />
          {skill.updateAvailable && (
            <span className="update-badge"><RefreshCw size={11} /> Update available</span>
          )}
          <span className="skill-source-tag">{skill.source || 'unknown'}</span>
          <span className="skill-category-tag">{skill.category || '—'}</span>
        </div>
        <div className="skill-toggle-row">
          <span className="toggle-label">{enabled ? 'Habilitada' : 'Deshabilitada'}</span>
          <button
            className={`skill-toggle-btn ${enabled ? 'active' : ''}`}
            onClick={handleToggle}
            role="switch"
            aria-checked={enabled}
          >
            <span className="toggle-knob" />
          </button>
        </div>
        <div className="skill-modal-body">
          {loading ? (
            <div className="skill-loading"><Loader2 size={20} className="spin" /> Carregant descripcio...</div>
          ) : content ? (
            <div className="skill-content markdown-body">
              {(() => {
                try {
                  const html = marked.parse(content)
                  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
                } catch { return <pre>{content}</pre> }
              })()}
            </div>
          ) : (
            <div className="skill-no-content">
              <FileText size={32} style={{ opacity: 0.3 }} />
              <p>No s'ha trobat descripcio per a aquest skill</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SkillsDirectory() {
  const [skills, setSkills] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/skills`)
      .then(r => r.json())
      .then(d => { setSkills(d.skills || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getSecurityLevel = (skill) => {
    if (skill.trusted) return 'safe'
    if (skill.source === 'built-in') return 'medium'
    if (skill.source === 'clawhub') return 'unverified'
    return 'unsafe'
  }

  const filtered = tab === 'all' ? skills : skills.filter(s => s.source === tab)

  return (
    <div className="skills-directory">
      <div className="tab-bar">
        {['all', 'built-in', 'custom'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="tab-count">{t === 'all' ? skills.length : skills.filter(s => s.source === t).length}</span>
          </button>
        ))}
      </div>
      <div className="skills-grid">
        {filtered.map(skill => (
          <div
            key={skill.name}
            className="skill-card clickable"
            onClick={() => setSelectedSkill(skill)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setSelectedSkill(skill)}
          >
            <div className="skill-header">
              <BookOpen size={16} className={skill.source === 'custom' ? 'green' : 'sky'} />
              <span className="skill-name">{skill.name}</span>
              <SecurityBadge level={getSecurityLevel(skill)} />
            </div>
            <div className="skill-meta">
              <span>{skill.category || '—'}</span>
              <span>{skill.source || 'unknown'}</span>
            </div>
            {skill.updateAvailable && (
              <div className="skill-update-indicator">
                <RefreshCw size={11} /> Update available
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="empty-state">No skills found for this filter</div>
        )}
      </div>
      {selectedSkill && (
        <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  )
}

// ─── Section: Cron Health Dashboard ──────────────────────────────────────────

function CronDetailModal({ job, onClose }) {
  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('ca-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  const getStatusMeta = () => {
    if (job.status === 'healthy') return { label: 'Correcte', className: 'healthy', icon: <span className="status-plus ok">+</span>, help: "S'ha executat correctament" }
    if (job.status === 'failed') return { label: 'Amb errors', className: 'failed', icon: <span className="status-plus error">+</span>, help: "L'última execució ha fallat" }
    if (!job.lastRun) return { label: 'Pendent', className: 'idle', icon: <span className="status-plus pending">+</span>, help: "Encara no s'ha executat mai" }
    return { label: 'Inactiu', className: 'idle', icon: <span className="status-plus idle">+</span>, help: 'Sense informació recent' }
  }

  const status = getStatusMeta()

  return (
    <div className="cron-modal-backdrop" onClick={onClose}>
      <div className="cron-modal" onClick={e => e.stopPropagation()}>
        <div className="cron-modal-header">
          <div className="cron-modal-title">
            {status.icon}
            <span>{job.name}</span>
          </div>
          <button className="cron-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="cron-modal-body">
          <div className="cron-info-grid">
            <div className="cron-info-row"><span className="info-label">Estat</span><span className={`cron-status-label ${status.className}`}>{status.label}</span></div>
            <div className="cron-info-row"><span className="info-label">Resum</span><span className="info-value">{status.help}</span></div>
            <div className="cron-info-row"><span className="info-label">Freqüència</span><span className="info-value">{job.nameLabel || job.schedule || '—'}</span></div>
            <div className="cron-info-row"><span className="info-label">Última execució</span><span className="info-value">{formatDate(job.lastRun)}</span></div>
            <div className="cron-info-row"><span className="info-label">Proper executució</span><span className="info-value">{formatDate(job.nextRun)}</span></div>
            {job.error && <div className="cron-info-row error"><span className="info-label">Error</span><span className="info-value error">{job.error}</span></div>}
          </div>
          <div className="force-result error" style={{ marginTop: 12 }}>
            <AlertCircle size={14} />
            L'execució manual encara no està disponible des d'aquesta interfície.
          </div>
        </div>
      </div>
    </div>
  )
}

function CronHealthDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cron-health`)
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch { setJobs([]) }
    setLoading(false)
  }, [])

  useEffect(() => { Promise.resolve().then(() => load()) }, [load])

  const stats = {
    healthy: jobs.filter(j => j.status === 'healthy').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    neverRun: jobs.filter(j => j.status !== 'healthy' && j.status !== 'failed' && !j.lastRun).length,
    disabled: jobs.filter(j => j.status === 'disabled').length,
    total: jobs.length,
  }

  const statusIndicator = (job) => {
    if (job.status === 'healthy') return <span className="status-plus ok" title="Executat correctament">+</span>
    if (job.status === 'failed') return <span className="status-plus error" title="Error">+</span>
    if (!job.lastRun) return <span className="status-plus pending" title="Mai executat">+</span>
    return <span className="status-plus idle" title="Inactiu">+</span>
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
  }

  return (
    <div className="cron-dashboard">
      <div className="section-stats">
        <span className="stat"><CheckCircle2 size={14} className="green" /> {stats.healthy} healthy</span>
        <span className="stat"><AlertCircle size={14} className="red" /> {stats.failed} failed</span>
        <span className="stat"><MinusCircle size={14} className="amber" /> {stats.neverRun} pendent</span>
        <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
      </div>
      <div className="cron-jobs-list">
        {jobs.map(job => (
          <div key={job.name} className={`cron-job-card ${job.status}`} onClick={() => setSelectedJob(job)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSelectedJob(job)}>
            <div className="cron-job-header">
              {statusIndicator(job)}
              <span className="cron-job-name">{job.name}</span>
              <span className={`cron-status-label ${job.status}`}>{job.status}</span>
            </div>
            <div className="cron-job-meta">
              <div className="meta-row"><span className="meta-label">Last run:</span><span className="meta-value">{formatDate(job.lastRun)}</span></div>
              <div className="meta-row"><span className="meta-label">Next run:</span><span className="meta-value">{formatDate(job.nextRun)}</span></div>
              {job.error && <div className="meta-row error"><span className="meta-label">Error:</span><span className="meta-value">{job.error}</span></div>}
            </div>
          </div>
        ))}
        {jobs.length === 0 && !loading && <div className="empty-state">No cron jobs found in /workspace/scripts</div>}
      </div>
      {selectedJob && <CronDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}

// ─── Brain Command Center ─────────────────────────────────────────────────────

function BrainCommandCenter({ onNavigate }) {
  const [briefs, setBriefs] = useState([])
  const [memoryFiles, setMemoryFiles] = useState([])
  const [skills, setSkills] = useState([])
  const [cronJobs, setCronJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/briefs').then(r => r.json()).catch(() => ({ briefs: [] })),
      fetch('/api/memory/files').then(r => r.json()).catch(() => ({ files: [] })),
      fetch('/api/skills').then(r => r.json()).catch(() => ({ skills: [] })),
      fetch('/api/cron-health').then(r => r.json()).catch(() => ({ jobs: [] })),
    ]).then(([b, m, s, c]) => {
      setBriefs(b.briefs || [])
      setMemoryFiles(m.files || [])
      setSkills(s.skills || [])
      setCronJobs(c.jobs || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayBrief = briefs.find(b => b.date === today)
  const latestBrief = briefs[0]
  const healthyCron = cronJobs.filter(j => j.status === 'healthy').length
  const failedCron = cronJobs.filter(j => j.status === 'failed').length
  const customSkills = skills.filter(s => s.source === 'custom').length
  const builtInSkills = skills.filter(s => s.source === 'built-in').length
  const totalSize = memoryFiles.reduce((acc, f) => acc + (f.size || 0), 0)
  const sizeLabel = totalSize > 1024 * 1024 ? `${(totalSize / 1024 / 1024).toFixed(1)} MB` : `${(totalSize / 1024).toFixed(0)} KB`

  return (
    <div className="brain-command-center">
      <div className="tiles-grid">
        <div className="brain-tile" onClick={() => onNavigate('briefs')}>
          <div className="tile-icon"><Clock size={28} className="sky" /></div>
          <div className="tile-info">
            <h3>Daily Brief</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{briefs.length} briefs</span>
                {latestBrief && (
                  <p className="tile-latest">
                    {todayBrief ? <span className="green">Avui: {latestBrief.title}</span> : <span className="amber">Pendent: {latestBrief.title}</span>}
                  </p>
                )}
              </>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        <div className="brain-tile" onClick={() => onNavigate('memory')}>
          <div className="tile-icon"><FolderOpen size={28} className="green" /></div>
          <div className="tile-info">
            <h3>Memory</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{memoryFiles.length} fitxers · {sizeLabel}</span>
                <p className="tile-latest">MEMORY.md + diaris</p>
              </>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        <div className="brain-tile" onClick={() => onNavigate('skills')}>
          <div className="tile-icon"><BookOpen size={28} className="amber" /></div>
          <div className="tile-info">
            <h3>Skills</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{skills.length} total</span>
                <p className="tile-latest">{builtInSkills} built-in · {customSkills} custom</p>
              </>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        <div className="brain-tile" onClick={() => onNavigate('cron')}>
          <div className="tile-icon">
            {failedCron > 0 ? <AlertCircle size={28} className="red" /> : <CheckCircle2 size={28} className="green" />}
          </div>
          <div className="tile-info">
            <h3>Cron Health</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{cronJobs.length} jobs</span>
                <p className="tile-latest">
                  {failedCron > 0 ? <span className="red">{failedCron} failed</span> : <span className="green">{healthyCron} healthy</span>}
                </p>
              </>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Brain Module ─────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'command', label: 'Command Center', icon: BrainIcon },
  { key: 'mission', label: 'Mission Control', icon: Sparkles },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'memory', label: 'Memory', icon: FolderOpen },
  { key: 'briefs', label: 'Briefs', icon: Clock },
  { key: 'skills', label: 'Skills', icon: BookOpen },
  { key: 'cron', label: 'Cron Health', icon: AlertCircle },
]

export default function Brain() {
  const [activeSection, setActiveSection] = useState('command')
  const [showMemoryViewer, setShowMemoryViewer] = useState(false)

  const handleNavigate = (section) => {
    setActiveSection(section)
    if (section === 'memory') setShowMemoryViewer(true)
  }

  return (
    <div className="module-view brain">
      <h1 className="dashboard-title sky neon-sky">Cervell</h1>

      <div className="brain-nav">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`brain-nav-btn ${activeSection === s.key ? 'active' : ''}`}
            onClick={() => handleNavigate(s.key)}
          >
            <s.icon size={16} />
            {s.label}
          </button>
        ))}
      </div>

      <Modal
        isOpen={showMemoryViewer}
        onClose={() => setShowMemoryViewer(false)}
        title="Memory Explorer"
        width="95%"
        height="88%"
      >
        <MemoryExplorer onClose={() => setShowMemoryViewer(false)} />
      </Modal>

      <div className="brain-content">
        {activeSection === 'command' && <BrainCommandCenter onNavigate={handleNavigate} />}
        {activeSection === 'mission' && <MissionControl />}
        {activeSection === 'team' && <TeamOverview />}
        {activeSection === 'memory' && !showMemoryViewer && (
          <div className="memory-section" onClick={() => setShowMemoryViewer(true)}>
            <div className="click-to-open">
              <FolderOpen size={40} className="sky" />
              <h3>Memory Explorer</h3>
              <p>Browse, search and preview all memory files</p>
              <span className="open-link">Click to open <ChevronRight size={14} /></span>
            </div>
          </div>
        )}
        {activeSection === 'briefs' && <MorningBriefsSection />}
        {activeSection === 'skills' && <SkillsDirectory />}
        {activeSection === 'cron' && <CronHealthDashboard />}
      </div>
    </div>
  )
}
