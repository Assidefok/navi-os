import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  if (['running', 'healthy', 'ok', 'done', 'delivered', 'approved', 'executed'].includes(status)) return 'running'
  if (['failed', 'error', 'denied', 'rejected'].includes(status)) return 'failed'
  if (['archived', 'disabled', 'stopped'].includes(status)) return 'muted'
  if (['pending', 'warning', 'review'].includes(status)) return 'warning'
  return 'neutral'
}

function LabTopTabs({ activeTab, onChange }) {
  const tabs = [
    ['overview', 'Dashboard'],
    ['prototypes', 'Prototypes'],
    ['logs', 'Build Logs'],
    ['pipeline', 'Pipeline'],
  ]

  return (
    <div className="lab-top-tabs minimal">
      {tabs.map(([id, label]) => (
        <button key={id} className={`lab-top-tab minimal ${activeTab === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  )
}

function normalizePreviewUrl(proto) {
  if (proto.previewUrl) return proto.previewUrl
  if (proto.port) return `http://127.0.0.1:${proto.port}`
  return null
}

function LabOverview({ prototypes, logs, loading, openPrototype, openLog, openImprovements }) {
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
        <button className="lab-summary-card" onClick={openPrototype}>
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

        <button className="lab-summary-card" onClick={openLog}>
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
  if (priority.toLowerCase().includes('alt') || priority.includes('🟡')) return 'warning'
  if (priority.toLowerCase().includes('baix') || priority.includes('🟢')) return 'ok'
  return 'neutral'
}

function statusBadge(status) {
  switch (status) {
    case 'pending': return { label: 'Pendent', class: 'neutral' }
    case 'approved': return { label: 'Aprovat', class: 'running' }
    case 'denied': return { label: 'Rebutjat', class: 'failed' }
    case 'executed': return { label: 'Executat', class: 'ok' }
    default: return { label: status, class: 'neutral' }
  }
}

function ProposalStatusBanner({ proposal }) {
  const badge = statusBadge(proposal.status)

  return (
    <div className={`lab-proposal-status-banner ${badge.class}`}>
      <span className={`lab-pill ${badge.class}`}>{badge.label}</span>
      <div className="lab-proposal-status-copy">
        <strong>{badge.label}</strong>
        <span>
          {proposal.status === 'approved' && 'A punt per desplegar-se aquesta nit. Encara la pots rebutjar si canvies d’opinió.'}
          {proposal.status === 'pending' && 'Pendent de decisió. Revisa el detall i decideix si l’acceptes o la rebutges.'}
          {proposal.status === 'denied' && 'Rebutjada. Pots reobrir-la i acceptar-la després si la vols recuperar.'}
          {proposal.status === 'executed' && 'Ja s’ha executat. El detall queda visible com a historial de la millora.'}
        </span>
      </div>
    </div>
  )
}

function ProposalCard({ proposal, onOpen }) {
  const badge = statusBadge(proposal.status)

  return (
    <button
      type="button"
      className={`lab-proposal-card lab-proposal-card-clickable lab-proposal-card-${proposal.status}`}
      onClick={() => onOpen(proposal)}
    >
      <div className="lab-proposal-header">
        <div className="lab-proposal-id">{proposal.id}</div>
        <div className="lab-proposal-header-right">
          {proposal.priority && (
            <span className={`lab-pill ${priorityColor(proposal.priority)}`}>
              {proposal.priority?.replace(/[🔴🟡🟢]/g, '').trim() || '—'}
            </span>
          )}
          <span className={`lab-pill ${badge.class}`}>{badge.label}</span>
        </div>
      </div>

      <h4 className="lab-proposal-title">{proposal.title}</h4>
      <p className="lab-proposal-description">{proposal.description || 'Sense descripció'}</p>

      <div className="lab-proposal-meta">
        <div className="lab-proposal-meta-item">
          <Clock size={12} />
          {proposal.generatedDate}
        </div>
        {proposal.buildLog && (
          <div className="lab-proposal-meta-item">
            <FileText size={12} />
            {proposal.buildLog}
          </div>
        )}
      </div>

      <div className="lab-proposal-card-footer">
        <span>Obrir detall</span>
        <ChevronRight size={16} />
      </div>
    </button>
  )
}

function ProposalDetail({ proposal, processing, onApprove, onDeny, onFinalize }) {
  return (
    <div className="lab-proposal-detail">
      <ProposalStatusBanner proposal={proposal} />

      <div className="lab-proposal-detail-block">
        <h4>Què s’espera d’aquesta millora</h4>
        <p>{proposal.description || proposal.impact || 'Sense descripció disponible.'}</p>
      </div>

      <div className="lab-proposal-detail-grid">
        <div className="lab-proposal-detail-block">
          <h4>Metadades</h4>
          <div className="lab-proposal-detail-list">
            <div><strong>Àrea:</strong> {proposal.area || '—'}</div>
            <div><strong>Tipus:</strong> {proposal.type || '—'}</div>
            <div><strong>Prioritat:</strong> {proposal.priority || '—'}</div>
            <div><strong>Impacte:</strong> {proposal.impact || '—'}</div>
            <div><strong>Risc:</strong> {proposal.risk || '—'}</div>
            <div><strong>Generada:</strong> {proposal.generatedDate || '—'}</div>
            {proposal.approvedAt && <div><strong>Aprovada:</strong> {formatDate(proposal.approvedAt)}</div>}
            {proposal.deniedAt && <div><strong>Rebutjada:</strong> {formatDate(proposal.deniedAt)}</div>}
          </div>
        </div>

        <div className="lab-proposal-detail-block">
          <h4>Implementació prevista</h4>
          {proposal.steps && proposal.steps.length > 0 ? (
            <ol className="lab-proposal-detail-steps">
              {proposal.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          ) : (
            <p>No hi ha passos detallats per aquesta proposta.</p>
          )}
        </div>
      </div>

      <div className="lab-proposal-actions lab-proposal-actions-detail">
        {proposal.status !== 'executed' && (
          <button
            className="lab-btn-approve"
            onClick={() => proposal.status === 'approved' ? onFinalize(proposal) : onApprove(proposal)}
            disabled={processing === proposal.id}
          >
            {processing === proposal.id ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
            {proposal.status === 'approved' ? 'Portar a final' : 'Acceptar a staging'}
          </button>
        )}
        <button
          className="lab-btn-deny"
          onClick={() => onDeny(proposal)}
          disabled={processing === proposal.id}
        >
          <X size={14} />
          {proposal.status === 'approved' ? 'Rebutjar des de staging' : 'Rebutjar'}
        </button>
      </div>
    </div>
  )
}

function SelfImprovementView() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [selectedProposal, setSelectedProposal] = useState(null)

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
        setSelectedProposal(current => current?.id === proposal.id ? { ...current, status: 'approved', approvedAt: new Date().toISOString() } : current)
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

  const handleFinalize = async (proposal) => {
    setProcessing(proposal.id)
    setFeedback(null)
    try {
      const res = await fetch(`${API_BASE}/self-improvement/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id, generatedDate: proposal.generatedDate }),
      })
      const data = await res.json()
      if (data.ok) {
        setFeedback({ type: 'success', message: `${proposal.id} promogut a final` })
        setSelectedProposal(current => current?.id === proposal.id ? { ...current, status: 'executed', executedAt: new Date().toISOString() } : current)
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
        setFeedback({ type: 'success', message: `${proposal.id} rebutjat` })
        setSelectedProposal(current => current?.id === proposal.id ? { ...current, status: 'denied', deniedAt: new Date().toISOString() } : current)
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
            <h2>Pipeline</h2>
          </div>
        </div>
        <button className="lab-refresh-btn" onClick={loadProposals}>
          <RefreshCw size={14} /> Actualitzar
        </button>
      </div>
      <div className="lab-improvements-subtitle">Lab → Staging → Final</div>

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
        <>
          <div className="lab-improvements-content">
            {pendingProposals.length > 0 && (
              <div className="lab-improvements-section">
                <h3 className="lab-improvements-section-title">
                  <AlertCircle size={16} /> Pendents de Revisar ({pendingProposals.length})
                </h3>
                <div className="lab-proposal-cards">
                  {pendingProposals.map(proposal => (
                    <ProposalCard key={proposal.id} proposal={proposal} onOpen={setSelectedProposal} />
                  ))}
                </div>
              </div>
            )}

            {approvedProposals.length > 0 && (
              <div className="lab-improvements-section">
                <h3 className="lab-improvements-section-title">
                  <CheckCircle2 size={16} /> Staging ({approvedProposals.length}) — Validades a l’espera de pujar a final
                </h3>
                <div className="lab-proposal-cards">
                  {approvedProposals.map(proposal => (
                    <ProposalCard key={proposal.id} proposal={proposal} onOpen={setSelectedProposal} />
                  ))}
                </div>
              </div>
            )}

            {executedProposals.length > 0 && (
              <div className="lab-improvements-section">
                <h3 className="lab-improvements-section-title">
                  <CheckCircle2 size={16} /> Final ({executedProposals.length})
                </h3>
                <div className="lab-proposal-cards">
                  {executedProposals.map(proposal => (
                    <ProposalCard key={proposal.id} proposal={proposal} onOpen={setSelectedProposal} />
                  ))}
                </div>
              </div>
            )}

            {deniedProposals.length > 0 && (
              <div className="lab-improvements-section">
                <h3 className="lab-improvements-section-title">
                  <AlertCircle size={16} /> Rebutjades ({deniedProposals.length})
                </h3>
                <div className="lab-proposal-cards">
                  {deniedProposals.map(proposal => (
                    <ProposalCard key={proposal.id} proposal={proposal} onOpen={setSelectedProposal} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Modal
            isOpen={!!selectedProposal}
            onClose={() => setSelectedProposal(null)}
            title={selectedProposal?.title || 'Proposta'}
            width="760px"
          >
            {selectedProposal && (
              <ProposalDetail
                proposal={selectedProposal}
                processing={processing}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            )}
          </Modal>
        </>
      )}
    </section>
  )
}

export default function Lab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  const [selectedPrototype, setSelectedPrototype] = useState(null)
  const [selectedLogId, setSelectedLogId] = useState(null)
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

  const selectedLog = useMemo(() => logs.find(log => log.id === selectedLogId) || logs[0] || null, [logs, selectedLogId])

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview'
    if (tab !== activeTab) setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    const current = searchParams.get('tab')
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams)
      next.set('tab', activeTab)
      setSearchParams(next, { replace: true })
    }
  }, [activeTab])

  return (
    <div className="module-view lab lab-dashboard-module">
      <section className="lab-shell lab-lab-shell">
        <div className="lab-overview-header">
          <div className="lab-overview-title">
            <FlaskConical size={22} />
            <div>
              <h1>Laboratory</h1>
              <p>Dashboard general, pestanyes i pipeline de propostes</p>
            </div>
          </div>
        </div>

        <LabTopTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="lab-content-shell">
          {activeTab === 'overview' && (
            <LabOverview
              prototypes={prototypes}
              logs={logs}
              loading={loading}
              openPrototype={() => setActiveTab('prototypes')}
              openLog={() => setActiveTab('logs')}
              openImprovements={() => setActiveTab('pipeline')}
            />
          )}
          {activeTab === 'prototypes' && (
            <PrototypesView prototypes={prototypes} loading={loading} onRefresh={loadAll} />
          )}
          {activeTab === 'logs' && (
            <BuildLogsView logs={logs} loading={loading} onRefresh={loadAll} initialSelectedLogId={selectedLog?.id} />
          )}
          {activeTab === 'pipeline' && <SelfImprovementView />}
        </div>
      </section>
    </div>
  )
}
