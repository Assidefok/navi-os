import { useState, useEffect } from 'react'
import { Activity, Zap, Link, FolderSync, Shield, Database, Users, LayoutList, LayoutDashboard, Server, Moon, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react'
import TaskPipeline from '../components/TaskPipeline'
import Standups from './Ops/Standups'
import ChiefsCouncil from './Ops/ChiefsCouncil/ChiefsCouncil'
import DeliverableTracker from '../components/DeliverableTracker'
import TaskManager from '../components/TaskManager'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
import Status from '../components/Status'
import Files from '../components/Files'
import Security from '../components/Security'
import Sync from '../components/Sync'
import ProposalsBoard from './Proposals/ProposalsBoard'
import AutomationsBoard from './Ops/Automations/AutomationsBoard'
import './Ops.css'

// ─── Overnight Summary ─────────────────────────────────────────────────────────

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
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
  }, [])

  const modules = [
    { name: 'Gateway', status: 'operational', desc: 'OpenClaw Gateway' },
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

// ─── Health Errors Summary ─────────────────────────────────────────────────────

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
      return new Date(iso).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

// ─── Main Ops ─────────────────────────────────────────────────────────────────

// ─── Placeholder Views ────────────────────────────────────────────────────────

function IntegrationView() {
  return (
    <div className="placeholder-view">
      <div className="placeholder-icon"><Link size={48} className="amber" /></div>
      <h2>Integrations</h2>
      <p>En desenvolupament</p>
      <p>Connexions externes: API, webhooks, serveis de tercers.</p>
    </div>
  )
}

export default function Ops() {
  const [viewMode, setViewMode] = useState('hub')

  return (
    <div className="module-view ops">
      <h1 className="dashboard-title amber neon-amber">Operacions</h1>

      {/* Navigation Toggles */}
      <div className="ops-toggles">
        <button
          className={`toggle-btn ${viewMode === 'hub' ? 'active' : ''}`}
          onClick={() => setViewMode('hub')}
        >
          <LayoutDashboard size={15} />
          Mission Control
        </button>
        <button
          className={`toggle-btn ${viewMode === 'orgchart' ? 'active' : ''}`}
          onClick={() => setViewMode('orgchart')}
        >
          <Users size={15} />
          Org Chart
        </button>
        <button
          className={`toggle-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
          onClick={() => setViewMode('pipeline')}
        >
          <LayoutList size={15} />
          PM Board
        </button>
        <button
          className={`toggle-btn ${viewMode === 'manager' ? 'active' : ''}`}
          onClick={() => setViewMode('manager')}
        >
          <Activity size={15} />
          Task Manager
        </button>
        <button
          className={`toggle-btn ${viewMode === 'files' ? 'active' : ''}`}
          onClick={() => setViewMode('files')}
        >
          <FolderSync size={15} />
          Files
        </button>
        <button
          className={`toggle-btn ${viewMode === 'sync' ? 'active' : ''}`}
          onClick={() => setViewMode('sync')}
        >
          <Database size={15} />
          Sync
        </button>
        <button
          className={`toggle-btn ${viewMode === 'security' ? 'active' : ''}`}
          onClick={() => setViewMode('security')}
        >
          <Shield size={15} />
          Security
        </button>
        <button
          className={`toggle-btn ${viewMode === 'automation' ? 'active' : ''}`}
          onClick={() => setViewMode('automation')}
        >
          <Zap size={15} />
          Automations
        </button>
        <button
          className={`toggle-btn ${viewMode === 'integration' ? 'active' : ''}`}
          onClick={() => setViewMode('integration')}
        >
          <Link size={15} />
          Integrations
        </button>
        <button
          className={`toggle-btn ${viewMode === 'chiefs' ? 'active' : ''}`}
          onClick={() => setViewMode('chiefs')}
        >
          <MessageSquare size={15} />
          Chiefs Council
        </button>
        <button
          className={`toggle-btn ${viewMode === 'standups' ? 'active' : ''}`}
          onClick={() => setViewMode('standups')}
        >
          <Users size={15} />
          Standups
        </button>
      </div>

      {/* Hub View */}
      {viewMode === 'hub' && (
        <>
          <OvernightSummary />
          <HealthErrors />
          <MissionControl />
          <Status />
          <Files />
          <Security />
          <Sync />
          <SystemModules />
        </>
      )}

      {/* Org Chart View */}
      {viewMode === 'orgchart' && <OrgChart />}

      {/* Task Views */}
      {viewMode === 'pipeline' && (
        <>
          <OvernightSummary />
          <TaskPipeline />
          <ProposalsBoard />
          <DeliverableTracker />
        </>
      )}

      {viewMode === 'manager' && (
        <>
          <OvernightSummary />
          <TaskManager />
        </>
      )}

      {/* Files View */}
      {viewMode === 'files' && <Files />}

      {/* Sync View */}
      {viewMode === 'sync' && <Sync />}

      {/* Security View */}
      {viewMode === 'security' && <Security />}

      {/* Automation View */}
      {viewMode === 'automation' && <AutomationsBoard />}

      {/* Integration View */}
      {viewMode === 'integration' && <IntegrationView />}

      {/* Chiefs Council View */}
      {viewMode === 'chiefs' && <ChiefsCouncil />}

      {/* Standups View */}
      {viewMode === 'standups' && <Standups />}
    </div>
  )
}