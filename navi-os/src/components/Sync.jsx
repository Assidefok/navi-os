import { useState, useEffect } from 'react'
import { Database, GitCommit, GitPullRequest, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, HardDrive, Loader2, Upload } from 'lucide-react'
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
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setBackup(d)
        else loadViaShell()
      })
      .catch(() => loadViaShell())
    setLoading(false)
  }, [])

  const loadViaShell = () => {
    try {
      const { execSync } = require('child_process')
      // Check for common backup locations and recent modifications
      const workspace = '/home/user/.openclaw/workspace'
      const out = execSync(`find "${workspace}" -name "*.tar" -o -name "*.zip" -o -name "backup*" 2>/dev/null | head -5`, { timeout: 5000 }).toString()
      const files = out.split('\n').filter(Boolean)
      // Get last git commit date as proxy for last sync
      const gitDate = execSync(`cd "${workspace}" && git log -1 --format="%ai" 2>/dev/null`, { timeout: 3000 }).toString().trim()
      setBackup({
        lastBackup: files.length > 0 ? files[0] : null,
        lastBackupTime: gitDate || null,
        status: files.length > 0 ? 'ok' : 'warning',
        note: files.length > 0 ? `${files.length} archive(s) found` : 'No backup archive found'
      })
    } catch {
      setBackup({ status: 'unknown', note: 'Could not determine backup status' })
    }
    setLoading(false)
  }

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

function GitLog() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/git-log')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.commits) setCommits(d.commits)
        else loadViaShell()
      })
      .catch(() => loadViaShell())
    setLoading(false)
  }, [])

  const loadViaShell = () => {
    try {
      const { execSync } = require('child_process')
      const workspace = '/home/user/.openclaw/workspace'
      const out = execSync(`cd "${workspace}" && git log --oneline -30 2>/dev/null`, { timeout: 5000 }).toString()
      const lines = out.split('\n').filter(Boolean).map(line => {
        // Parse "hash message" format
        const parts = line.match(/^([a-f0-9]+)\s+(.*)$/)
        if (parts) {
          return { hash: parts[1], message: parts[2], author: '—', date: '—' }
        }
        return { hash: line.slice(0, 7), message: line.slice(8) || line, author: '—', date: '—' }
      })
      // Get dates separately
      try {
        const dates = execSync(`cd "${workspace}" && git log --format="%ai|%an" -30 2>/dev/null`, { timeout: 5000 }).toString().trim().split('\n')
        lines.forEach((line, i) => {
          if (dates[i]) {
            const [date, author] = dates[i].split('|')
            line.date = date
            line.author = author
          }
        })
      } catch {}
      setCommits(lines)
    } catch (e) {
      setError('No s\'ha pogut carregar el git log')
      setCommits([])
    }
    setLoading(false)
  }

  if (loading) return <div className="sync-loading"><Loader2 size={16} className="spin" /></div>
  if (error) return <div className="sync-error">{error}</div>

  return (
    <div className="sync-section">
      <h3 className="section-title"><GitCommit size={14} /> Git History (darrer(s) 30 commits)</h3>
      <div className="git-list">
        {commits.length === 0 && <span className="empty-state">Cap commit trobat</span>}
        {commits.map((commit, i) => (
          <div key={i} className="git-commit">
            <span className="commit-hash">{commit.hash?.slice(0, 7)}</span>
            <div className="commit-body">
              <span className="commit-message">{commit.message}</span>
              <span className="commit-meta">
                {commit.author !== '—' && <>{commit.author} · </>}
                {commit.date ? formatRelative(commit.date) : '—'}
              </span>
            </div>
            <span className={`commit-date`}>{commit.date ? formatDate(commit.date) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GitPushStatus() {
  const [pushInfo, setPushInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/git-push')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setPushInfo(d)
        else loadViaShell()
      })
      .catch(() => loadViaShell())
    setLoading(false)
  }, [])

  const loadViaShell = () => {
    try {
      const { execSync } = require('child_process')
      const workspace = '/home/user/.openclaw/workspace'
      // Check remote status
      const remote = execSync(`cd "${workspace}" && git remote -v 2>/dev/null`, { timeout: 3000 }).toString().trim()
      const branch = execSync(`cd "${workspace}" && git branch --show-current 2>/dev/null`, { timeout: 3000 }).toString().trim()
      const status = execSync(`cd "${workspace}" && git status -sb 2>/dev/null`, { timeout: 3000 }).toString().trim()
      // Check unpushed commits
      const unpushed = execSync(`cd "${workspace}" && git log @{u}..HEAD --oneline 2>/dev/null | wc -l`, { timeout: 3000 }).toString().trim()
      const ahead = parseInt(unpushed) || 0

      setPushInfo({
        remote: remote || 'origin',
        branch: branch || 'main',
        status: status || 'clean',
        ahead,
        synced: ahead === 0
      })
    } catch {
      setPushInfo({ status: 'unknown', note: 'No git repo or not configured' })
    }
    setLoading(false)
  }

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