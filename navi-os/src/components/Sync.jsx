import { useState, useEffect } from 'react'
import { GitCommit, CheckCircle2, XCircle, AlertCircle, HardDrive, Loader2, Upload, X, FileText, GitBranch } from 'lucide-react'
import './Sync.css'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function formatRelative(iso) {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `fa ${days}d`
    if (hours > 0) return `fa ${hours}h`
    if (mins > 0) return `fa ${mins}m`
    return 'ara'
  } catch { return '—' }
}

function BackupStatus() {
  const [backup, setBackup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/backup-status')
      .then(r => r.ok ? r.json() : { status: 'unknown', note: 'No disponible' })
      .then(setBackup)
      .catch(() => setBackup({ status: 'unknown', note: 'Could not determine backup status' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="sync-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="sync-section">
      <h3 className="section-title"><HardDrive size={14} /> Backup</h3>
      <div className="backup-card">
        <div className="backup-status-row">
          <span className="backup-label">Estat</span>
          <span className={`backup-status-badge ${backup?.status || 'unknown'}`}>
            {backup?.status === 'ok' && <><CheckCircle2 size={12} /> Complet</>}
            {backup?.status === 'warning' && <><AlertCircle size={12} /> Warning</>}
            {backup?.status === 'error' && <><XCircle size={12} /> Error</>}
            {backup?.status === 'unknown' && <span>—</span>}
          </span>
        </div>
        <div className="backup-status-row">
          <span className="backup-label">Ultima backup</span>
          <span className="backup-value">
            {backup?.lastBackupTime ? (
              <>{formatDate(backup.lastBackupTime)} <span className="backup-relative">({formatRelative(backup.lastBackupTime)})</span></>
            ) : '—'}
          </span>
        </div>
        {backup?.lastBackup && (
          <div className="backup-status-row">
            <span className="backup-label">Arxiu</span>
            <span className="backup-value mono">{backup.lastBackup}</span>
          </div>
        )}
        {backup?.note && (
          <div className="backup-note">{backup.note}</div>
        )}
      </div>
    </div>
  )
}

// ─── Commit Detail Modal ─────────────────────────────────────────────────────────

function CommitDetail({ commitHash, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/git-commit/${commitHash}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [commitHash])

  return (
    <div className="commit-detail-overlay" onClick={onClose}>
      <div className="commit-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="commit-detail-header">
          <h3><GitCommit size={18} /> Commit Detail</h3>
          <button className="commit-detail-close" onClick={onClose}><X size={18} /></button>
        </div>
        
        {loading ? (
          <div className="commit-detail-loading"><Loader2 size={24} className="spin" /></div>
        ) : detail?.error ? (
          <div className="commit-detail-error">{detail.error}</div>
        ) : detail ? (
          <div className="commit-detail-content">
            <div className="commit-detail-summary">
              <h4>{detail.subject}</h4>
              <div className="commit-meta-row">
                <span><strong>Hash:</strong> <code>{detail.hash?.slice(0, 7)}</code></span>
                <span><strong>Autor:</strong> {detail.author}</span>
                <span><strong>Data:</strong> {formatDate(detail.date)}</span>
              </div>
              {detail.body && (
                <div className="commit-body-section">
                  <h5>Descripcio:</h5>
                  <p>{detail.body}</p>
                </div>
              )}
            </div>

            <div className="commit-files-section">
              <h5><FileText size={14} /> Fitxers canviats ({detail.files?.length || 0})</h5>
              <div className="commit-files-list">
                {detail.files?.map((file, i) => (
                  <div key={i} className="commit-file-item">
                    <FileText size={12} />
                    <span>{file}</span>
                  </div>
                )) || <span className="empty-state">Cap fitxer</span>}
              </div>
            </div>

            {detail.stats && (
              <div className="commit-stats-section">
                <h5><GitBranch size={14} /> Estadistiques</h5>
                <pre className="commit-stats-pre">{detail.stats}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="commit-detail-error">No s'ha pogut carregar el commit</div>
        )}
      </div>
    </div>
  )
}

// ─── GitLog ───────────────────────────────────────────────────────────────────

function GitLog() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCommit, setSelectedCommit] = useState(null)

  useEffect(() => {
    fetch('/api/git-log')
      .then(r => r.ok ? r.json() : { commits: [] })
      .then(d => setCommits(d.commits || []))
      .catch(() => {
        setError('No s\'ha pogut carregar el git log')
        setCommits([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="sync-loading"><Loader2 size={16} className="spin" /></div>
  if (error) return <div className="sync-error">{error}</div>

  return (
    <div className="sync-section">
      <h3 className="section-title"><GitCommit size={14} /> Git History (darrer(s) 30 commits)</h3>
      <div className="git-list">
        {commits.length === 0 && <span className="empty-state">Cap commit trobat</span>}
        {commits.map((commit, i) => (
          <div key={i} className="git-commit" onClick={() => setSelectedCommit(commit.hash)}>
            <span className="commit-hash">{commit.hash?.slice(0, 7)}</span>
            <div className="commit-body">
              <span className="commit-message">{commit.message}</span>
              <span className="commit-meta">
                {commit.author !== '—' && <>{commit.author} · </>}
                {commit.date ? formatRelative(commit.date) : '—'}
              </span>
            </div>
            <span className="commit-date">{commit.date ? formatDate(commit.date) : ''}</span>
          </div>
        ))}
      </div>

      {selectedCommit && (
        <CommitDetail commitHash={selectedCommit} onClose={() => setSelectedCommit(null)} />
      )}
    </div>
  )
}

function GitPushStatus() {
  const [pushInfo, setPushInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/git-push')
      .then(r => r.ok ? r.json() : { status: 'unknown', note: 'No git repo or not configured' })
      .then(setPushInfo)
      .catch(() => setPushInfo({ status: 'unknown', note: 'No git repo or not configured' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="sync-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="sync-section">
      <h3 className="section-title"><Upload size={14} /> Push Status</h3>
      <div className="push-card">
        {pushInfo?.synced !== undefined && (
          <div className="push-status-row">
            <span className="push-label">Estat</span>
            <span className={`push-status-badge ${pushInfo.synced ? 'synced' : 'ahead'}`}>
              {pushInfo.synced
                ? <><CheckCircle2 size={12} /> Al dia</>
                : <><AlertCircle size={12} /> {pushInfo.ahead} commit(s) per pujar</>
              }
            </span>
          </div>
        )}
        <div className="push-status-row">
          <span className="push-label">Remote</span>
          <span className="push-value mono">{pushInfo?.remote || '—'}</span>
        </div>
        <div className="push-status-row">
          <span className="push-label">Branch</span>
          <span className="push-value mono">{pushInfo?.branch || '—'}</span>
        </div>
        {pushInfo?.status && (
          <div className="push-status-row">
            <span className="push-label">Working tree</span>
            <span className="push-value mono" style={{ color: pushInfo.status.includes('clean') ? '#30d158' : '#ffb800' }}>
              {pushInfo.status}
            </span>
          </div>
        )}
        {pushInfo?.note && (
          <div className="push-note">{pushInfo.note}</div>
        )}
      </div>
    </div>
  )
}

export default function Sync() {
  return (
    <div className="sync-view">
      <BackupStatus />
      <GitPushStatus />
      <GitLog />
    </div>
  )
}
