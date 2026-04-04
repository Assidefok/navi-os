// Shared components and utilities for Ops modules
import { useState, useEffect } from 'react'
import {
  Moon, CheckCircle2, AlertCircle, MessageSquare, Clock,
  RefreshCw, Server, Users, LayoutList, Activity, FolderSync,
  Shield, Zap, Link, Brain,
} from 'lucide-react'

// ─── Utility functions ────────────────────────────────────────────────────────

export function formatDate(iso) {
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

export function formatRelative(iso) {
  if (!iso) return '—'
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (mins < 1) return 'ara mateix'
    if (mins < 60) return `fa ${mins} min`
    if (hours < 24) return `fa ${hours} h`
    return `fa ${days} d`
  } catch {
    return '—'
  }
}

export function formatRuntime(runtimeMs) {
  if (!runtimeMs) return '—'
  const secs = Math.round(runtimeMs / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return rem ? `${mins}m ${rem}s` : `${mins}m`
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

export function OpsShell({ title, icon: Icon, children, onRefresh }) {
  return (
    <section className="ops-module-shell">
      <div className="ops-module-header">
        <div className="ops-module-title-wrap">
          <div className="ops-module-icon"><Icon size={18} /></div>
          <div>
            <h2 className="ops-module-title">{title}</h2>
          </div>
        </div>
        {onRefresh && (
          <button className="ops-refresh-btn" onClick={onRefresh}>
            <RefreshCw size={14} /> Actualitzar
          </button>
        )}
      </div>
      <div className="ops-module-content">{children}</div>
    </section>
  )
}

export function KpiCard({ label, value, tone = 'neutral' }) {
  return (
    <div className={`ops-kpi-card ${tone}`}>
      <span className="ops-kpi-value">{value}</span>
      <span className="ops-kpi-label">{label}</span>
    </div>
  )
}

export function SystemModules() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
  }, [])

  const modules = [
    { name: 'Gateway', status: 'operational', desc: 'OpenClaw Gateway' },
    { name: 'Sessions', status: sessions.length > 0 ? 'operational' : 'idle', desc: `${sessions.length} sessio(ns)` },
    { name: 'Files', status: 'operational', desc: 'Workspace' },
    { name: 'Cron', status: 'operational', desc: 'Tasques programades' },
    { name: 'Memory', status: 'operational', desc: 'Base de coneixement' },
  ]

  return (
    <div className="system-modules">
      <h3 className="system-modules-title"><Server size={14} /> Moduls del sistema</h3>
      <div className="system-modules-grid">
        {modules.map(mod => (
          <div key={mod.name} className={`system-module-card ${mod.status}`}>
            <div className="module-status-dot" />
            <span className="module-name">{mod.name}</span>
            <span className="module-desc">{mod.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HealthErrors() {
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(data => {
        const allErrors = (data.jobs || [])
          .filter(j => j.status === 'failed')
          .map(j => ({
            source: 'Cron',
            name: j.name,
            message: j.error || 'Job failed',
            severity: 'error',
            time: j.lastRun,
          }))
        setErrors(allErrors)
        setLoading(false)
      })
      .catch(() => {
        setErrors([])
        setLoading(false)
      })
  }, [])

  const formatTime = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('ca-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  if (loading) return null

  return (
    <div className="health-errors">
      <div className="health-errors-header">
        <AlertCircle size={16} style={{ color: errors.length > 0 ? '#ff453a' : '#30d158' }} />
        <h3>Resum d'errors</h3>
        <span className="errors-count">{errors.length} error(s)</span>
      </div>
      {errors.length === 0 ? (
        <div className="health-errors-empty">
          <CheckCircle2 size={20} style={{ color: '#30d158' }} />
          <span>Cap error detectat al sistema</span>
        </div>
      ) : (
        <div className="errors-list">
          {errors.map((err, i) => (
            <div key={i} className={`error-item ${err.severity}`}>
              <div className="error-header">
                <span className="error-source">{err.source}</span>
                <span className="error-name">{err.name}</span>
                <span className="error-time">{formatTime(err.time)}</span>
              </div>
              <p className="error-message">{err.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function OvernightSummary() {
  const [cronJobs, setCronJobs] = useState([])

  useEffect(() => {
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(d => { setCronJobs(d.jobs || []) })
      .catch(() => {})
  }, [])

  const now = new Date()
  const since10pm = new Date(now)
  since10pm.setHours(22, 0, 0, 0)
  if (now.getHours() < 10) since10pm.setDate(since10pm.getDate() - 1)

  const recentJobs = cronJobs.filter(j => {
    if (!j.lastRun) return false
    return new Date(j.lastRun) >= since10pm
  })

  const healthy = recentJobs.filter(j => j.status === 'healthy').length
  const failed = recentJobs.filter(j => j.status === 'failed').length

  const formatTime = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  return (
    <div className="overnight-summary">
      <div className="summary-header">
        <Moon size={16} className="amber" />
        <h3>Resum Overnight (des de les 22h)</h3>
      </div>
      <div className="summary-stats">
        <span className="summary-stat">
          <CheckCircle2 size={14} className="green" /> {healthy} executats
        </span>
        <span className="summary-stat">
          {failed > 0
            ? <><AlertCircle size={14} className="red" /> {failed} fallits</>
            : <><CheckCircle2 size={14} className="green" /> Tots ok</>
          }
        </span>
      </div>
      <div className="summary-jobs">
        {cronJobs.slice(0, 4).map(job => (
          <div key={job.name} className={`summary-job ${job.status}`}>
            <span className="job-name">{job.name}</span>
            <span className="job-time">{formatTime(job.lastRun)}</span>
            <span className={`job-status ${job.status}`}>
              {job.status === 'healthy' ? '✓' : job.status === 'failed' ? '✗' : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sessions module helpers ──────────────────────────────────────────────────

export function getSessionBucket(session) {
  if (session.type === 'cron') {
    return { bucketKey: 'cron', bucketLabel: 'Cron', laneKey: `cron:${session.label}`, laneLabel: session.label || 'Cron job' }
  }

  if (session.type === 'subagent') {
    return { bucketKey: 'subagent', bucketLabel: 'Subagents', laneKey: 'subagent', laneLabel: 'Subagents' }
  }

  if (session.channel === 'telegram') {
    const threadFromId = session.id?.match(/:thread:[^:]+:(\d+)/)?.[1]
    const threadFromLabel = session.label?.match(/thread\s+(\d+)/i)?.[1]
    const thread = threadFromId || threadFromLabel || null
    return {
      bucketKey: 'telegram',
      bucketLabel: 'Telegram',
      laneKey: thread ? `telegram:${thread}` : 'telegram:main',
      laneLabel: thread ? `Thread ${thread}` : 'Telegram principal',
    }
  }

  if (session.channel === 'webchat') {
    return { bucketKey: 'webchat', bucketLabel: 'Web', laneKey: 'webchat', laneLabel: 'Webchat' }
  }

  if (session.type === 'main') {
    const channel = session.channel || 'main'
    return {
      bucketKey: channel,
      bucketLabel: channel === 'system' ? 'Sistema' : channel.charAt(0).toUpperCase() + channel.slice(1),
      laneKey: channel,
      laneLabel: channel === 'system' ? 'Sistema' : channel,
    }
  }

  return { bucketKey: 'other', bucketLabel: 'Altres', laneKey: 'other', laneLabel: 'Altres' }
}

export function SessionDetailPanel({ session, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.id) return
    setLoading(true)
    fetch(`/api/session/${encodeURIComponent(session.id)}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [session?.id])

  return (
    <div className="ops-session-detail-overlay" onClick={onClose}>
      <div className="ops-session-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="ops-session-detail-header">
          <div>
            <div className="ops-list-title">{session.label || session.id}</div>
            <div className="ops-list-subtitle">{session.id}</div>
          </div>
          <button className="ops-detail-close" onClick={onClose}>×</button>
        </div>

        <div className="ops-meta-grid compact ops-session-detail-meta">
          <div><span>Tipus</span><strong>{session.type || 'main'}</strong></div>
          <div><span>Estat</span><strong>{session.status || 'unknown'}</strong></div>
          <div><span>Canal</span><strong>{session.channel || '—'}</strong></div>
          <div><span>Model</span><strong>{session.model || '—'}</strong></div>
          <div><span>Inici</span><strong>{formatDate(session.startedAt)}</strong></div>
          <div><span>Fi</span><strong>{formatDate(session.endedAt)}</strong></div>
          <div><span>Tokens</span><strong>{(session.totalTokens || 0).toLocaleString()}</strong></div>
          <div><span>Runtime</span><strong>{formatRuntime(session.runtimeMs)}</strong></div>
        </div>

        <div className="ops-session-messages-block">
          <div className="ops-session-messages-title">Missatges recents</div>
          {loading ? (
            <div className="ops-empty-state small">Carregant missatges...</div>
          ) : messages.length === 0 ? (
            <div className="ops-empty-state small">No hi ha missatges registrats</div>
          ) : (
            <div className="ops-session-messages-list">
              {messages.slice(-20).map((message, idx) => (
                <div key={idx} className={`ops-session-message ${message.role || 'unknown'}`}>
                  <div className="ops-session-message-meta">
                    <span className="ops-session-message-role">{message.role || 'unknown'}</span>
                    <span className="ops-session-message-time">{formatDate(message.timestamp)}</span>
                  </div>
                  <div className="ops-session-message-content">{String(message.content || '').slice(0, 1400) || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
