import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Brain as BrainIcon,
  FolderOpen,
  BarChart3,
  Calendar,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
} from 'lucide-react'
import './Brain.css'

const API_BASE = '/api'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text) {
  if (!text) return <p className="brain-empty-copy">No hi ha contingut</p>
  try {
    const html = marked.parse(text)
    const sanitized = DOMPurify.sanitize(html)
    return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: sanitized }} />
  } catch {
    return <pre className="brain-pre-fallback">{text}</pre>
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ca-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatShortDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ca-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

function BrainTopTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'briefs', label: 'Daily Briefs', icon: FileText },
    { key: 'memory', label: 'Memory', icon: FolderOpen },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="brain-top-tabs">
      {tabs.map(tab => {
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            className={`brain-top-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function BrainPanelHeader({ icon: Icon, title, subtitle, onRefresh }) {
  return (
    <div className="brain-panel-header">
      <div className="brain-panel-title-wrap">
        <div className="brain-panel-icon"><Icon size={18} /></div>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {onRefresh && (
        <button className="brain-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      )}
    </div>
  )
}

function DailyBriefsView() {
  const [briefs, setBriefs] = useState([])
  const [selectedBrief, setSelectedBrief] = useState(null)
  const [briefContent, setBriefContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  const loadBriefs = () => {
    setLoading(true)
    fetch(`${API_BASE}/briefs`)
      .then(r => r.json())
      .then(d => {
        const nextBriefs = d.briefs || []
        setBriefs(nextBriefs)
        if (nextBriefs.length > 0) {
          const nextSelected = selectedBrief
            ? nextBriefs.find(b => b.id === selectedBrief.id) || nextBriefs[0]
            : nextBriefs[0]
          setSelectedBrief(nextSelected)
        } else {
          setSelectedBrief(null)
          setBriefContent('')
        }
      })
      .catch(() => {
        setBriefs([])
        setSelectedBrief(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBriefs()
  }, [])

  useEffect(() => {
    if (!selectedBrief) return
    setContentLoading(true)
    fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(selectedBrief.id)}`)
      .then(r => r.json())
      .then(d => setBriefContent(d.content || ''))
      .catch(() => setBriefContent('# Error\nNo s’ha pogut carregar el daily brief.'))
      .finally(() => setContentLoading(false))
  }, [selectedBrief])

  return (
    <div className="brain-studio-shell">
      <BrainPanelHeader
        icon={FileText}
        title="Daily Briefs"
        subtitle="Històric i visor dels briefs diaris"
        onRefresh={loadBriefs}
      />

      <div className="brain-workspace-layout">
        <aside className="brain-sidebar-panel">
          <div className="brain-sidebar-header">
            <span className="brain-sidebar-kicker"><Calendar size={12} /> History</span>
          </div>

          <div className="brain-sidebar-list">
            {loading ? (
              <div className="brain-empty-state">Carregant briefs...</div>
            ) : briefs.length === 0 ? (
              <div className="brain-empty-state">No hi ha daily briefs</div>
            ) : (
              briefs.map(brief => (
                <button
                  key={brief.id}
                  className={`brain-history-item ${selectedBrief?.id === brief.id ? 'active' : ''}`}
                  onClick={() => setSelectedBrief(brief)}
                >
                  <div className="brain-history-date">{brief.date}</div>
                  <div className="brain-history-subdate">{formatDate(brief.modified || brief.date)}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="brain-reader-panel">
          {selectedBrief ? (
            <>
              <div className="brain-reader-header">
                <h3>{selectedBrief.title || selectedBrief.date}</h3>
                <span className={`brain-status-badge ${selectedBrief.status || 'unknown'}`}>
                  {selectedBrief.status || 'unknown'}
                </span>
              </div>
              <div className="brain-reader-meta">
                <span>{formatDate(selectedBrief.modified || selectedBrief.date)}</span>
                <span>{selectedBrief.id}</span>
              </div>
              <div className="brain-reader-content">
                {contentLoading ? <div className="brain-empty-state">Carregant contingut...</div> : renderMarkdown(briefContent)}
              </div>
            </>
          ) : (
            <div className="brain-empty-state large">Selecciona un daily brief</div>
          )}
        </section>
      </div>
    </div>
  )
}

function MemoryView() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadFiles = () => {
    setLoading(true)
    fetch(`${API_BASE}/memory/files`)
      .then(r => r.json())
      .then(d => {
        const nextFiles = d.files || []
        setFiles(nextFiles)
        if (nextFiles.length > 0) {
          const nextSelected = selectedFile
            ? nextFiles.find(f => f.name === selectedFile.name) || nextFiles[0]
            : nextFiles[0]
          setSelectedFile(nextSelected)
        } else {
          setSelectedFile(null)
          setContent('')
        }
      })
      .catch(() => {
        setFiles([])
        setSelectedFile(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    if (!selectedFile) return
    setContentLoading(true)
    fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(selectedFile.name)}`)
      .then(r => r.json())
      .then(d => setContent(d.content || ''))
      .catch(() => setContent('# Error\nNo s’ha pogut carregar aquest fitxer.'))
      .finally(() => setContentLoading(false))
  }, [selectedFile])

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return files
    return files.filter(file => file.name.toLowerCase().includes(q))
  }, [files, search])

  return (
    <div className="brain-studio-shell">
      <BrainPanelHeader
        icon={FolderOpen}
        title="Memory"
        subtitle="Explorador de memòria amb preview immediata"
        onRefresh={loadFiles}
      />

      <div className="brain-workspace-layout">
        <aside className="brain-sidebar-panel">
          <div className="brain-sidebar-header stack">
            <span className="brain-sidebar-kicker"><FolderOpen size={12} /> Memory Files</span>
            <div className="brain-search-box">
              <Search size={13} />
              <input
                type="text"
                placeholder="Buscar fitxers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="brain-sidebar-list">
            {loading ? (
              <div className="brain-empty-state">Carregant memòria...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="brain-empty-state">Cap fitxer</div>
            ) : (
              filteredFiles.map(file => (
                <button
                  key={file.name}
                  className={`brain-history-item memory ${selectedFile?.name === file.name ? 'active' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="brain-history-date ellipsis">{file.name}</div>
                  <div className="brain-history-subdate">{formatShortDate(file.modified)} · {formatBytes(file.size)}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="brain-reader-panel">
          {selectedFile ? (
            <>
              <div className="brain-reader-header">
                <h3>{selectedFile.name}</h3>
                <span className="brain-status-badge neutral">{formatBytes(selectedFile.size)}</span>
              </div>
              <div className="brain-reader-meta">
                <span>{formatDateTime(selectedFile.modified)}</span>
                <span>{selectedFile.path}</span>
              </div>
              <div className="brain-reader-content">
                {contentLoading ? <div className="brain-empty-state">Carregant contingut...</div> : renderMarkdown(content)}
              </div>
            </>
          ) : (
            <div className="brain-empty-state large">Selecciona un fitxer de memòria</div>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, tone = 'sky' }) {
  return (
    <div className={`brain-metric-card ${tone}`}>
      <div className="brain-metric-icon"><Icon size={18} /></div>
      <div>
        <div className="brain-metric-value">{value}</div>
        <div className="brain-metric-label">{label}</div>
      </div>
    </div>
  )
}

function AnalyticsView() {
  const [briefs, setBriefs] = useState([])
  const [files, setFiles] = useState([])
  const [cronJobs, setCronJobs] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAnalytics = () => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/briefs`).then(r => r.json()).catch(() => ({ briefs: [] })),
      fetch(`${API_BASE}/memory/files`).then(r => r.json()).catch(() => ({ files: [] })),
      fetch(`${API_BASE}/cron-health`).then(r => r.json()).catch(() => ({ jobs: [] })),
      fetch(`${API_BASE}/skills`).then(r => r.json()).catch(() => ({ skills: [] })),
    ])
      .then(([briefData, fileData, cronData, skillData]) => {
        setBriefs(briefData.briefs || [])
        setFiles(fileData.files || [])
        setCronJobs(cronData.jobs || [])
        setSkills(skillData.skills || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const delivered = briefs.filter(b => b.status === 'delivered').length
  const healthyCron = cronJobs.filter(job => job.status === 'healthy').length
  const failedCron = cronJobs.filter(job => job.status === 'failed').length
  const totalMemory = files.reduce((sum, file) => sum + (file.size || 0), 0)

  return (
    <div className="brain-studio-shell">
      <BrainPanelHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Resum operacional del cervell de Navi"
        onRefresh={loadAnalytics}
      />

      {loading ? (
        <div className="brain-empty-state large">Carregant analytics...</div>
      ) : (
        <div className="brain-analytics-layout">
          <div className="brain-metrics-grid">
            <MetricCard label="Daily Briefs" value={briefs.length} icon={FileText} tone="sky" />
            <MetricCard label="Delivered" value={delivered} icon={CheckCircle2} tone="green" />
            <MetricCard label="Memory Files" value={files.length} icon={FolderOpen} tone="violet" />
            <MetricCard label="Memory Size" value={formatBytes(totalMemory)} icon={BrainIcon} tone="amber" />
            <MetricCard label="Cron Healthy" value={healthyCron} icon={Clock} tone="green" />
            <MetricCard label="Cron Errors" value={failedCron} icon={AlertCircle} tone={failedCron > 0 ? 'red' : 'neutral'} />
            <MetricCard label="Skills" value={skills.length} icon={BookOpen} tone="sky" />
            <MetricCard label="Last Brief" value={briefs[0]?.date || '—'} icon={Calendar} tone="neutral" />
          </div>

          <div className="brain-analytics-panels">
            <div className="brain-analytics-panel">
              <h3>Últims briefs</h3>
              <div className="brain-mini-list">
                {briefs.slice(0, 5).map(brief => (
                  <div key={brief.id} className="brain-mini-row">
                    <strong>{brief.title}</strong>
                    <span>{formatDateTime(brief.modified)}</span>
                  </div>
                ))}
                {briefs.length === 0 && <div className="brain-empty-copy">Sense briefs</div>}
              </div>
            </div>

            <div className="brain-analytics-panel">
              <h3>Cron health</h3>
              <div className="brain-mini-list">
                {cronJobs.slice(0, 6).map(job => (
                  <div key={job.id || job.name} className="brain-mini-row spread">
                    <div>
                      <strong>{job.name}</strong>
                      <span>{job.scheduleLabel || job.scheduleExpr || '—'}</span>
                    </div>
                    <span className={`brain-status-badge ${job.status}`}>{job.status}</span>
                  </div>
                ))}
                {cronJobs.length === 0 && <div className="brain-empty-copy">Sense cron jobs</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Brain() {
  const [activeTab, setActiveTab] = useState('briefs')

  return (
    <div className="module-view brain brain-studio">
      <BrainTopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="brain-content">
        {activeTab === 'briefs' && <DailyBriefsView />}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </div>
    </div>
  )
}
