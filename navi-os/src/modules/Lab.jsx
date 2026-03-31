import { useState, useEffect } from 'react'
import {
  FlaskConical, Lightbulb, Rocket, Search, Plus, Play, Pause, Archive,
  ChevronRight, X, RefreshCw, TrendingUp, Clock, Star, Check, Ban
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import FeatureCard from '../components/ui/FeatureCard'
import './Lab.css'

const API_BASE = '/api'

// ─── Prototype Portfolio ──────────────────────────────────────────────────────

function PrototypePortfolio() {
  const [prototypes, setPrototypes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/prototypes`)
      .then(r => r.json())
      .then(d => { setPrototypes(d.prototypes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const stats = {
    running: prototypes.filter(p => p.status === 'running').length,
    stopped: prototypes.filter(p => p.status === 'stopped').length,
    total: prototypes.length,
  }

  const statusColor = (status) => {
    switch (status) {
      case 'running': return '#00ff41'
      case 'stopped': return '#ffb800'
      case 'archived': return '#606070'
      default: return '#606070'
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return iso }
  }

  return (
    <div className="prototype-portfolio">
      <div className="section-stats">
        <span className="stat"><span className="dot running" /> {stats.running} running</span>
        <span className="stat"><span className="dot stopped" /> {stats.stopped} stopped</span>
        <span className="stat"><span className="dot archived" /> {stats.total} total</span>
      </div>
      <div className="prototypes-grid">
        {prototypes.map(proto => (
          <div key={proto.id} className="prototype-card">
            <div className="proto-header">
              <span className="proto-status-dot" style={{ background: statusColor(proto.status) }} />
              <span className="proto-status-text">{proto.status}</span>
              {proto.port && <span className="proto-port">:{proto.port}</span>}
            </div>
            <h3 className="proto-name">{proto.name}</h3>
            <p className="proto-one-liner">{proto['one-liner']}</p>
            <div className="proto-score">
              <Star size={12} className="amber" />
              <span>{proto.score}/100</span>
            </div>
            <div className="proto-footer">
              <span>Build: {formatDate(proto.lastBuild)}</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
        {prototypes.length === 0 && !loading && (
          <div className="empty-state">No prototypes found</div>
        )}
      </div>
    </div>
  )
}

// ─── Ideas Gallery ────────────────────────────────────────────────────────────

function IdeasGallery() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)

  const loadIdeas = () => {
    setLoading(true)
    fetch(`${API_BASE}/ideas`)
      .then(r => r.json())
      .then(d => { setIdeas(d.ideas || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    Promise.resolve().then(() => loadIdeas())
  }, [])

  const acceptIdea = (id) => {
    setActionLoading(id)
    fetch(`${API_BASE}/ideas/${id}/accept`, { method: 'POST' })
      .then(r => r.json())
      .then(() => { loadIdeas(); setActionLoading(null) })
      .catch(() => setActionLoading(null))
  }

  const rejectIdea = (id) => {
    setActionLoading(id)
    fetch(`${API_BASE}/ideas/${id}/reject`, { method: 'POST' })
      .then(r => r.json())
      .then(() => { loadIdeas(); setActionLoading(null) })
      .catch(() => setActionLoading(null))
  }

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.track === filter)

  const impactColor = (impact) => {
    switch (impact) {
      case 'high': return '#00ff41'
      case 'medium': return '#ffb800'
      case 'low': return '#a0a0b0'
      default: return '#a0a0b0'
    }
  }

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) } catch { return d }
  }

  return (
    <div className="ideas-gallery">
      <div className="tab-bar">
        {['all', 'A', 'B'].map(t => (
          <button key={t} className={`tab ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>
            Track {t === 'all' ? 'All' : t}
            <span className="tab-count">{t === 'all' ? ideas.length : ideas.filter(i => i.track === t).length}</span>
          </button>
        ))}
      </div>
      <div className="ideas-grid">
        {filtered.map(idea => (
          <div key={idea.id} className="idea-card">
            <div className="idea-header">
              <span className={`track-badge track-${idea.track.toLowerCase()}`}>Track {idea.track}</span>
              <span className="idea-impact" style={{ color: impactColor(idea.impact) }}>
                <TrendingUp size={12} /> {idea.impact}
              </span>
            </div>
            <h4 className="idea-title">{idea.title}</h4>
            <p className="idea-description">{idea.description}</p>
            <div className="idea-footer">
              <span className="idea-date"><Clock size={11} /> {formatDate(idea.date)}</span>
              <span className="idea-category">{idea.category}</span>
              <span className={`idea-status ${idea.status}`}>{idea.status}</span>
            </div>
            <div className="idea-actions">
              <button 
                className="idea-btn accept" 
                onClick={() => acceptIdea(idea.id)}
                disabled={actionLoading === idea.id}
              >
                <Check size={14} /> Acceptar
              </button>
              <button 
                className="idea-btn reject" 
                onClick={() => rejectIdea(idea.id)}
                disabled={actionLoading === idea.id}
              >
                <Ban size={14} /> Rebutjar
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="empty-state">No ideas for this track</div>
        )}
      </div>
    </div>
  )
}

// ─── Research Dashboard ───────────────────────────────────────────────────────

function ResearchDashboard() {
  return (
    <div className="research-dashboard">
      <div className="section-stats">
        <span className="stat"><Search size={14} /> AI Pulse & Research</span>
      </div>
      <div className="research-placeholder">
        <Search size={32} className="green" />
        <h4>Research Files</h4>
        <p>Place markdown research files in /home/user/.openclaw/workspace/research/</p>
        <p className="sub">They will appear here automatically.</p>
      </div>
      <div className="timeline-placeholder">
        <h4>Timeline</h4>
        <div className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <span className="timeline-date">2026-03-30</span>
            <span>Research dashboard initialized</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Lab Command Center (Landing) ────────────────────────────────────────────

function LabCommandCenter({ onNavigate }) {
  const [prototypes, setPrototypes] = useState([])
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/prototypes`).then(r => r.json()).catch(() => ({ prototypes: [] })),
      fetch(`${API_BASE}/ideas`).then(r => r.json()).catch(() => ({ ideas: [] })),
    ]).then(([pData, iData]) => {
      setPrototypes(pData.prototypes || [])
      setIdeas(iData.ideas || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const latestPrototype = prototypes[0]
  const latestIdea = ideas[0]

  return (
    <div className="lab-command-center">
      <div className="tiles-grid">
        {/* Ideas Tile */}
        <div className="lab-tile" onClick={() => onNavigate('ideas')}>
          <div className="tile-icon"><Lightbulb size={28} className="amber" /></div>
          <div className="tile-info">
            <h3>Ideas</h3>
            <span className="tile-count">{loading ? '...' : ideas.length} ideas</span>
            {latestIdea && (
              <p className="tile-latest">Latest: {latestIdea.title.substring(0, 40)}...</p>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        {/* Prototypes Tile */}
        <div className="lab-tile" onClick={() => onNavigate('prototypes')}>
          <div className="tile-icon"><FlaskConical size={28} className="green" /></div>
          <div className="tile-info">
            <h3>Prototypes</h3>
            <span className="tile-count">
              {loading ? '...' : `${prototypes.filter(p => p.status === 'running').length} running / ${prototypes.length} total`}
            </span>
            {latestPrototype && (
              <p className="tile-latest">Latest: {latestPrototype.name}</p>
            )}
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        {/* Overnight Builds Tile */}
        <div className="lab-tile" onClick={() => onNavigate('overnight')}>
          <div className="tile-icon"><Rocket size={28} className="sky" /></div>
          <div className="tile-info">
            <h3>Overnight Builds</h3>
            <span className="tile-count">Automated</span>
            <p className="tile-latest">Cron-driven construction pipeline</p>
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>

        {/* Research Tile */}
        <div className="lab-tile" onClick={() => onNavigate('research')}>
          <div className="tile-icon"><Search size={28} className="purple" /></div>
          <div className="tile-info">
            <h3>Research</h3>
            <span className="tile-count">AI Pulse</span>
            <p className="tile-latest">Technology landscape tracking</p>
          </div>
          <ChevronRight size={18} className="tile-arrow" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Lab Module ──────────────────────────────────────────────────────────

export default function Lab() {
  const [activeSection, setActiveSection] = useState('landing')
  const [showPrototypes, setShowPrototypes] = useState(false)
  const [showIdeas, setShowIdeas] = useState(false)

  const handleNavigate = (section) => {
    setActiveSection(section)
    if (section === 'prototypes') setShowPrototypes(true)
    if (section === 'ideas') setShowIdeas(true)
  }

  return (
    <div className="module-view lab">
      <h1 className="dashboard-title green neon-green">Laboratori</h1>

      {/* Section Nav */}
      <div className="lab-nav">
        <button className={`lab-nav-btn ${activeSection === 'landing' ? 'active' : ''}`} onClick={() => setActiveSection('landing')}>
          Command Center
        </button>
        <button className={`lab-nav-btn ${activeSection === 'prototypes' ? 'active' : ''}`} onClick={() => { setActiveSection('prototypes'); setShowPrototypes(true) }}>
          Prototypes
        </button>
        <button className={`lab-nav-btn ${activeSection === 'ideas' ? 'active' : ''}`} onClick={() => { setActiveSection('ideas'); setShowIdeas(true) }}>
          Ideas
        </button>
        <button className={`lab-nav-btn ${activeSection === 'overnight' ? 'active' : ''}`} onClick={() => setActiveSection('overnight')}>
          Overnight
        </button>
        <button className={`lab-nav-btn ${activeSection === 'research' ? 'active' : ''}`} onClick={() => setActiveSection('research')}>
          Research
        </button>
      </div>

      {/* Content */}
      <div className="lab-content">
        {activeSection === 'landing' && <LabCommandCenter onNavigate={handleNavigate} />}
        {activeSection === 'prototypes' && <PrototypePortfolio />}
        {activeSection === 'ideas' && <IdeasGallery />}
        {activeSection === 'overnight' && (
          <div className="overnight-section">
            <Rocket size={40} className="sky" />
            <h3>Overnight Builds</h3>
            <p>Automated build pipeline runs during off-hours.</p>
            <p className="sub">Configure via /workspace/scripts/cron-*.sh</p>
          </div>
        )}
        {activeSection === 'research' && <ResearchDashboard />}
      </div>

      {/* Modals */}
      <Modal isOpen={showPrototypes} onClose={() => setShowPrototypes(false)} title="Prototype Portfolio" width="85%" height="80%">
        <PrototypePortfolio onClose={() => setShowPrototypes(false)} />
      </Modal>
      <Modal isOpen={showIdeas} onClose={() => setShowIdeas(false)} title="Ideas Gallery" width="85%" height="80%">
        <IdeasGallery />
      </Modal>
    </div>
  )
}
