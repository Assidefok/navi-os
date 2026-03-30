import { useState, useEffect, useCallback } from 'react'
import {
  Brain as BrainIcon, FolderOpen, FileText, Clock, Search, BookOpen,
  ChevronRight, Pin, X, CheckCircle2,
  AlertCircle, MinusCircle, RefreshCw
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import FeatureCard from '../components/ui/FeatureCard'
import './Brain.css'

const API_BASE = '/api'

// ─── Markdown Renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h2 key={i}>{line.substring(2)}</h2>
    if (line.startsWith('## ')) return <h3 key={i}>{line.substring(3)}</h3>
    if (line.startsWith('### ')) return <h4 key={i}>{line.substring(4)}</h4>
    if (line.startsWith('- ')) return <li key={i}>{line.substring(2)}</li>
    if (line.startsWith('|')) return <div key={i} className="md-table-row">{line}</div>
    if (line.trim() === '') return <br key={i} />
    if (line.match(/^\d+\.\s/)) return <li key={i} className="numbered">{line.replace(/^\d+\.\s/, '')}</li>
    return <p key={i}>{line}</p>
  })
}

// ─── Section: Memory Viewer ────────────────────────────────────────────────────

function MemoryViewer({ onClose }) {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/memory/files`)
      const data = await res.json()
      setFiles(data.files || [])
    } catch {
      setFiles([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  const selectFile = useCallback(async (file) => {
    setSelectedFile(file)
    try {
      const res = await fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(file.name)}`)
      const data = await res.json()
      setContent(data.content || '')
    } catch {
      setContent('# Error loading file\nCould not read file from server.')
    }
  }, [])

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return iso }
  }

  return (
    <div className="memory-viewer">
      {/* File Browser */}
      <div className="file-browser">
        <div className="browser-header">
          <h4>Memory Files</h4>
          <button className="icon-btn" onClick={loadFiles} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="file-list">
          {files.map(file => (
            <div
              key={file.name}
              className={`file-item ${selectedFile?.name === file.name ? 'active' : ''}`}
              onClick={() => selectFile(file)}
            >
              {file.pinned ? <Pin size={12} className="pin-icon" /> : <FileText size={12} />}
              <span className="file-name">{file.name}</span>
              <span className="file-date">{formatDate(file.modified)}</span>
            </div>
          ))}
          {files.length === 0 && !loading && (
            <div className="empty-state">No memory files found</div>
          )}
        </div>
      </div>

      {/* Markdown Preview */}
      <div className="markdown-preview">
        {selectedFile ? (
          <>
            <div className="preview-header">
              <span className="preview-title">
                {selectedFile.pinned && <Pin size={14} className="pin-icon" />}
                {selectedFile.name}
              </span>
              <button className="icon-btn" onClick={onClose}>
                <X size={14} />
              </button>
            </div>
            <div className="preview-content markdown-content">
              {renderMarkdown(content)}
            </div>
          </>
        ) : (
          <div className="empty-preview">
            <FileText size={32} />
            <p>Select a file to preview</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Morning Briefs Archive ─────────────────────────────────────────

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
    } catch {
      setBriefContent('# Error\nCould not load brief.')
    }
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
              <span className={`status-badge ${brief.status}`}>
                {brief.status === 'delivered' ? 'Delivered' : 'Pending'}
              </span>
            </div>
            <h4 className="brief-title">{brief.title}</h4>
            {brief.preview && <p className="brief-preview">{brief.preview}...</p>}
          </div>
        ))}
        {briefs.length === 0 && !loading && (
          <div className="empty-state">No daily briefs found</div>
        )}
      </div>

      <Modal isOpen={briefModal} onClose={() => setBriefModal(false)} title={selectedBrief?.title} width="65%" height="75%">
        <div className="brief-content markdown-content">
          {renderMarkdown(briefContent)}
        </div>
      </Modal>
    </div>
  )
}

// ─── Section: Skills Directory ────────────────────────────────────────────────

function SkillsDirectory() {
  const [skills, setSkills] = useState([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/skills`)
      .then(r => r.json())
      .then(d => { setSkills(d.skills || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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
          <div key={skill.name} className="skill-card">
            <div className="skill-header">
              <BookOpen size={16} className={skill.source === 'custom' ? 'green' : 'sky'} />
              <span className="skill-name">{skill.name}</span>
              <span className={`skill-status ${skill.status}`}>{skill.status}</span>
            </div>
            <div className="skill-meta">
              <span>{skill.category}</span>
              <span>{skill.owner}</span>
              <span>{skill.lastUpdated}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="empty-state">No skills found for this filter</div>
        )}
      </div>
    </div>
  )
}

// ─── Section: Cron Health Dashboard ──────────────────────────────────────────

function CronHealthDashboard() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cron-health`)
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch { setJobs([]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const stats = {
    healthy: jobs.filter(j => j.status === 'healthy').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    disabled: jobs.filter(j => j.status === 'disabled').length,
    total: jobs.length,
  }

  const statusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 size={14} className="green" />
      case 'failed': return <AlertCircle size={14} className="red" />
      case 'disabled': return <MinusCircle size={14} className="gray" />
      default: return <MinusCircle size={14} />
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('es-ES', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    } catch { return iso }
  }

  return (
    <div className="cron-dashboard">
      <div className="section-stats">
        <span className="stat"><CheckCircle2 size={14} className="green" /> {stats.healthy} healthy</span>
        <span className="stat"><AlertCircle size={14} className="red" /> {stats.failed} failed</span>
        <span className="stat"><MinusCircle size={14} className="gray" /> {stats.disabled} disabled</span>
        <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={14} /></button>
      </div>
      <div className="cron-jobs-list">
        {jobs.map(job => (
          <div key={job.name} className={`cron-job-card ${job.status}`}>
            <div className="cron-job-header">
              {statusIcon(job.status)}
              <span className="cron-job-name">{job.name}</span>
              <span className={`cron-status-label ${job.status}`}>{job.status}</span>
            </div>
            <div className="cron-job-meta">
              <div className="meta-row">
                <span className="meta-label">Last run:</span>
                <span className="meta-value">{formatDate(job.lastRun)}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Next run:</span>
                <span className="meta-value">{formatDate(job.nextRun)}</span>
              </div>
              {job.error && (
                <div className="meta-row error">
                  <span className="meta-label">Error:</span>
                  <span className="meta-value">{job.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {jobs.length === 0 && !loading && (
          <div className="empty-state">No cron jobs found in /workspace/scripts</div>
        )}
      </div>
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
        {/* Latest Brief Tile */}
        <div className="brain-tile" onClick={() => onNavigate('briefs')}>
          <div className="tile-icon"><Clock size={28} className="sky" /></div>
          <div className="tile-info">
            <h3>Daily Brief</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{briefs.length} briefs</span>
                {latestBrief && (
                  <p className="tile-latest">
                    {todayBrief
                      ? <span className="green">Avui: {latestBrief.title}</span>
                      : <span className="amber">Pendents: {latestBrief.title}</span>
                    }
                  </p>
                )}
              </>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        {/* Memory Stats Tile */}
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

        {/* Skills Tile */}
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

        {/* Cron Health Tile */}
        <div className="brain-tile" onClick={() => onNavigate('cron')}>
          <div className="tile-icon">
            {failedCron > 0
              ? <AlertCircle size={28} className="red" />
              : <CheckCircle2 size={28} className="green" />
            }
          </div>
          <div className="tile-info">
            <h3>Cron Health</h3>
            {loading ? <span className="tile-count">...</span> : (
              <>
                <span className="tile-count">{cronJobs.length} jobs</span>
                <p className="tile-latest">
                  {failedCron > 0
                    ? <span className="red">{failedCron} failed</span>
                    : <span className="green">{healthyCron} healthy</span>
                  }
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

      {/* Section Navigation */}
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

      {/* Memory Viewer Modal */}
      <Modal
        isOpen={showMemoryViewer}
        onClose={() => setShowMemoryViewer(false)}
        title="Memory Viewer"
        width="90%"
        height="85%"
      >
        <MemoryViewer onClose={() => setShowMemoryViewer(false)} />
      </Modal>

      {/* Section Content */}
      <div className="brain-content">
        {activeSection === 'command' && <BrainCommandCenter onNavigate={handleNavigate} />}
        {activeSection === 'memory' && (
          <div className="memory-section" onClick={() => setShowMemoryViewer(true)}>
            <div className="click-to-open">
              <FolderOpen size={40} className="sky" />
              <h3>Memory Viewer</h3>
              <p>Browse and preview all memory files</p>
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
