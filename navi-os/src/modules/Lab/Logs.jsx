import { useState, useEffect } from 'react'
import { FileText, Clock, RefreshCw, Tag, Filter, ChevronDown, Search, BookOpen } from 'lucide-react'
import './Logs.css'

const TYPE_CONFIG = {
  action: { label: 'Acció', color: '#22c55e' },
  improvement: { label: 'Millora', color: '#6366f1' },
  decision: { label: 'Decisió', color: '#f59e0b' },
  standup: { label: 'Standup', color: '#3b82f6' },
  somiar: { label: 'Somiar', color: '#a855f7' },
  inbox: { label: 'Inbox', color: '#f97316' },
  system: { label: 'Sistema', color: '#6b7280' },
  test: { label: 'Test', color: '#888' }
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  
  const loadLogs = () => {
    setLoading(true)
    fetch('/api/logs')
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => { loadLogs() }, [])
  
  const filtered = logs.filter(l => {
    const matchType = filter === 'all' || l.type === filter
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.file.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })
  
  const counts = { all: logs.length, ...Object.fromEntries(Object.entries(TYPE_CONFIG).map(([k, v]) => [k, logs.filter(l => l.type === k).length])) }
  
  return (
    <div className="logs-module">
      <div className="logs-header">
        <div className="logs-title-row">
          <div className="logs-title-group">
            <BookOpen size={20} className="logs-icon" />
            <h2>Registre d'Activitat</h2>
          </div>
          <button className="logs-refresh-btn" onClick={loadLogs} title="Actualitzar">
            <RefreshCw size={14} />
          </button>
        </div>
        <p className="logs-subtitle">
          Totes les accions del sistema, registrades en format Obsidian. Cada entrada té frontmatter + cos markdown.
        </p>
      </div>
      
      {/* Search & Filters */}
      <div className="logs-controls">
        <div className="logs-search">
          <Search size={14} />
          <input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="logs-type-filters">
          {['all', ...Object.keys(TYPE_CONFIG)].map(t => {
            const cfg = TYPE_CONFIG[t]
            const count = counts[t] || 0
            if (count === 0 && t !== 'all') return null
            return (
              <button
                key={t}
                className={`type-pill ${filter === t ? 'active' : ''}`}
                onClick={() => setFilter(t)}
                style={filter === t ? { borderColor: cfg?.color || '#f59e0b', color: cfg?.color || '#f59e0b' } : {}}
              >
                {cfg?.label || t}
                <span className="type-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Log entries */}
      {loading ? (
        <div className="logs-loading">
          <RefreshCw size={20} className="spin" />
          <span>Carregant registres...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="logs-empty">
          <FileText size={32} style={{ opacity: 0.2 }} />
          <p>No hay registres{filter !== 'all' ? ` de tipus "${TYPE_CONFIG[filter]?.label || filter}"` : ''}</p>
        </div>
      ) : (
        <div className="logs-list">
          {filtered.map(log => {
            const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.system
            return (
              <div key={log.file} className="log-entry" style={{ borderLeftColor: cfg.color }}>
                <button className="log-entry-header" onClick={() => setExpanded(expanded === log.file ? null : log.file)}>
                  <div className="log-entry-left">
                    <FileText size={14} style={{ color: cfg.color, flexShrink: 0 }} />
                    <div className="log-entry-meta">
                      <span className="log-title">{log.title}</span>
                      <div className="log-entry-tags">
                        <span className="log-date"><Clock size={10} />{log.date}</span>
                        <span className="log-type-badge" style={{ color: cfg.color, background: cfg.color + '18' }}>{cfg.label}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={13} className={`log-chevron ${expanded === log.file ? 'rotated' : ''}`} />
                </button>
                {expanded === log.file && (
                  <div className="log-entry-body">
                    <div className="log-filename">
                      <FileText size={11} />
                      {log.file}
                    </div>
                    <div className="log-actions">
                      <a href={`/api/logs/${log.file}`} target="_blank" className="log-view-btn">
                        Obrir .md
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
