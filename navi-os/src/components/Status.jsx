import { useState, useEffect } from 'react'
import {
  Cpu, HardDrive, Wifi, Clock, Activity, Bot, CheckCircle2,
  XCircle, Loader2, Server, Database, RefreshCw
} from 'lucide-react'
import './Status.css'

function MetricCard({ label, value, sub, color = 'amber', icon }) {
  const Icon = icon
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-icon"><Icon size={18} /></div>
      <div className="metric-body">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
        {sub && <span className="metric-sub">{sub}</span>}
      </div>
    </div>
  )
}

function SystemStatus() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system-metrics')
      const data = await res.json()
      setMetrics(data)
    } catch {
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading && !metrics) {
    return <div className="status-loading"><Loader2 size={20} className="spin" /> Carregant...</div>
  }

  const cpuVal = metrics?.cpu ? `${metrics.cpu.toFixed(1)}%` : '—'
  const memUsed = metrics?.memory?.used || 0
  const memTotal = metrics?.memory?.total || 1
  const memPct = Math.round((memUsed / memTotal) * 100)
  const memVal = metrics?.memory ? `${memUsed}MB / ${memTotal}MB` : '—'
  const diskVal = metrics?.disk ? `${metrics.disk.used}% (${metrics.disk.free} free)` : '—'

  return (
    <div className="status-section">
      <h3 className="section-title"><Server size={14} /> Sistema</h3>
      <div className="metrics-grid">
        <MetricCard icon={Cpu} label="CPU" value={cpuVal} color="amber" />
        <MetricCard icon={HardDrive} label="Memoria" value={memVal} sub={`${memPct}% utilitzada`} color="sky" />
        <MetricCard icon={Database} label="Disc" value={diskVal} color="green" />
      </div>
      <button className="refresh-btn" onClick={fetchMetrics}>
        <RefreshCw size={14} /> Actualitzar
      </button>
    </div>
  )
}

function AgentStatus() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => setAgents(d.agents || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="status-section">
      <h3 className="section-title"><Bot size={14} /> Agents</h3>
      <div className="agents-list">
        {agents.length === 0 && <span className="empty-state">Cap agent actiu</span>}
        {agents.map(agent => (
          <div key={agent.id} className="agent-row">
            <span className={`agent-status-dot ${agent.status}`} />
            <span className="agent-name">{agent.name || agent.id}</span>
            <span className="agent-role">{agent.role || '—'}</span>
            <span className="agent-uptime">{agent.uptime || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionStatus() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionFilter, setSessionFilter] = useState('all')

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const filterTabs = [
    { id: 'all', label: 'Totes' },
    { id: 'main', label: 'Main' },
    { id: 'subagent', label: 'Subagents' },
    { id: 'cron', label: 'Cron' },
  ]

  const filteredSessions = sessionFilter === 'all'
    ? sessions
    : sessions.filter(s => s.type === sessionFilter)

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="status-section">
      <h3 className="section-title"><Activity size={14} /> Sessions</h3>
      <div className="session-filter-tabs">
        {filterTabs.map(ft => (
          <button
            key={ft.id}
            className={`session-filter-tab ${sessionFilter === ft.id ? 'active' : ''}`}
            onClick={() => setSessionFilter(ft.id)}
          >
            {ft.label}
          </button>
        ))}
      </div>
      <div className="sessions-list">
        {filteredSessions.length === 0 && <span className="empty-state">Cap sessio activa</span>}
        {filteredSessions.map(s => (
          <div key={s.id} className={`session-row ${s.type === 'subagent' ? 'session-row-subagent' : ''}`}>
            {s.type === 'subagent' && (
              <span className="session-label">{s.label || '—'}</span>
            )}
            {s.type !== 'subagent' && (
              <span className="session-id">{s.id?.slice(0, 12) || '—'}</span>
            )}
            <span className={`session-type-badge ${s.type}`}>{s.type || 'main'}</span>
            <span className="session-model">{s.model || '—'}</span>
            <span className="session-channel">{s.channel || '—'}</span>
            <span className="session-duration">{s.duration || s.elapsed || '—'}</span>
            <span className={`session-status ${s.status}`}>{s.status || 'active'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CronStatus() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(d => setJobs(d.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  const healthy = jobs.filter(j => j.status === 'healthy').length
  const failed = jobs.filter(j => j.status === 'failed').length

  return (
    <div className="status-section">
      <h3 className="section-title"><Clock size={14} /> Cron Jobs</h3>
      <div className="cron-summary">
        <span className="cron-stat green"><CheckCircle2 size={13} /> {healthy} ok</span>
        {failed > 0 && <span className="cron-stat red"><XCircle size={13} /> {failed} fallits</span>}
      </div>
      <div className="cron-list">
        {jobs.map(job => (
          <div key={job.name} className={`cron-row ${job.status}`}>
            <span className="cron-name">{job.name}</span>
            <span className="cron-schedule">{job.schedule || '—'}</span>
            <span className={`cron-status-badge ${job.status}`}>{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pm2Status() {
  const [pm2, setPm2] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPm2 = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pm2-status')
      const data = await res.json()
      setPm2(data.processes || [])
    } catch {
      setPm2([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPm2()
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  const formatBytes = (bytes) => {
    if (!bytes) return '0 MB'
    const mb = Math.round(bytes / 1024 / 1024)
    return `${mb} MB`
  }

  const formatUptime = (ms) => {
    if (!ms) return '—'
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)
    if (hours > 0) return `${hours}h ${mins % 60}m`
    if (mins > 0) return `${mins}m`
    return `${secs}s`
  }

  return (
    <div className="status-section">
      <h3 className="section-title"><Server size={14} /> PM2 Processos</h3>
      <div className="pm2-list">
        {pm2.length === 0 && <span className="empty-state">Cap procés PM2</span>}
        {pm2.map(proc => (
          <div key={proc.name} className={`pm2-row ${proc.status}`}>
            <div className="pm2-header">
              <span className="pm2-name">{proc.name}</span>
              <span className={`pm2-status-badge ${proc.status}`}>{proc.status}</span>
            </div>
            <div className="pm2-metrics">
              <span>CPU: {proc.cpu}%</span>
              <span>RAM: {formatBytes(proc.memory)}</span>
              <span>Reinici: {proc.restarts}</span>
              <span>Uptime: {formatUptime(proc.uptime)}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="refresh-btn" onClick={fetchPm2}>
        <RefreshCw size={14} /> Actualitzar
      </button>
    </div>
  )
}

function IntegrationStatus() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(d => setIntegrations(d.integrations || []))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="status-section">
      <h3 className="section-title"><Wifi size={14} /> Integracions</h3>
      <div className="integrations-list">
        {integrations.length === 0 && (
          <div className="integration-row">
            <span className="integration-name">OpenClaw Gateway</span>
            <span className="integration-status connected">connectat</span>
          </div>
        )}
        {integrations.map(int => (
          <div key={int.name} className="integration-row">
            <span className="integration-name">{int.name}</span>
            <span className={`integration-status ${int.status}`}>{int.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Status() {
  const [activeTab, setActiveTab] = useState('system')

  const tabs = [
    { id: 'system', label: 'Sistema' },
    { id: 'pm2', label: 'PM2' },
    { id: 'agents', label: 'Agents' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'cron', label: 'Cron' },
    { id: 'integrations', label: 'Integracions' },
  ]

  return (
    <div className="status-view">
      <div className="status-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`status-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="status-content">
        {activeTab === 'system' && <SystemStatus />}
        {activeTab === 'pm2' && <Pm2Status />}
        {activeTab === 'agents' && <AgentStatus />}
        {activeTab === 'sessions' && <SessionStatus />}
        {activeTab === 'cron' && <CronStatus />}
        {activeTab === 'integrations' && <IntegrationStatus />}
      </div>
    </div>
  )
}
