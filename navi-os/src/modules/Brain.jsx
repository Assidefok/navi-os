import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import {
  FileText,
  Brain as BrainIcon,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  Search,
  Users,
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

function BrainTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'briefs', label: 'Daily Briefs' },
    { key: 'chiefs', label: 'Chiefs' },
    { key: 'memory', label: 'Memory' },
    { key: 'search', label: 'Search' },
  ]

  return (
    <div className="brain-top-tabs minimal">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`brain-top-tab minimal ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function DailyBriefCard({ briefs, loading, onOpenBriefs }) {
  const latest = briefs.slice(0, 3)

  return (
    <section className="brain-dashboard-card">
      <div className="brain-dashboard-card-header">
        <div className="brain-dashboard-card-title">
          <div className="brain-dashboard-icon"><FileText size={18} /></div>
          <div>
            <h3>Daily Briefs</h3>
            <p>Morning priorities and follow-ups</p>
          </div>
        </div>
      </div>

      <div className="brain-dashboard-card-body">
        <div className="brain-block-label">Latest Briefs</div>

        {loading ? (
          <div className="brain-dashboard-list-empty">Carregant...</div>
        ) : latest.length === 0 ? (
          <div className="brain-dashboard-list-empty">No hi ha briefs disponibles</div>
        ) : (
          <div className="brain-dashboard-list">
            {latest.map(brief => (
              <button key={brief.id} className="brain-dashboard-list-item" onClick={onOpenBriefs}>
                <div className="brain-dashboard-list-left">
                  <Clock size={14} />
                  <div>
                    <strong>{brief.title}</strong>
                    <span>{formatDateTime(brief.modified || brief.date)}</span>
                  </div>
                </div>
                <div className="brain-dashboard-list-right">
                  <span className={`brain-status-badge ${brief.status || 'unknown'}`}>{brief.status || 'unknown'}</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function DashboardView({ briefs, loading, onOpenBriefs, memoryFiles, onOpenMemory, chiefs, onOpenChiefs }) {
  const pinnedMemory = memoryFiles.filter(f => f.pinned).slice(0, 3)

  return (
    <div className="brain-dashboard-shell">
      <div className="brain-dashboard-hero">
        <div className="brain-dashboard-title-wrap">
          <div className="brain-dashboard-hero-icon"><BrainIcon size={22} /></div>
          <div>
            <h1>Brain Dashboard</h1>
            <p>Knowledge and intelligence layer</p>
          </div>
        </div>
      </div>

      <div className="brain-dashboard-grid">
        <DailyBriefCard briefs={briefs} loading={loading} onOpenBriefs={onOpenBriefs} />
        <section className="brain-dashboard-card">
          <div className="brain-dashboard-card-header">
            <div className="brain-dashboard-card-title">
              <div className="brain-dashboard-icon"><BookOpen size={18} /></div>
              <div>
                <h3>Memory</h3>
                <p>Arxius i record persistent</p>
              </div>
            </div>
          </div>
          <div className="brain-dashboard-card-body">
            <div className="brain-block-label">Pinned Memory</div>
            {pinnedMemory.length === 0 ? (
              <div className="brain-dashboard-list-empty">Sense memòries</div>
            ) : (
              <div className="brain-dashboard-list">
                {pinnedMemory.map(file => (
                  <button key={file.path} className="brain-dashboard-list-item" onClick={() => onOpenMemory(file)}>
                    <div className="brain-dashboard-list-left">
                      <FileText size={14} />
                      <div>
                        <strong>{file.name}</strong>
                        <span>{formatDateTime(file.modified)}</span>
                      </div>
                    </div>
                    <div className="brain-dashboard-list-right">
                      <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="brain-dashboard-card">
          <div className="brain-dashboard-card-header">
            <div className="brain-dashboard-card-title">
              <div className="brain-dashboard-icon"><Users size={18} /></div>
              <div>
                <h3>Chiefs</h3>
                <p>Team memory i perspectives</p>
              </div>
            </div>
          </div>
          <div className="brain-dashboard-card-body">
            <div className="brain-block-label">Team Members</div>
            {chiefs.length === 0 ? (
              <div className="brain-dashboard-list-empty">Sense dades</div>
            ) : (
              <div className="brain-dashboard-list">
                {chiefs.map(chief => (
                  <button key={chief.id} className="brain-dashboard-list-item" onClick={() => onOpenChiefs(chief)}>
                    <div className="brain-dashboard-list-left">
                      <span style={{ fontSize: 18 }}>{chief.emoji}</span>
                      <div>
                        <strong>{chief.name}</strong>
                        <span>{chief.title}</span>
                      </div>
                    </div>
                    <div className="brain-dashboard-list-right">
                      <ChevronRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MemoryView({ memoryFiles, loading, onRefresh }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!memoryFiles.length) {
      setSelectedFile(null)
      setFileContent('')
      return
    }
    setSelectedFile(prev => memoryFiles.find(f => f.path === prev?.path) || memoryFiles[0])
  }, [memoryFiles])

  useEffect(() => {
    if (!selectedFile) return
    setContentLoading(true)
    fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(selectedFile.name || selectedFile.path.replace(/^.*\/memory\//, ''))}`)
      .then(r => r.json())
      .then(d => setFileContent(d.content || ''))
      .catch(() => setFileContent('# Error\nNo s\'ha pogut carregar la memòria.'))
      .finally(() => setContentLoading(false))
  }, [selectedFile])

  return (
    <div className="brain-daily-shell">
      <div className="brain-daily-header">
        <div>
          <h2>Memory</h2>
          <p>Fitxers persistents del sistema</p>
        </div>
        <button className="brain-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      <div className="brain-daily-layout">
        <aside className="brain-daily-sidebar">
          <div className="brain-block-label">Files</div>
          <div className="brain-daily-history">
            {loading ? (
              <div className="brain-dashboard-list-empty">Carregant...</div>
            ) : memoryFiles.length === 0 ? (
              <div className="brain-dashboard-list-empty">Sense fitxers</div>
            ) : (
              memoryFiles.map(file => (
                <button
                  key={file.path}
                  className={`brain-history-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="brain-history-date small">{file.name}</div>
                  <div className="brain-history-subdate">{formatDate(file.modified)}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="brain-daily-reader">
          {selectedFile ? (
            <>
              <div className="brain-reader-header">
                <h3>{selectedFile.name}</h3>
                <span className="brain-status-badge pinned">{selectedFile.pinned ? 'pinned' : 'file'}</span>
              </div>
              <div className="brain-reader-meta">
                <span>{formatDate(selectedFile.modified)}</span>
                <span>{selectedFile.size} bytes</span>
              </div>
              <div className="brain-reader-content">
                {contentLoading ? <div className="brain-dashboard-list-empty">Carregant contingut...</div> : renderMarkdown(fileContent)}
              </div>
            </>
          ) : (
            <div className="brain-dashboard-list-empty large">Selecciona un fitxer</div>
          )}
        </section>
      </div>
    </div>
  )
}

function DailyBriefsView({ briefs, loading, onRefresh }) {
  const [selectedBrief, setSelectedBrief] = useState(null)
  const [briefContent, setBriefContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!briefs.length) {
      setSelectedBrief(null)
      setBriefContent('')
      return
    }
    setSelectedBrief(prev => briefs.find(b => b.id === prev?.id) || briefs[0])
  }, [briefs])

  useEffect(() => {
    if (!selectedBrief) return
    setContentLoading(true)
    fetch(`${API_BASE}/memory/file?path=${encodeURIComponent(selectedBrief.id)}`)
      .then(r => r.json())
      .then(d => setBriefContent(d.content || ''))
      .catch(() => setBriefContent('# Error\nNo s\'ha pogut carregar el daily brief.'))
      .finally(() => setContentLoading(false))
  }, [selectedBrief])

  return (
    <div className="brain-daily-shell">
      <div className="brain-daily-header">
        <div>
          <h2>Daily Briefs</h2>
          <p>Històric i visor dels briefs diaris</p>
        </div>
        <button className="brain-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      <div className="brain-daily-layout">
        <aside className="brain-daily-sidebar">
          <div className="brain-block-label">History</div>
          <div className="brain-daily-history">
            {loading ? (
              <div className="brain-dashboard-list-empty">Carregant...</div>
            ) : briefs.length === 0 ? (
              <div className="brain-dashboard-list-empty">Sense briefs</div>
            ) : (
              briefs.map(brief => (
                <button
                  key={brief.id}
                  className={`brain-history-item ${selectedBrief?.id === brief.id ? 'active' : ''}`}
                  onClick={() => setSelectedBrief(brief)}
                >
                  <div className="brain-history-date small">{brief.date}</div>
                  <div className="brain-history-subdate">{formatDate(brief.modified || brief.date)}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="brain-daily-reader">
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
                {contentLoading ? <div className="brain-dashboard-list-empty">Carregant contingut...</div> : renderMarkdown(briefContent)}
              </div>
            </>
          ) : (
            <div className="brain-dashboard-list-empty large">Selecciona un brief</div>
          )}
        </section>
      </div>
    </div>
  )
}

function ChiefsView({ chiefs, loading, onRefresh }) {
  const [selectedChief, setSelectedChief] = useState(null)
  const [chiefContent, setChiefContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!chiefs.length) {
      setSelectedChief(null)
      setChiefContent('')
      return
    }
    setSelectedChief(prev => chiefs.find(c => c.id === prev?.id) || chiefs[0])
  }, [chiefs])

  useEffect(() => {
    if (!selectedChief) return
    setContentLoading(true)
    fetch(`${API_BASE}/file?path=${encodeURIComponent(selectedChief.memoryPath)}`)
      .then(r => r.json())
      .then(d => setChiefContent(d.content || ''))
      .catch(() => setChiefContent('# Error\nNo s\'ha pogut carregar la memòria del chief.'))
      .finally(() => setContentLoading(false))
  }, [selectedChief])

  return (
    <div className="brain-daily-shell">
      <div className="brain-daily-header">
        <div>
          <h2>Chiefs</h2>
          <p>MEMORY.md de cada chief de l'equip</p>
        </div>
        <button className="brain-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      <div className="brain-daily-layout">
        <aside className="brain-daily-sidebar">
          <div className="brain-block-label">Chiefs</div>
          <div className="brain-daily-history">
            {loading ? (
              <div className="brain-dashboard-list-empty">Carregant...</div>
            ) : chiefs.length === 0 ? (
              <div className="brain-dashboard-list-empty">Sense dades</div>
            ) : (
              chiefs.map(chief => (
                <button
                  key={chief.id}
                  className={`brain-history-item ${selectedChief?.id === chief.id ? 'active' : ''}`}
                  onClick={() => setSelectedChief(chief)}
                >
                  <div className="brain-history-date small">
                    <span style={{ marginRight: 6 }}>{chief.emoji}</span>
                    {chief.name}
                  </div>
                  <div className="brain-history-subdate">{chief.title}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="brain-daily-reader">
          {selectedChief ? (
            <>
              <div className="brain-reader-header">
                <h3>
                  <span style={{ marginRight: 8 }}>{selectedChief.emoji}</span>
                  {selectedChief.name}
                </h3>
                <span className="brain-status-badge delivered">active</span>
              </div>
              <div className="brain-reader-meta">
                <span>{selectedChief.title}</span>
                <span>Updated: {formatDate(selectedChief.lastUpdated || selectedChief.modified)}</span>
                <span>{selectedChief.memoryPath}</span>
              </div>
              <div className="brain-reader-content">
                {contentLoading ? <div className="brain-dashboard-list-empty">Carregant contingut...</div> : renderMarkdown(chiefContent)}
              </div>
            </>
          ) : (
            <div className="brain-dashboard-list-empty large">Selecciona un chief</div>
          )}
        </section>
      </div>
    </div>
  )
}

function SearchView({ onSelectFile }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    fetch(`${API_BASE}/brain/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => setResults(d.results || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  const grouped = {
    brief: results.filter(r => r.type === 'brief'),
    memory: results.filter(r => r.type === 'memory'),
    chief: results.filter(r => r.type === 'chief'),
  }

  const typeLabel = { brief: 'Daily Briefs', memory: 'Memory Files', chief: 'Chiefs' }
  const typeIcon = {
    brief: <FileText size={14} />,
    memory: <BookOpen size={14} />,
    chief: <Users size={14} />,
  }

  return (
    <div className="brain-daily-shell">
      <div className="brain-daily-header">
        <div>
          <h2>Search</h2>
          <p>Cerca semantica per contingut a briefs, memory i chiefs</p>
        </div>
      </div>

      <form className="brain-search-form" onSubmit={handleSearch}>
        <div className="brain-search-input-wrap">
          <Search size={16} className="brain-search-icon" />
          <input
            type="text"
            className="brain-search-input"
            placeholder="Escriu paraules clau per cercar..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="brain-refresh-btn" disabled={loading || !query.trim()}>
          <Search size={14} /> Cercar
        </button>
      </form>

      <div className="brain-search-results">
        {loading ? (
          <div className="brain-dashboard-list-empty">Cercant...</div>
        ) : !searched ? (
          <div className="brain-dashboard-list-empty">
            <Search size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>Escriu paraules clau i prem Cercar</div>
            <div style={{ marginTop: 8, opacity: 0.6, fontSize: 11 }}>
              Cerca a Daily Briefs, Memory i MEMORY.md dels Chiefs
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="brain-dashboard-list-empty">
            Cap resultat per "{query}"
          </div>
        ) : (
          <>
            {(['brief', 'memory', 'chief']).map(type => {
              const group = grouped[type]
              if (!group.length) return null
              return (
                <div key={type} className="brain-search-group">
                  <div className="brain-block-label">
                    {typeIcon[type]} {typeLabel[type]} ({group.length})
                  </div>
                  <div className="brain-dashboard-list">
                    {group.map(result => (
                      <button
                        key={result.id}
                        className="brain-dashboard-list-item"
                        onClick={() => onSelectFile(result)}
                      >
                        <div className="brain-dashboard-list-left">
                          {typeIcon[type]}
                          <div>
                            <strong>{result.title}</strong>
                            <span className="brain-search-snippet">{result.snippet}</span>
                          </div>
                        </div>
                        <div className="brain-dashboard-list-right">
                          <span className={`brain-status-badge ${type === 'chief' ? 'delivered' : type === 'brief' ? 'pending' : 'unknown'}`}>
                            {type}
                          </span>
                          <ChevronRight size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default function Brain() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [briefs, setBriefs] = useState([])
  const [memoryFiles, setMemoryFiles] = useState([])
  const [chiefs, setChiefs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBriefs = () => {
    setLoading(true)
    fetch(`${API_BASE}/briefs`)
      .then(r => r.json())
      .then(d => setBriefs(d.briefs || []))
      .catch(() => setBriefs([]))
      .finally(() => setLoading(false))
  }

  const loadMemoryFiles = () => {
    fetch(`${API_BASE}/memory/files`)
      .then(r => r.json())
      .then(d => setMemoryFiles((d.files || []).filter(f => f.name.endsWith('.md'))))
      .catch(() => setMemoryFiles([]))
  }

  const loadChiefs = () => {
    fetch(`${API_BASE}/chiefs`)
      .then(r => r.json())
      .then(d => setChiefs(d.chiefs || []))
      .catch(() => setChiefs([]))
  }

  const handleSearchSelect = (result) => {
    // Navigate to appropriate tab based on result type
    if (result.type === 'brief') {
      setActiveTab('briefs')
    } else if (result.type === 'chief') {
      setActiveTab('chiefs')
    } else {
      setActiveTab('memory')
    }
  }

  useEffect(() => {
    loadBriefs()
    loadMemoryFiles()
    loadChiefs()
  }, [])

  return (
    <div className="module-view brain brain-structured">
      <BrainTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="brain-content structured">
        {activeTab === 'dashboard' && (
          <DashboardView
            briefs={briefs}
            loading={loading}
            onOpenBriefs={() => setActiveTab('briefs')}
            memoryFiles={memoryFiles}
            onOpenMemory={() => setActiveTab('memory')}
            chiefs={chiefs}
            onOpenChiefs={() => setActiveTab('chiefs')}
          />
        )}
        {activeTab === 'briefs' && (
          <DailyBriefsView briefs={briefs} loading={loading} onRefresh={loadBriefs} />
        )}
        {activeTab === 'chiefs' && (
          <ChiefsView chiefs={chiefs} loading={loading} onRefresh={loadChiefs} />
        )}
        {activeTab === 'memory' && (
          <MemoryView memoryFiles={memoryFiles} loading={loading} onRefresh={loadMemoryFiles} />
        )}
        {activeTab === 'search' && (
          <SearchView onSelectFile={handleSearchSelect} />
        )}
      </div>
    </div>
  )
}
