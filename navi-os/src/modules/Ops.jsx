import { useState, useEffect } from 'react'
import {
  Activity, Zap, Link, FolderSync, Shield, Database, Users, LayoutList,
  Moon, CheckCircle2, AlertCircle, MessageSquare, Clock, RefreshCw,
  Server, Brain
} from 'lucide-react'
import TaskPipeline from '../components/TaskPipeline'
import Standups from './Ops/Standups'
import ChiefsCouncil from './Ops/ChiefsCouncil/ChiefsCouncil'
import DeliverableTracker from '../components/DeliverableTracker'
import TaskManager from '../components/TaskManager'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
import Files from '../components/Files'
import Security from '../components/Security'
import Sync from '../components/Sync'
import ProposalsBoard from './Proposals/ProposalsBoard'
import AutomationsBoard from './Ops/Automations/AutomationsBoard'
import './Ops.css'

function formatDate(iso) {
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

function formatRelative(iso) {
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

// ─── Shared OPS blocks ────────────────────────────────────────────────────────

function OvernightSummary() {
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

function SystemModules() {
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

function HealthErrors() {
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

// ─── New OPS primary modules ────────────────────────────────────────────────

function OpsShell({ title, icon: Icon, children, onRefresh }) {
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

function KpiCard({ label, value, tone = 'neutral' }) {
  return (
    <div className={`ops-kpi-card ${tone}`}>
      <span className="ops-kpi-value">{value}</span>
      <span className="ops-kpi-label">{label}</span>
    </div>
  )
}

function formatRuntime(runtimeMs) {
  if (!runtimeMs) return '—'
  const secs = Math.round(runtimeMs / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return rem ? `${mins}m ${rem}s` : `${mins}m`
}

function SessionDetailPanel({ session, onClose }) {
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

function SessionsModule() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [groupBy, setGroupBy] = useState('none')
  const [selectedSession, setSelectedSession] = useState(null)

  const loadSessions = () => {
    setLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const active = sessions.filter(s => s.status === 'running' || s.status === 'active').length
  const mainCount = sessions.filter(s => s.type === 'main').length
  const subagents = sessions.filter(s => s.type === 'subagent').length
  const cronCount = sessions.filter(s => s.type === 'cron').length
  const statuses = Array.from(new Set(sessions.map(s => s.status || 'unknown')))
  const channels = Array.from(new Set(sessions.map(s => s.channel || '—')))

  const filtered = sessions.filter(session => {
    if (typeFilter !== 'all' && (session.type || 'main') !== typeFilter) return false
    if (statusFilter !== 'all' && (session.status || 'unknown') !== statusFilter) return false
    if (channelFilter !== 'all' && (session.channel || '—') !== channelFilter) return false
    return true
  })

  const groupedSessions = filtered.reduce((acc, session) => {
    const key = groupBy === 'type'
      ? (session.type || 'main')
      : groupBy === 'status'
        ? (session.status || 'unknown')
        : groupBy === 'channel'
          ? (session.channel || '—')
          : 'Totes les sessions'
    if (!acc[key]) acc[key] = []
    acc[key].push(session)
    return acc
  }, {})

  return (
    <OpsShell title="Sessions" icon={MessageSquare} onRefresh={loadSessions}>
      <div className="ops-kpi-grid">
        <KpiCard label="Totals" value={sessions.length} tone="amber" />
        <KpiCard label="Actives" value={active} tone="green" />
        <KpiCard label="Subagents" value={subagents} tone="sky" />
        <KpiCard label="Cron" value={cronCount} tone="violet" />
      </div>

      <div className="ops-filter-tabs">
        {[
          ['all', 'Totes'],
          ['main', 'Main'],
          ['subagent', 'Subagents'],
          ['cron', 'Cron'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`ops-filter-tab ${typeFilter === id ? 'active' : ''}`}
            onClick={() => setTypeFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ops-session-controls">
        <label>
          <span>Estat</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tots</option>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          <span>Canal</span>
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
            <option value="all">Tots</option>
            {channels.map(channel => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>
        <label>
          <span>Agrupar per</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="none">Sense agrupació</option>
            <option value="type">Tipus</option>
            <option value="status">Estat</option>
            <option value="channel">Canal</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="ops-empty-state">Carregant sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-state">No hi ha sessions per mostrar</div>
      ) : (
        <div className="ops-grouped-sections">
          {Object.entries(groupedSessions).map(([group, groupSessions]) => (
            <section key={group} className="ops-session-group">
              {groupBy !== 'none' && <div className="ops-group-title">{group} · {groupSessions.length}</div>}
              <div className="ops-list-stack">
                {groupSessions.map(session => (
                  <button key={session.id} className="ops-list-card ops-session-card" onClick={() => setSelectedSession(session)}>
                    <div className="ops-list-top">
                      <div>
                        <div className="ops-list-title">{session.label || session.id}</div>
                        <div className="ops-list-subtitle">{session.channel || 'sense canal'} · {session.model || 'sense model'}</div>
                      </div>
                      <span className={`ops-status-pill ${session.status || 'unknown'}`}>{session.status || 'unknown'}</span>
                    </div>
                    <div className="ops-meta-grid compact">
                      <div><span>Tipus</span><strong>{session.type || 'main'}</strong></div>
                      <div><span>Inici</span><strong>{formatDate(session.startedAt)}</strong></div>
                      <div><span>Tokens</span><strong>{(session.totalTokens || 0).toLocaleString()}</strong></div>
                      <div><span>Runtime</span><strong>{formatRuntime(session.runtimeMs)}</strong></div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="ops-module-footer-note">Main: {mainCount} · Sessions vives: {active}</div>

      {selectedSession && <SessionDetailPanel session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </OpsShell>
  )
}

function CronModule() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadCron = () => {
    setLoading(true)
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(d => setJobs(d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCron()
  }, [])

  const healthy = jobs.filter(j => j.status === 'healthy').length
  const failed = jobs.filter(j => j.status === 'failed').length
  const disabled = jobs.filter(j => j.status === 'disabled').length

  return (
    <OpsShell title="Cron Manager" icon={Clock} onRefresh={loadCron}>
      <div className="ops-kpi-grid">
        <KpiCard label="Jobs" value={jobs.length} tone="amber" />
        <KpiCard label="Actius" value={healthy} tone="green" />
        <KpiCard label="Errors" value={failed} tone={failed > 0 ? 'red' : 'neutral'} />
        <KpiCard label="Desactivats" value={disabled} tone="neutral" />
      </div>

      {loading ? (
        <div className="ops-empty-state">Carregant crons...</div>
      ) : jobs.length === 0 ? (
        <div className="ops-empty-state">No hi ha cron jobs detectats</div>
      ) : (
        <div className="ops-cron-grid">
          {jobs.map(job => (
            <article key={job.name} className={`ops-cron-card modern ${job.status}`}>
              <div className="ops-cron-topbar">
                <span className="ops-cron-kind">{job.scheduleKind || 'cron'}</span>
                <span className={`ops-status-pill ${job.status}`}>{job.status}</span>
              </div>

              <div className="ops-cron-name">{job.name}</div>
              <div className="ops-cron-subtitle">{job.scheduleLabel || job.nameLabel || 'Schedule no disponible'}</div>

              <div className="ops-cron-meta-cards">
                <div className="ops-cron-meta-card">
                  <span>Ultima execucio</span>
                  <strong>{formatDate(job.lastRun)}</strong>
                  <em>{formatRelative(job.lastRun)}</em>
                </div>
                <div className="ops-cron-meta-card">
                  <span>Seguent execucio</span>
                  <strong>{formatDate(job.nextRun)}</strong>
                  <em>{job.nextRun ? 'programada' : 'sense dada'}</em>
                </div>
              </div>

              <div className="ops-cron-footer-row cron-three">
                <div className="ops-cron-footer-item">
                  <span>Tipus</span>
                  <strong>{job.scheduleType || job.scheduleKind || '—'}</strong>
                </div>
                <div className="ops-cron-footer-item">
                  <span>Timezone</span>
                  <strong>{job.timezone || 'UTC'}</strong>
                </div>
                <div className="ops-cron-footer-item">
                  <span>Expressio</span>
                  <strong>{job.scheduleExpr || (job.intervalMs ? `${Math.round(job.intervalMs / 60000)} min` : '—')}</strong>
                </div>
              </div>

              {job.error && (
                <div className="ops-error-box cron-inline">
                  <span className="ops-error-label">Ultim error</span>
                  <code>{job.error}</code>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </OpsShell>
  )
}

function ActivityModule({ onOpenTool }) {
  const [logs, setLogs] = useState([])
  const [pm2, setPm2] = useState([])
  const [loading, setLoading] = useState(true)

  const loadActivity = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/logs').then(r => r.json()).catch(() => ({ logs: [] })),
      fetch('/api/pm2-status').then(r => r.json()).catch(() => ({ processes: [] })),
    ])
      .then(([logData, pm2Data]) => {
        setLogs(logData.logs || [])
        setPm2(pm2Data.processes || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadActivity()
  }, [])

  const quickTools = [
    ['orgchart', 'Org Chart', Users],
    ['pipeline', 'PM Board', LayoutList],
    ['manager', 'Task Manager', Activity],
    ['files', 'Files', FolderSync],
    ['sync', 'Sync', Database],
    ['security', 'Security', Shield],
    ['automation', 'Automations', Zap],
    ['chiefs', 'Chiefs Council', MessageSquare],
    ['standups', 'Standups', Users],
    ['integration', 'Integrations', Link],
  ]

  return (
    <OpsShell title="Activity" icon={Brain} onRefresh={loadActivity}>
      <HealthErrors />
      <SystemModules />

      <div className="ops-activity-grid">
        <div className="ops-panel-box">
          <div className="ops-panel-box-header">PM2</div>
          {loading ? (
            <div className="ops-empty-state small">Carregant...</div>
          ) : pm2.length === 0 ? (
            <div className="ops-empty-state small">Sense processos</div>
          ) : (
            <div className="ops-mini-list">
              {pm2.map(proc => (
                <div key={proc.name} className="ops-mini-row">
                  <div>
                    <strong>{proc.name}</strong>
                    <span>{proc.uptime ? `${Math.round(proc.uptime / 1000)}s uptime` : '—'}</span>
                  </div>
                  <span className={`ops-status-pill ${proc.status}`}>{proc.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ops-panel-box">
          <div className="ops-panel-box-header">Logs recents</div>
          {loading ? (
            <div className="ops-empty-state small">Carregant...</div>
          ) : logs.length === 0 ? (
            <div className="ops-empty-state small">Sense logs recents</div>
          ) : (
            <div className="ops-mini-list">
              {logs.slice(0, 8).map(log => (
                <div key={log.file} className="ops-mini-row vertical">
                  <div>
                    <strong>{log.title}</strong>
                    <span>{log.type} · {log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ops-tools-section">
        <div className="ops-tools-title">Eines OPS</div>
        <div className="ops-tools-grid">
          {quickTools.map(([id, label, Icon]) => (
            <button key={id} className="ops-tool-card" onClick={() => onOpenTool(id)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </OpsShell>
  )
}

function IntegrationView() {
  return (
    <div className="placeholder-view">
      <div className="placeholder-icon"><Link size={48} className="amber" /></div>
      <h2>Integracions</h2>
      <p>Connexions externes: API, webhooks i serveis de tercers.</p>
    </div>
  )
}

export default function Ops() {
  const [viewMode, setViewMode] = useState('mission')
  const [activeSessionsCount, setActiveSessionsCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const loadActiveCount = () => {
      fetch('/api/sessions')
        .then(r => r.json())
        .then(d => {
          if (!cancelled) setActiveSessionsCount(d.activeCount || 0)
        })
        .catch(() => {
          if (!cancelled) setActiveSessionsCount(0)
        })
    }

    loadActiveCount()
    const interval = setInterval(loadActiveCount, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const primaryTabs = [
    { id: 'mission', label: 'Mission Control', badge: activeSessionsCount > 0 ? activeSessionsCount : null },
    { id: 'sessions', label: 'Sessions' },
    { id: 'cron', label: 'Cron' },
    { id: 'activity', label: 'Activity' },
  ]

  const utilityTabs = [
    ['orgchart', 'Org Chart', Users],
    ['pipeline', 'PM Board', LayoutList],
    ['manager', 'Task Manager', Activity],
    ['files', 'Files', FolderSync],
    ['sync', 'Sync', Database],
    ['security', 'Security', Shield],
    ['automation', 'Automations', Zap],
    ['integration', 'Integrations', Link],
    ['chiefs', 'Chiefs Council', MessageSquare],
    ['standups', 'Standups', Users],
  ]

  const renderPrimary = () => {
    if (viewMode === 'mission') return (
      <>
        <OvernightSummary />
        <MissionControl />
      </>
    )
    if (viewMode === 'sessions') return <SessionsModule />
    if (viewMode === 'cron') return <CronModule />
    if (viewMode === 'activity') return <ActivityModule onOpenTool={setViewMode} />
    return null
  }

  const renderUtility = () => {
    if (viewMode === 'orgchart') return <OrgChart />
    if (viewMode === 'pipeline') return (
      <>
        <TaskPipeline />
        <ProposalsBoard />
        <DeliverableTracker />
      </>
    )
    if (viewMode === 'manager') return <TaskManager />
    if (viewMode === 'files') return <Files />
    if (viewMode === 'sync') return <Sync />
    if (viewMode === 'security') return <Security />
    if (viewMode === 'automation') return <AutomationsBoard />
    if (viewMode === 'integration') return <IntegrationView />
    if (viewMode === 'chiefs') return <ChiefsCouncil />
    if (viewMode === 'standups') return <Standups />
    return null
  }

  const isPrimary = primaryTabs.some(tab => tab.id === viewMode)

  return (
    <div className="module-view ops">
      <h1 className="dashboard-title amber neon-amber">Operacions</h1>

      <div className="ops-primary-tabs">
        {primaryTabs.map(tab => (
          <button
            key={tab.id}
            className={`ops-primary-tab ${viewMode === tab.id ? 'active' : ''}`}
            onClick={() => setViewMode(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge ? <span className="ops-tab-badge" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>

      {isPrimary ? renderPrimary() : renderUtility()}

      <div className="ops-secondary-toolbar">
        <div className="ops-secondary-title">Utilitats OPS</div>
        <div className="ops-toggles compact">
          {utilityTabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`toggle-btn ${viewMode === id ? 'active' : ''}`}
              onClick={() => setViewMode(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
