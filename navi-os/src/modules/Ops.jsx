import { useState, useEffect } from 'react'
import { Activity, Zap, Link, FolderSync, Shield, Database, Users, Bot, MessageSquare, Moon, CheckCircle2, AlertCircle, Clock, LayoutList, LayoutDashboard } from 'lucide-react'
import TaskPipeline from '../components/TaskPipeline'
import DeliverableTracker from '../components/DeliverableTracker'
import TaskManager from '../components/TaskManager'
import FeatureCard from '../components/ui/FeatureCard'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
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

// ─── Main Ops ─────────────────────────────────────────────────────────────────

const PLACEHOLDER_PANELS = [
  { icon: MessageSquare, title: 'Session Monitoring', desc: 'Control de sessions actives', color: 'amber' },
  { icon: Users, title: 'Agent Overview', desc: 'Visio dels agents actius', color: 'amber' }
]

export default function Ops() {
  const [viewMode, setViewMode] = useState('hub') // 'hub' | 'orgchart' | 'pipeline' | 'manager'

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
      </div>

      {/* Hub View: Mission Control + Overnight Summary */}
      {(viewMode === 'hub' || viewMode === 'orgchart') && (
        <OvernightSummary />
      )}

      {/* View: Mission Control Hub */}
      {viewMode === 'hub' && <MissionControl />}

      {/* View: Org Chart */}
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

      {/* Placeholder Panels - only on hub */}
      {viewMode === 'hub' && (
        <>
          <div className="ops-panel-row">
            {PLACEHOLDER_PANELS.map((panel, i) => (
              <div key={i} className="ops-placeholder-panel">
                <div className="panel-header">
                  <panel.icon size={16} className="panel-icon" />
                  <span>{panel.title}</span>
                </div>
                <div className="panel-body">
                  <p>{panel.desc}</p>
                  <div className="panel-placeholder-content">
                    <span>— En desenvolupament —</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legacy Features Grid */}
          <div className="ops-section-title">Moduls del sistema</div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
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
    </div>
  )
}
