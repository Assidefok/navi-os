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

function DashboardView({ briefs, loading, onOpenBriefs }) {
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

      <DailyBriefCard briefs={briefs} loading={loading} onOpenBriefs={onOpenBriefs} />
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
      .catch(() => setBriefContent('# Error\nNo s’ha pogut carregar el daily brief.'))
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

export default function Brain() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [briefs, setBriefs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadBriefs = () => {
    setLoading(true)
    fetch(`${API_BASE}/briefs`)
      .then(r => r.json())
      .then(d => setBriefs(d.briefs || []))
      .catch(() => setBriefs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadBriefs()
  }, [])

  return (
    <div className="module-view brain brain-structured">
      <BrainTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="brain-content structured">
        {activeTab === 'dashboard' && (
          <DashboardView briefs={briefs} loading={loading} onOpenBriefs={() => setActiveTab('briefs')} />
        )}
        {activeTab === 'briefs' && (
          <DailyBriefsView briefs={briefs} loading={loading} onRefresh={loadBriefs} />
        )}
      </div>
    </div>
  )
}
