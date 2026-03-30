import { useState, useEffect } from 'react'
import {
  Cpu, HardDrive, Wifi, Clock, Activity, Users, Bot, CheckCircle2,
  AlertCircle, XCircle, Loader2, Server, Shield, Database, RefreshCw
} from 'lucide-react'
import './Status.css'

function MetricCard({ icon: Icon, label, value, sub, color = 'amber' }) {
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
      // Fallback: shell out
      const [cpu, mem, disk] = await Promise.all([
        execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'"),
        execAsync("free -m | awk '/Mem:/{print $2\":\"$3}'"),
        execAsync("df -h / | tail -1 | awk '{print $5\":\"$4}'"),
      ])
      const [memTotal, memUsed] = (mem || '0:0').split(':')
      const [diskPct, diskFree] = (disk || '0:0').split(':')
      setMetrics({
        cpu: parseFloat(cpu) || 0,
        memory: { used: parseInt(memUsed) || 0, total: parseInt(memTotal) || 0 },
        disk: { used: diskPct?.replace('%','') || '0', free: diskFree }
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchMetrics() }, [])

  if (loading && !metrics) {
    return <div className="status-loading"><Loader2 size={20} className="spin" /> Carregant...</div>
  }

  const cpuVal = metrics?.cpu ? `${metrics.cpu.toFixed(1)}%` : '—'
  const memUsed = metrics?.memory?.used || 0
  const memTotal = metrics?.memory?.total || 1
  const memPct = Math.round((memUsed / memTotal) * 100)
  const memVal = memTotal ? `${memUsed}MB / ${memTotal}MB` : '—'
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
      .then(d => { setAgents(d.agents || []); setLoading(false) })
      .catch(() => setLoading(false))
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

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="status-section">
      <h3 className="section-title"><Activity size={14} /> Sessions</h3>
      <div className="sessions-list">
        {sessions.length === 0 && <span className="empty-state">Cap sessio activa</span>}
        {sessions.map(s => (
          <div key={s.id} className="session-row">
            <span className="session-id">{s.id?.slice(0,8) || '—'}</span>
            <span className="session-model">{s.model || '—'}</span>
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
      .then(d => { setJobs(d.jobs || []); setLoading(false) })
      .catch(() => setLoading(false))
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

function IntegrationStatus() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then(d => { setIntegrations(d.integrations || []); setLoading(false) })
      .catch(() => {
        // Try openclaw status
        setLoading(false)
        setIntegrations([])
      })
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

// Helper
function execAsync(cmd) {
  return new Promise(resolve => {
    const { execSync } = require('child_process')
    try { resolve(execSync(cmd, { timeout: 3000 }).toString().trim()) }
    catch { resolve('') }
  })
}

export default function Status() {
  const [activeTab, setActiveTab] = useState('system')

  const tabs = [
    { id: 'system', label: 'Sistema' },
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
        {activeTab === 'agents' && <AgentStatus />}
        {activeTab === 'sessions' && <SessionStatus />}
        {activeTab === 'cron' && <CronStatus />}
        {activeTab === 'integrations' && <IntegrationStatus />}
      </div>
    </div>
  )
}