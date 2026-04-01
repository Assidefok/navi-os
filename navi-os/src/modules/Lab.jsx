import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useState } from 'react'
import {
  FlaskConical,
  ScrollText,
  RefreshCw,
  ChevronRight,
  Clock,
  ExternalLink,
  Monitor,
  PanelLeft,
  FileText,
  CheckCircle2,
  Check,
  X,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import './Lab.css'

const API_BASE = '/api'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text) {
  if (!text) return <p className="lab-empty-copy">No hi ha contingut</p>
  try {
    const html = marked.parse(text)
    const sanitized = DOMPurify.sanitize(html)
    return <div className="lab-markdown-body" dangerouslySetInnerHTML={{ __html: sanitized }} />
  } catch {
    return <pre className="lab-pre-fallback">{text}</pre>
  }
}

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

function statusTone(status) {
  if (['running', 'healthy', 'ok', 'done', 'delivered'].includes(status)) return 'running'
  if (['failed', 'error'].includes(status)) return 'failed'
  if (['archived', 'disabled', 'stopped'].includes(status)) return 'muted'
  return 'neutral'
}

function normalizePreviewUrl(proto) {
  if (proto.previewUrl) return proto.previewUrl
  if (proto.port) return `http://127.0.0.1:${proto.port}`
  return null
}

function LabTopTabs({ activeTab, onChange }) {
  const tabs = [
    ['overview', 'Overview'],
    ['prototypes', 'Prototypes'],
    ['logs', 'Build Logs'],
    ['improvements', 'Self Improvement'],
  ]

  return (
    <div className="lab-top-tabs minimal">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={`lab-top-tab minimal ${activeTab === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function LabOverview({ prototypes, logs, loading, openTab }) {
  const running = prototypes.filter(p => p.status === 'running').length
  const recentLog = logs[0]

  return (
    <section className="lab-shell lab-overview-shell">
      <div className="lab-overview-header">
        <div className="lab-overview-title">
          <FlaskConical size={22} />
          <div>
            <h1>Laboratory</h1>
            <p>Experiments, prototypes, and overnight builds</p>
          </div>
        </div>
      </div>

      <div className="lab-overview-grid">
        <button className="lab-summary-card" onClick={() => openTab('prototypes')}>
          <div className="lab-summary-header">
            <div className="lab-summary-title">
              <div className="lab-summary-icon"><FlaskConical size={16} /></div>
              <div>
                <h3>Prototypes</h3>
                <p>Staged experiments and client previews</p>
              </div>
            </div>
          </div>

          <div className="lab-summary-body">
            <div className="lab-summary-count">{loading ? '…' : prototypes.length}</div>
            <div className="lab-summary-list">
              {prototypes.slice(0, 1).map(proto => (
                <div key={proto.id} className="lab-summary-row">
                  <strong>{proto.name}</strong>
                  <span className={`lab-pill ${statusTone(proto.status)}`}>{proto.status}</span>
                </div>
              ))}
              {!loading && prototypes.length === 0 && <span className="lab-empty-copy">No hi ha prototips</span>}
            </div>
            <div className="lab-summary-footnote">{running} running</div>
          </div>
        </button>

        <button className="lab-summary-card" onClick={() => openTab('logs')}>
          <div className="lab-summary-header">
            <div className="lab-summary-title">
              <div className="lab-summary-icon"><ScrollText size={16} /></div>
              <div>
                <h3>Build Logs</h3>
                <p>Overnight builds and self-improvement runs</p>
              </div>
            </div>
          </div>

          <div className="lab-summary-body">
            <div className="lab-summary-count">{loading ? '…' : logs.length}</div>
            <div className="lab-summary-list mono">
              {recentLog ? (
                <div className="lab-summary-logline">{recentLog.title}</div>
              ) : (
                !loading && <span className="lab-empty-copy">No hi ha logs</span>
              )}
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}

function PrototypePreviewContent({ prototype }) {
  const previewUrl = normalizePreviewUrl(prototype)

  return (
    <div className="lab-window-preview">
      <div className="lab-window-topbar">
        <div className="lab-window-left">
          <span className="lab-window-appname">{prototype.name}</span>
          <span className={`lab-pill ${statusTone(prototype.status)}`}>{prototype.status}</span>
        </div>
        <div className="lab-window-right">
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noreferrer" className="lab-open-external">
              <ExternalLink size={14} /> Open in new tab
            </a>
          )}
        </div>
      </div>

      <div className="lab-window-subbar">
        <span>Mission Control</span>
      </div>

      {previewUrl ? (
        <div className="lab-live-preview-frame-wrap windowed">
          <iframe
            className="lab-live-preview-frame"
            src={previewUrl}
            title={`Preview ${prototype.name}`}
          />
        </div>
      ) : (
        <div className="lab-prototype-fallback">
          <Monitor size={42} />
          <h4>No hi ha preview en viu</h4>
          <p>Aquest prototip no té port o URL local assignada.</p>
        </div>
      )}
    </div>
  )
}

function PrototypesView({ prototypes, loading, onRefresh }) {
  const [selectedPrototype, setSelectedPrototype] = useState(null)

  return (
    <section className="lab-shell lab-prototypes-shell">
      <div className="lab-section-header">
        <div className="lab-section-title">
          <FlaskConical size={20} />
          <div>
            <h2>Prototypes</h2>
          </div>
        </div>
        <button className="lab-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      {loading ? (
        <div className="lab-empty-state">Carregant prototips...</div>
      ) : prototypes.length === 0 ? (
        <div className="lab-empty-state">No hi ha prototips definits</div>
      ) : (
        <div className="lab-prototype-list-view">
          {prototypes.map(proto => (
            <button key={proto.id} className="lab-prototype-line-card" onClick={() => setSelectedPrototype(proto)}>
              <div className="lab-prototype-line-top">
                <strong>{proto.name}</strong>
                <span className={`lab-pill ${statusTone(proto.status)}`}>{proto.status}</span>
              </div>
              <p>{proto.description || proto['one-liner']}</p>
              <div className="lab-prototype-line-meta">
                <span>{proto.port ? `:${proto.port}` : 'internal'}</span>
                <span>{formatDate(proto.lastBuild)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedPrototype}
        onClose={() => setSelectedPrototype(null)}
        title={selectedPrototype?.name || 'Prototype'}
        width="75%"
        height="75%"
      >
        {selectedPrototype && <PrototypePreviewContent prototype={selectedPrototype} />}
      </Modal>
    </section>
  )
}

function BuildLogsView({ logs, loading, onRefresh }) {
  const [selectedLogId, setSelectedLogId] = useState(null)
  const recentLogs = useMemo(() => logs.slice(0, 60), [logs])

  useEffect(() => {
    if (!recentLogs.length) {
      setSelectedLogId(null)
      return
    }
    setSelectedLogId(prev => recentLogs.find(log => log.id === prev)?.id || recentLogs[0].id)
  }, [recentLogs])

  const selectedLog = recentLogs.find(log => log.id === selectedLogId) || null

  return (
    <section className="lab-shell lab-logs-shell">
      <div className="lab-section-header">
        <div className="lab-section-title">
          <ScrollText size={20} />
          <div>
            <h2>Build Logs</h2>
          </div>
        </div>
        <button className="lab-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      {loading ? (
        <div className="lab-empty-state">Carregant logs...</div>
      ) : recentLogs.length === 0 ? (
        <div className="lab-empty-state">No hi ha logs disponibles</div>
      ) : (
        <div className="lab-build-logs-layout">
          <aside className="lab-build-logs-sidebar">
            <div className="lab-sidebar-title"><PanelLeft size={13} /> BUILDS</div>
            <div className="lab-builds-nav-list">
              {recentLogs.map(log => (
                <button
                  key={log.id}
                  className={`lab-build-nav-item ${selectedLogId === log.id ? 'active' : ''}`}
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <div className="lab-build-nav-title">{log.title}</div>
                  <div className="lab-build-nav-subtitle">{formatDate(log.timestamp)} · {log.meta || log.source}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="lab-build-log-reader">
            {selectedLog ? (
              <>
                <div className="lab-build-log-header">
                  <div>
                    <h3>{selectedLog.title}</h3>
                    <div className="lab-build-log-meta-line">
                      <span>{formatDate(selectedLog.timestamp)}</span>
                      <span>{selectedLog.type}</span>
                      <span>{selectedLog.source}</span>
                    </div>
                  </div>
                  <span className={`lab-pill ${statusTone(selectedLog.status)}`}>{selectedLog.status}</span>
                </div>
                <div className="lab-build-log-content">
                  {renderMarkdown(selectedLog.content || selectedLog.summary)}
                </div>
              </>
            ) : (
              <div className="lab-empty-state">Selecciona un build log</div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

function priorityColor(priority) {
  if (!priority) return 'neutral'
  if (priority.toLowerCase().includes('critic') || priority.includes('🔴')) return 'failed'
  if (priority.toLowerCase().includes('alt') || priority.includes('🟡')) return 'running'
  if (priority.toLowerCase().includes('baix') || priority.includes('🟢')) return 'ok'
  return 'neutral'
}

function statusBadge(status) {
  switch (status) {
    case 'pending': return { label: 'Pendent', class: 'neutral' }
    case 'approved': return { label: 'Aprobat', class: 'running' }
    case 'denied': return { label: 'Denegat', class: 'failed' }
    case 'executed': return { label: 'Executat', class: 'ok' }
    default: return { label: status, class: 'neutral' }
  }
}

function SelfImprovementView() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const loadProposals = () => {
    setLoading(true)
    fetch(`${API_BASE}/self-improvement/proposals`)
      .then(r => r.json())
      .then(data => {
        setProposals(data.proposals || [])
      })
      .catch(err => {
        console.error('Failed to load proposals:', err)
        setFeedback({ type: 'error', message: 'Error carregant propostes' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProposals()
  }, [])

  const handleApprove = async (proposal) => {
    setProcessing(proposal.id)
    setFeedback(null)
    try {
      const res = await fetch(`${API_BASE}/self-improvement/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          generatedDate: proposal.generatedDate,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedback({ type: 'success', message: `${proposal.id} aprovat — es desplegarà aquesta nit` })
        loadProposals()
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error desconegut' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Error: ${err.message}` })
    } finally {
      setProcessing(null)
    }
  }

  const handleDeny = async (proposal) => {
    setProcessing(proposal.id)
    setFeedback(null)
    try {
      const res = await fetch(`${API_BASE}/self-improvement/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          generatedDate: proposal.generatedDate,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedback({ type: 'success', message: `${proposal.id} denegat` })
        loadProposals()
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error desconegut' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Error: ${err.message}` })
    } finally {
      setProcessing(null)
    }
  }

  const pendingProposals = proposals.filter(p => p.status === 'pending')
  const approvedProposals = proposals.filter(p => p.status === 'approved')
  const executedProposals = proposals.filter(p => p.status === 'executed')
  const deniedProposals = proposals.filter(p => p.status === 'denied')

  return (
    <section className="lab-shell lab-improvements-shell">
      <div className="lab-section-header">
        <div className="lab-section-title">
          <Lightbulb size={20} />
          <div>
            <h2>Self Improvement</h2>
          </div>
        </div>
        <button className="lab-refresh-btn" onClick={loadProposals}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>

      {feedback && (
        <div className={`lab-feedback ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="lab-empty-state">Carregant propostes...</div>
      ) : proposals.length === 0 ? (
        <div className="lab-empty-state">
          <Lightbulb size={42} />
          <h4>No hi ha propostes</h4>
          <p>Les propostes de self-improvement apareixeran aqui cada matí.</p>
        </div>
      ) : (
        <div className="lab-improvements-content">
          {pendingProposals.length > 0 && (
            <div className="lab-improvements-section">
              <h3 className="lab-improvements-section-title">
                <AlertCircle size={16} /> Pendents de Revisar ({pendingProposals.length})
              </h3>
              <div className="lab-proposal-cards">
                {pendingProposals.map(proposal => (
                  <div key={proposal.id} className="lab-proposal-card">
                    <div className="lab-proposal-header">
                      <div className="lab-proposal-id">{proposal.id}</div>
                      <span className={`lab-pill ${priorityColor(proposal.priority)}`}>
                        {proposal.priority?.replace(/[🔴🟡🟢]/g, '').trim() || '—'}
                      </span>
                    </div>
                    
                    <h4 className="lab-proposal-title">{proposal.title}</h4>
                    
                    <p className="lab-proposal-description">{proposal.description}</p>
                    
                    <div className="lab-proposal-meta">
                      <div className="lab-proposal-meta-item">
                        <Clock size={12} />
                        {proposal.generatedDate}
                      </div>
                      <div className="lab-proposal-meta-item">
                        <FileText size={12} />
                        {proposal.buildLog}
                      </div>
                    </div>

                    {proposal.steps && proposal.steps.length > 0 && (
                      <div className="lab-proposal-steps">
                        <strong>Passos:</strong>
                        <ol>
                          {proposal.steps.slice(0, 3).map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                          {proposal.steps.length > 3 && (
                            <li className="lab-proposal-more">+ {proposal.steps.length - 3} mes...</li>
                          )}
                        </ol>
                      </div>
                    )}
                    
                    <div className="lab-proposal-actions">
                      <button
                        className="lab-btn-approve"
                        onClick={() => handleApprove(proposal)}
                        disabled={processing === proposal.id}
                      >
                        {processing === proposal.id ? (
                          <RefreshCw size={14} className="spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Acceptar
                      </button>
                      <button
                        className="lab-btn-deny"
                        onClick={() => handleDeny(proposal)}
                        disabled={processing === proposal.id}
                      >
                        <X size={14} />
                        Denegar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {approvedProposals.length > 0 && (
            <div className="lab-improvements-section">
              <h3 className="lab-improvements-section-title">
                <CheckCircle2 size={16} /> Aprovades ({approvedProposals.length}) — Es despleguen aquesta nit
              </h3>
              <div className="lab-proposal-cards">
                {approvedProposals.map(proposal => (
                  <div key={proposal.id} className="lab-proposal-card lab-proposal-card-approved">
                    <div className="lab-proposal-header">
                      <div className="lab-proposal-id">{proposal.id}</div>
                      <span className="lab-pill running">Aprobat</span>
                    </div>
                    <h4 className="lab-proposal-title">{proposal.title}</h4>
                    <div className="lab-proposal-meta">
                      <div className="lab-proposal-meta-item">
                        <Clock size={12} />
                        {proposal.generatedDate}
                      </div>
                      {proposal.approvedAt && (
                        <div className="lab-proposal-meta-item">
                          <CheckCircle2 size={12} />
                          Aprovat {formatDate(proposal.approvedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {executedProposals.length > 0 && (
            <div className="lab-improvements-section">
              <h3 className="lab-improvements-section-title">
                <CheckCircle2 size={16} /> Executades ({executedProposals.length})
              </h3>
              <div className="lab-proposal-cards">
                {executedProposals.map(proposal => (
                  <div key={proposal.id} className="lab-proposal-card lab-proposal-card-executed">
                    <div className="lab-proposal-header">
                      <div className="lab-proposal-id">{proposal.id}</div>
                      <span className="lab-pill ok">Executat</span>
                    </div>
                    <h4 className="lab-proposal-title">{proposal.title}</h4>
                    <div className="lab-proposal-meta">
                      <div className="lab-proposal-meta-item">
                        <Clock size={12} />
                        {proposal.generatedDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deniedProposals.length > 0 && (
            <div className="lab-improvements-section">
              <h3 className="lab-improvements-section-title">
                <AlertCircle size={16} /> Denegades ({deniedProposals.length})
              </h3>
              <div className="lab-proposal-cards">
                {deniedProposals.map(proposal => (
                  <div key={proposal.id} className="lab-proposal-card lab-proposal-card-denied">
                    <div className="lab-proposal-header">
                      <div className="lab-proposal-id">{proposal.id}</div>
                      <span className="lab-pill failed">Denegat</span>
                    </div>
                    <h4 className="lab-proposal-title">{proposal.title}</h4>
                    <div className="lab-proposal-meta">
                      <div className="lab-proposal-meta-item">
                        <Clock size={12} />
                        {proposal.generatedDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function Lab() {
  const [activeTab, setActiveTab] = useState('overview')
  const [prototypes, setPrototypes] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/prototypes`).then(r => r.json()).catch(() => ({ prototypes: [] })),
      fetch(`${API_BASE}/lab/build-logs`).then(r => r.json()).catch(() => ({ logs: [] })),
    ])
      .then(([protoData, logData]) => {
        setPrototypes(protoData.prototypes || [])
        setLogs(logData.logs || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
  }, [])

  return (
    <div className="module-view lab lab-dashboard-module">
      <LabTopTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="lab-content-shell">
        {activeTab === 'overview' && (
          <LabOverview prototypes={prototypes} logs={logs} loading={loading} openTab={setActiveTab} />
        )}
        {activeTab === 'prototypes' && (
          <PrototypesView prototypes={prototypes} loading={loading} onRefresh={loadAll} />
        )}
        {activeTab === 'logs' && (
          <BuildLogsView logs={logs} loading={loading} onRefresh={loadAll} />
        )}
        {activeTab === 'improvements' && <SelfImprovementView />}
      </div>
    </div>
  )
}
