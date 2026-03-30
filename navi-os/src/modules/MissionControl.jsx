import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cpu, MessageSquare, Clock, Bot, Sparkles, Moon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import './MissionControl.css'

const MODELS = [
  { id: 'minimax-m2', name: 'MiniMax-M2', provider: 'MiniMax' },
  { id: 'codex-5.3', name: 'Codex 5.3', provider: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google' }
]

function formatDuration(ms) {
  if (!ms) return '—'
  const secs = Math.floor(ms / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `${hours}h ${mins % 60}m`
  if (mins > 0) return `${mins}m`
  return `${secs}s`
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function MissionControl() {
  const [selectedModel, setSelectedModel] = useState('minimax-m2')
  const [sessions, setSessions] = useState([])
  const [activeCount, setActiveCount] = useState(0)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState(null)
  const [cronJobs, setCronJobs] = useState([])
  const [cronLoading, setCronLoading] = useState(true)

  const loadSessions = () => {
    setSessionsLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => {
        setSessions(d.sessions || [])
        setActiveCount(d.activeCount || 0)
        setSessionsLoading(false)
      })
      .catch(() => {
        setSessions([])
        setSessionsLoading(false)
      })
  }

  const loadCronJobs = () => {
    setCronLoading(true)
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(d => {
        setCronJobs(d.jobs || [])
        setCronLoading(false)
      })
      .catch(() => {
        setCronJobs([])
        setCronLoading(false)
      })
  }

  useEffect(() => {
    loadSessions()
    loadCronJobs()
  }, [])

  const toggleSession = (id) => {
    setExpandedSession(expandedSession === id ? null : id)
  }

  // Get active session count
  const activeSessions = sessions.filter(s => s.status === 'running').length

  return (
    <div className="mission-control">
      <div className="mc-header">
        <h2>Mission Control</h2>
        <button className="mc-refresh" onClick={() => { loadSessions(); loadCronJobs() }} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Active Sessions Summary */}
      <div className="mc-section">
        <h3>
          <MessageSquare size={16} />
          Sessions Actives
        </h3>
        <div className="mc-stats">
          <div className="mc-stat">
            <span className="stat-num">{sessionsLoading ? '...' : activeSessions}</span>
            <span className="stat-label">Actives</span>
          </div>
          <div className="mc-stat">
            <span className="stat-num">{sessionsLoading ? '...' : sessions.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Sessions List */}
        <div className="sessions-list">
          {sessionsLoading && sessions.length === 0 && (
            <div className="mc-loading">Carregant sessions...</div>
          )}
          {!sessionsLoading && sessions.length === 0 && (
            <div className="mc-empty">Cap sessio registrada</div>
          )}
          {sessions.map(session => {
            const isExpanded = expandedSession === session.id
            const Icon = session.type === 'subagent' ? Sparkles : (session.type === 'cron' ? Clock : MessageSquare)
            const statusColor = session.status === 'running' ? '#4ade80' : (session.status === 'done' ? '#60a5fa' : '#a0a0b0')
            
            return (
              <div key={session.id} className="session-card">
                <div 
                  className="session-header"
                  onClick={() => toggleSession(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleSession(session.id)}
                >
                  <div className="session-info">
                    <Icon size={18} />
                    <div className="session-text">
                      <span className="session-label">{session.label}</span>
                      <span className="session-type">{session.type}</span>
                    </div>
                  </div>
                  <div className="session-meta">
                    <span 
                      className="session-status-badge"
                      style={{ color: statusColor, background: `${statusColor}20` }}
                    >
                      {session.status}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="session-details">
                    <div className="detail-row">
                      <span>Model:</span>
                      <span>{session.model}</span>
                    </div>
                    <div className="detail-row">
                      <span>Canal:</span>
                      <span>{session.channel}</span>
                    </div>
                    <div className="detail-row">
                      <span>Tokens:</span>
                      <span>{session.totalTokens?.toLocaleString() || 0}</span>
                    </div>
                    <div className="detail-row">
                      <span>Duracio:</span>
                      <span>{formatDuration(session.runtimeMs)}</span>
                    </div>
                    {session.startedAt && (
                      <div className="detail-row">
                        <span>Iniciat:</span>
                        <span>{formatDate(session.startedAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Model Selection */}
      <div className="mc-section">
        <h3>
          <Cpu size={16} />
          Model Actiu
        </h3>
        <div className="model-selector">
          {MODELS.map(model => (
            <button
              key={model.id}
              className={`model-btn ${selectedModel === model.id ? 'active' : ''}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <span className="model-name">{model.name}</span>
              <span className="model-provider">{model.provider}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="mc-section">
        <h3>
          <Clock size={16} />
          Cron Jobs
        </h3>
        <div className="cron-list">
          {cronLoading && cronJobs.length === 0 && (
            <div className="mc-loading">Carregant...</div>
          )}
          {!cronLoading && cronJobs.map(cron => {
            const statusIcon = cron.status === 'healthy' 
              ? <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
              : cron.status === 'failed'
              ? <AlertCircle size={14} style={{ color: '#ff6b6b' }} />
              : <Moon size={14} style={{ color: '#a0a0b0' }} />
            
            return (
              <div key={cron.name} className="cron-item">
                {statusIcon}
                <span className="cron-name">{cron.name}</span>
                <span className="cron-schedule">{cron.nameLabel}</span>
                <span className={`cron-status-text cron-${cron.status}`}>{cron.status}</span>
              </div>
            )
          })}
          {!cronLoading && cronJobs.length === 0 && (
            <div className="mc-empty">Cap cron job configurat</div>
          )}
        </div>
      </div>
    </div>
  )
}