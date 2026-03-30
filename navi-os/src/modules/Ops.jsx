import { useState, useEffect } from 'react'
import { Activity, Zap, Link, FolderSync, Shield, Database, Users, Bot, MessageSquare, Moon, CheckCircle2, AlertCircle, Clock, LayoutList, LayoutDashboard, FileCode, Server } from 'lucide-react'
import TaskPipeline from '../components/TaskPipeline'
import DeliverableTracker from '../components/DeliverableTracker'
import TaskManager from '../components/TaskManager'
import FeatureCard from '../components/ui/FeatureCard'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
import Status from '../components/Status'
import Files from '../components/Files'
import Security from '../components/Security'
import Sync from '../components/Sync'
import './Ops.css'

const FEATURES = [
  { icon: Activity, name: 'Status', desc: 'Estat del sistema' },
  { icon: Zap, name: 'Automation', desc: 'Automatitzacions' },
  { icon: Link, name: 'Integrations', desc: 'Connexions externes' },
  { icon: FolderSync, name: 'Files', desc: 'Gestio d\'arxius' },
  { icon: Shield, name: 'Security', desc: 'Seguretat' },
  { icon: Database, name: 'Sync', desc: 'Sincronitzacio' }
]

// ─── Overnight Summary ─────────────────────────────────────────────────────────

function OvernightSummary() {
  const [cronJobs, setCronJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cron-health')
      .then(r => r.json())
      .then(d => { setCronJobs(d.jobs || []); setLoading(false) })
      .catch(() => setLoading(false))
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
      return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  return (
    <div className="overnight-summary">
      <div className="summary-header">
        <Moon size={16} className="amber" />
        <h3>Resum Overnight (desde 22h)</h3>
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

// ─── System Modules Panel ──────────────────────────────────────────────────────

function SystemModules() {
  const [metrics, setMetrics] = useState(null)
  const [agents, setAgents] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sysRes, agentsRes, sessionsRes] = await Promise.all([
          fetch('/api/system-metrics').catch(() => null),
          fetch('/api/agents').catch(() => null),
          fetch('/api/sessions').catch(() => null),
        ])
        if (sysRes?.ok) setMetrics(await sysRes.json())
        if (agentsRes?.ok) setAgents(await agentsRes.json())
        if (sessionsRes?.ok) setSessions(await sessionsRes.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const modules = [
    { name: 'Gateway', status: 'operational', desc: 'OpenClaw Gateway' },
    { name: 'Agents', status: agents.length > 0 ? 'operational' : 'idle', desc: `${agents.length} agent(s)` },
    { name: 'Sessions', status: sessions.length > 0 ? 'operational' : 'idle', desc: `${sessions.length} sessio(s)` },
    { name: 'Files', status: 'operational', desc: 'Workspace' },
    { name: 'Cron', status: 'operational', desc: 'Tasques programades' },
    { name: 'Memory', status: 'operational', desc: 'Vector store' },
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

// ─── Main Ops ─────────────────────────────────────────────────────────────────

export default function Ops() {
  const [viewMode, setViewMode] = useState('hub')
  const [activePanel, setActivePanel] = useState(null)

  return (
    <div className="module-view ops">
      <h1 className="dashboard-title amber neon-amber">Operacions</h1>

      {/* Navigation Toggles */}
      <div className="ops-toggles">
        <button
          className={`toggle-btn ${viewMode === 'hub' ? 'active' : ''}`}
          onClick={() => { setViewMode('hub'); setActivePanel(null) }}
        >
          <LayoutDashboard size={15} />
          Mission Control
        </button>
        <button
          className={`toggle-btn ${viewMode === 'orgchart' ? 'active' : ''}`}
          onClick={() => { setViewMode('orgchart'); setActivePanel(null) }}
        >
          <Users size={15} />
          Org Chart
        </button>
        <button
          className={`toggle-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
          onClick={() => { setViewMode('pipeline'); setActivePanel(null) }}
        >
          <LayoutList size={15} />
          PM Board
        </button>
        <button
          className={`toggle-btn ${viewMode === 'manager' ? 'active' : ''}`}
          onClick={() => { setViewMode('manager'); setActivePanel(null) }}
        >
          <Activity size={15} />
          Task Manager
        </button>
      </div>

      {/* Full-screen panel views */}
      {activePanel === 'status' && (
        <div className="panel-fullscreen">
          <button className="panel-back-btn" onClick={() => setActivePanel(null)}>← Enrere</button>
          <Status />
        </div>
      )}

      {activePanel === 'files' && (
        <div className="panel-fullscreen">
          <button className="panel-back-btn" onClick={() => setActivePanel(null)}>← Enrere</button>
          <Files />
        </div>
      )}

      {activePanel === 'security' && (
        <div className="panel-fullscreen">
          <button className="panel-back-btn" onClick={() => setActivePanel(null)}>← Enrere</button>
          <Security />
        </div>
      )}

      {activePanel === 'sync' && (
        <div className="panel-fullscreen">
          <button className="panel-back-btn" onClick={() => setActivePanel(null)}>← Enrere</button>
          <Sync />
        </div>
      )}

      {/* Hub View */}
      {viewMode === 'hub' && !activePanel && (
        <>
          {(viewMode === 'hub' || viewMode === 'orgchart') && <OvernightSummary />}
          <MissionControl />

          {/* Real Status and Files panels */}
          <div className="ops-panel-row">
            <div className="ops-real-panel" onClick={() => setActivePanel('status')}>
              <div className="panel-header">
                <Activity size={16} className="panel-icon amber" />
                <span>Status</span>
              </div>
              <div className="panel-body">
                <p>Estat del sistema, agents i sessions</p>
                <span className="panel-link">Obrir →</span>
              </div>
            </div>
            <div className="ops-real-panel" onClick={() => setActivePanel('files')}>
              <div className="panel-header">
                <FolderSync size={16} className="panel-icon amber" />
                <span>Files</span>
              </div>
              <div className="panel-body">
                <p>Explorador de fitxers + editor integrat</p>
                <span className="panel-link">Obrir →</span>
              </div>
            </div>
          </div>

          <div className="ops-panel-row">
            <div className="ops-real-panel" onClick={() => setActivePanel('security')}>
              <div className="panel-header">
                <Shield size={16} className="panel-icon amber" />
                <span>Seguretat</span>
              </div>
              <div className="panel-body">
                <p>Skills, tools, gateway i audit de seguretat</p>
                <span className="panel-link">Obrir →</span>
              </div>
            </div>
            <div className="ops-real-panel" onClick={() => setActivePanel('sync')}>
              <div className="panel-header">
                <Database size={16} className="panel-icon amber" />
                <span>Sync</span>
              </div>
              <div className="panel-body">
                <p>Backup, git history i push status</p>
                <span className="panel-link">Obrir →</span>
              </div>
            </div>
          </div>

          <SystemModules />

          <div className="ops-section-title">Automatitzacio i Integracions</div>
          <div className="features-grid">
            {FEATURES.filter(f => f.name === 'Automation' || f.name === 'Integrations').map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.name}
                description={f.desc}
                colorClass="amber"
              />
            ))}
          </div>
        </>
      )}

      {/* Org Chart View */}
      {viewMode === 'orgchart' && <OrgChart />}

      {/* Task Views */}
      {viewMode === 'pipeline' && (
        <>
          <OvernightSummary />
          <TaskPipeline />
          <DeliverableTracker />
        </>
      )}

      {viewMode === 'manager' && (
        <>
          <OvernightSummary />
          <TaskManager />
        </>
      )}
    </div>
  )
}