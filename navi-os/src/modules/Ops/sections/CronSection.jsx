// CronModule - extracted from Ops.jsx
import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { OpsShell, KpiCard, formatDate, formatRelative } from '../shared'

export default function CronModule() {
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
