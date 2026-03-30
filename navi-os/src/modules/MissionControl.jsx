import { useState, useEffect, useCallback } from 'react'
import {
  ChevronDown, ChevronUp, ChevronRight, Cpu, MessageSquare, Clock, Bot, Sparkles,
  Moon, RefreshCw, CheckCircle2, AlertCircle, Loader2, Wifi, WifiOff,
  Globe, Send, User, Zap
} from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import './MissionControl.css'

const API_BASE = '/api'

function formatDuration(ms) {
  if (!ms) return '—'
  const secs = Math.floor(ms / 1000)
  const mins = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  if (hours > 0) return `${hours}h ${mins % 60}m`
  if (mins > 0) return `${mins}m`
  return `${secs}s`
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

function renderMarkdown(text) {
  if (!text) return null
  try {
    const html = marked.parse(text)
    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  } catch { return <p>{text}</p> }
}

// ─── Session Message ──────────────────────────────────────────────────────────

function SessionMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`session-message ${isUser ? 'user' : 'agent'}`}>
      <div className="message-avatar">
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className="message-body">
        <span className="message-role">{isUser ? 'Tu' : message.role}</span>
        <div className="message-content">
          {typeof message.content === 'string'
            ? renderMarkdown(message.content)
            : Array.isArray(message.content)
              ? message.content.map((block, i) => (
                  block.type === 'text' ? <p key={i}>{block.text}</p> : null
                ))
              : <p>{String(message.content)}</p>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────

function SessionDetail({ session, onBack }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/session/${session.id}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session.id])

  return (
    <div className="session-detail">
      <div className="session-detail-header">
        <button className="detail-back-btn" onClick={onBack}>← Enrere</button>
        <div className="session-detail-title">
          <Bot size={18} />
          <span>{session.label || session.id}</span>
          <span className={`session-type-badge ${session.type || 'main'}`}>{session.type || 'main'}</span>
        </div>
      </div>

      <div className="session-meta-row">
        <span>Canal: <strong>{session.channel || '—'}</strong></span>
        <span>Model: <strong>{session.model || '—'}</strong></span>
        <span>Tokens: <strong>{(session.totalTokens || 0).toLocaleString()}</strong></span>
        <span>Duracio: <strong>{formatDuration(session.runtimeMs)}</strong></span>
      </div>

      <div className="session-messages">
        {loading ? (
          <div className="session-loading"><Loader2 size={18} className="spin" /> Carregant missatges...</div>
        ) : messages.length === 0 ? (
          <div className="session-empty">No hi ha missatges registrats per a aquesta sessio</div>
        ) : (
          messages.map((msg, i) => (
            <SessionMessage key={i} message={msg} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Active Sessions Section ───────────────────────────────────────────────────

function ActiveSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedSession] = useState(null)
  const [detailSession, setDetailSession] = useState(null)

  const loadSessions = () => {
    setLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => {
        setSessions(d.sessions || [])
        setLoading(false)
      })
      .catch(() => {
        setSessions([])
        setLoading(false)
      })
  }

  useEffect(() => { loadSessions() }, [])

  const activeSessions = sessions.filter(s => s.status === 'running' || s.status === 'active')
  const inactiveSessions = sessions.filter(s => s.status !== 'running' && s.status !== 'active')

  if (detailSession) {
    return <SessionDetail session={detailSession} onBack={() => setDetailSession(null)} />
  }

  return (
    <div className="mc-section">
      <h3><MessageSquare size={16} /> Sessions Actives</h3>
      <div className="mc-stats">
        <div className="mc-stat">
          <span className="stat-num">{loading ? '...' : activeSessions.length}</span>
          <span className="stat-label">Actives</span>
        </div>
        <div className="mc-stat">
          <span className="stat-num">{loading ? '...' : sessions.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {activeSessions.map(session => {
        const isExpanded = expandedSession === session.id
        const Icon = session.type === 'subagent' ? Sparkles : (session.type === 'cron' ? Clock : MessageSquare)
        const statusColor = session.status === 'running' ? '#4ade80' : (session.status === 'done' ? '#60a5fa' : '#a0a0b0')

        return (
          <div key={session.id} className="session-card">
            <div
              className="session-header"
              onClick={() => setDetailSession(session)}
              role="button"
              tabIndex={0}
            >
              <div className="session-info">
                <Icon size={18} />
                <div className="session-text">
                  <span className="session-label">{session.label || session.id}</span>
                  <span className="session-type">{session.type || 'main'}</span>
                </div>
              </div>
              <div className="session-meta">
                <span
                  className="session-status-badge"
                  style={{ color: statusColor, background: `${statusColor}20` }}
                >
                  {session.status}
                </span>
                <ChevronRight size={16} />
              </div>
            </div>
            {isExpanded && (
              <div className="session-details" onClick={e => e.stopPropagation()}>
                <div className="detail-row"><span>Model:</span><span>{session.model}</span></div>
                <div className="detail-row"><span>Canal:</span><span>{session.channel}</span></div>
                <div className="detail-row"><span>Tokens:</span><span>{session.totalTokens?.toLocaleString() || 0}</span></div>
                <div className="detail-row"><span>Duracio:</span><span>{formatDuration(session.runtimeMs)}</span></div>
                {session.startedAt && <div className="detail-row"><span>Iniciat:</span><span>{formatDate(session.startedAt)}</span></div>}
              </div>
            )}
          </div>
        )
      })}

      {inactiveSessions.length > 0 && (
        <>
          <h4 className="subsection-title">Sessions anteriors</h4>
          {inactiveSessions.slice(0, 5).map(session => {
            const Icon = session.type === 'subagent' ? Sparkles : (session.type === 'cron' ? Clock : MessageSquare)
            return (
              <div key={session.id} className="session-card past" onClick={() => setDetailSession(session)}>
                <div className="session-header">
                  <div className="session-info">
                    <Icon size={16} style={{ opacity: 0.5 }} />
                    <div className="session-text">
                      <span className="session-label">{session.label || session.id}</span>
                      <span className="session-type">{formatDate(session.startedAt || session.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ opacity: 0.3 }} />
                </div>
              </div>
            )
          })}
        </>
      )}

      {!loading && sessions.length === 0 && (
        <div className="mc-empty">Cap sessio registrada</div>
      )}
    </div>
  )
}

// ─── Model Selector ────────────────────────────────────────────────────────────

function ModelSelector() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setModels([
      { id: 'minimax-m2', name: 'MiniMax-M2', provider: 'MiniMax', status: 'available' },
      { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', status: 'unknown' },
      { id: 'gemini-3', name: 'Gemini 3 Pro', provider: 'Google', status: 'unknown' },
    ])
    setSelectedModel('minimax-m2')
    setLoading(false)
  }, [])

  const getStatusIcon = (status) => {
    if (status === 'available') return <CheckCircle2 size={12} style={{ color: '#30d158' }} />
    if (status === 'unavailable') return <WifiOff size={12} style={{ color: '#ff453a' }} />
    return <Wifi size={12} style={{ color: '#ffb800' }} />
  }

  return (
    <div className="mc-section">
      <h3><Cpu size={16} /> Model Actiu</h3>
      {loading ? (
        <div className="mc-loading"><Loader2 size={16} className="spin" /></div>
      ) : (
        <div className="model-selector">
          {models.map(model => (
            <button
              key={model.id}
              className={`model-btn ${selectedModel === model.id ? 'active' : ''}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="model-info">
                <span className="model-name">{model.name}</span>
                <span className="model-provider">{model.provider}</span>
              </div>
              <div className="model-right">
                {getStatusIcon(model.status)}
                {selectedModel === model.id && <CheckCircle2 size={14} style={{ color: '#ffb800' }} />}
              </div>
            </button>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 20 }}><Globe size={16} /> Serveis externs</h3>
      <div className="services-grid">
        <div className="service-item">
          <div className="service-info">
            <span className="service-name">OpenClaw Gateway</span>
            <span className="service-url">local control ui</span>
          </div>
          <div className="service-status">
            <span className="service-up"><CheckCircle2 size={12} /> UP</span>
          </div>
        </div>
        <div className="service-item">
          <div className="service-info">
            <span className="service-name">MiniMax API</span>
            <span className="service-url">estat no verificat des del navegador</span>
          </div>
          <div className="service-status">
            <span className="service-unknown"><Wifi size={12} /> Unknown</span>
          </div>
        </div>
        <div className="service-item">
          <div className="service-info">
            <span className="service-name">Google AI</span>
            <span className="service-url">estat no verificat des del navegador</span>
          </div>
          <div className="service-status">
            <span className="service-unknown"><Wifi size={12} /> Unknown</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceStatusItem({ service }) {
  const [status, setStatus] = useState(null) // null=unknown, true=up, false=down

  const checkService = useCallback(async () => {
    setStatus(null)
    try {
      // Try a simple fetch with short timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(service.url, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeout)
      setStatus(res.ok)
    } catch {
      setStatus(false)
    }
  }, [service.url])

  useEffect(() => {
    if (service.check === 'gateway') {
      setStatus(true) // local gateway is always available if we're talking to it
    } else {
      checkService()
    }
  }, [service.check, checkService])

  return (
    <div className="service-item">
      <div className="service-info">
        <span className="service-name">{service.name}</span>
        <span className="service-url">{service.url}</span>
      </div>
      <div className="service-status">
        {status === null && <Loader2 size={12} className="spin" style={{ color: '#ffb800' }} />}
        {status === true && <span className="service-up"><CheckCircle2 size={12} /> UP</span>}
        {status === false && <span className="service-down"><WifiOff size={12} /> DOWN</span>}
      </div>
    </div>
  )
}

// ─── Mission Control ───────────────────────────────────────────────────────────

export default function MissionControl() {
  return (
    <div className="mission-control">
      <ActiveSessions />
      <ModelSelector />
    </div>
  )
}