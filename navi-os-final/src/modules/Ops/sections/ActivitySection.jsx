// ActivityModule - extracted from Ops.jsx
import { useState, useEffect } from 'react'
import {
  Users, LayoutList, Activity, FolderSync,
  Shield, Zap, Link, Brain, Database,
} from 'lucide-react'
import { OpsShell, HealthErrors, SystemModules } from '../shared'

export default function ActivityModule({ onOpenTool }) {
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
    ['chiefs', 'Chiefs Council', Users],
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
