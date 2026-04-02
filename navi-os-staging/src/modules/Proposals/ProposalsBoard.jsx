import { useState, useEffect, useCallback } from 'react'
import { Lightbulb, Plus, X, Clock, User, AlertTriangle, Check, Ban, Play, Archive, MessageSquare, CheckCircle, RotateCcw, Zap, Timer } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import './ProposalsBoard.css'

const STATUSES = [
  { id: 'preshape',   label: 'Pre-Shape',           color: '#8b5cf6', icon: Zap },
  { id: 'debate',     label: 'En debat',             color: '#bf5af2', icon: MessageSquare },
  { id: 'pending',    label: 'Pendent (48h)',        color: '#ffb800', icon: Timer },
  { id: 'staging',    label: 'Implementades Staging', color: '#f97316', icon: Play },
  { id: 'testing',    label: 'Testing',              color: '#00b4d8', icon: CheckCircle },
  { id: 'done',       label: 'Completada',            color: '#30d158', icon: Archive },
]

const PRIORITIES = [
  { id: 'alta',    label: 'Alta',    color: '#ff453a' },
  { id: 'media',   label: 'Mitjana', color: '#ffb800' },
  { id: 'baixa',   label: 'Baixa',   color: '#30d158' },
]

const CHIEFS = [
  { id: 'elom',   label: 'ELOM' },
  { id: 'warren', label: 'WARREN' },
  { id: 'jeff',   label: 'JEFF' },
  { id: 'sam',    label: 'SAM' },
]

const SLA_HOURS = 48

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find(p => p.id === priority) || PRIORITIES[1]
  return (
    <span className="pb-priority-badge" style={{ '--pcolor': p.color }}>
      <AlertTriangle size={10} />
      {p.label}
    </span>
  )
}

function SLABadge({ createdAt }) {
  if (!createdAt) return null
  const created = new Date(createdAt)
  const now = new Date()
  const hours = Math.floor((now - created) / (1000 * 60 * 60))
  const remaining = SLA_HOURS - hours
  const isOverdue = remaining < 0
  const isWarning = remaining >= 0 && remaining <= 12

  return (
    <span className={`pb-sla-badge ${isOverdue ? 'overdue' : isWarning ? 'warning' : ''}`}>
      <Timer size={10} />
      {isOverdue ? `${Math.abs(remaining)}h tard` : `${remaining}h left`}
    </span>
  )
}

function RejectModal({ isOpen, onClose, onSubmit, title, subtitle }) {
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason.trim())
      setReason('')
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="pb-reject-modal">
        <p className="pb-reject-desc">{subtitle}</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Explica per què... (obligatori perquè l'equip pugui millorar)"
          rows={4}
          autoFocus
        />
        <div className="pb-reject-actions">
          <button className="pb-btn-cancel" onClick={onClose}>Cancel·lar</button>
          <button className="pb-btn-reject" onClick={handleSubmit} disabled={!reason.trim()}>
            <Ban size={14} /> Rebutjar i tornar a debat
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ProposalCard({ proposal, onAction, onDelete }) {
  const authorChief = CHIEFS.find(c => c.id === proposal.author)

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })
    } catch { return iso }
  }

  const area = proposal.area ? (
    <span className="pb-card-area">{proposal.area}</span>
  ) : null

  const isOverdue = proposal.status === 'pending' && proposal.createdAt &&
    ((new Date() - new Date(proposal.createdAt)) / (1000 * 60 * 60)) > SLA_HOURS

  return (
    <div className={`pb-card ${isOverdue ? 'overdue' : ''}`} data-status={proposal.status}>
      <div className="pb-card-header">
        <span className="pb-card-title">{proposal.title}</span>
        <button className="pb-card-delete" onClick={() => onDelete(proposal.id)} title="Eliminar">
          <X size={12} />
        </button>
      </div>

      {proposal.description && (
        <p className="pb-card-desc">{proposal.description}</p>
      )}

      {proposal.rejectionReason && (
        <div className="pb-rejection-reason">
          <AlertTriangle size={10} />
          <span>{proposal.rejectionReason}</span>
        </div>
      )}

      <div className="pb-card-meta">
        {authorChief && (
          <span className="pb-card-author">
            <User size={10} />
            {authorChief.label}
          </span>
        )}
        <span className="pb-card-date">
          <Clock size={10} />
          {formatDate(proposal.createdAt)}
        </span>
        <PriorityBadge priority={proposal.priority} />
        {area}
        {proposal.status === 'pending' && <SLABadge createdAt={proposal.createdAt} />}
      </div>

      <div className="pb-card-actions">
        {/* PRE-SHAPE → DEBATE */}
        {proposal.status === 'preshape' && (
          <button
            className="pb-move-btn next"
            style={{ '--ac': '#bf5af2' }}
            onClick={() => onAction(proposal.id, 'debate')}
          >
            <MessageSquare size={13} />
            Portar a debat
          </button>
        )}

        {/* DEBATE → PENDING */}
        {proposal.status === 'debate' && (
          <>
            <button
              className="pb-move-btn next"
              style={{ '--ac': '#00b4d8' }}
              onClick={() => onAction(proposal.id, 'pending')}
            >
              <CheckCircle size={13} />
              Aprovar
            </button>
            <button
              className="pb-move-btn prev"
              style={{ '--ac': '#ff453a' }}
              onClick={() => onAction(proposal.id, 'reject_with_reason')}
            >
              <Ban size={13} />
              Rebutjar
            </button>
          </>
        )}

        {/* PENDING → STAGING */}
        {proposal.status === 'pending' && (
          <>
            <button
              className="pb-move-btn next"
              style={{ '--ac': '#f97316' }}
              onClick={() => onAction(proposal.id, 'staging')}
            >
              <Play size={13} />
              Acceptar
            </button>
            <button
              className="pb-move-btn prev"
              style={{ '--ac': '#bf5af2' }}
              onClick={() => onAction(proposal.id, 'reject_with_reason')}
            >
              <Ban size={13} />
              Rebutjar
            </button>
          </>
        )}

        {/* STAGING → TESTING */}
        {proposal.status === 'staging' && (
          <>
            <button
              className="pb-move-btn next"
              style={{ '--ac': '#00b4d8' }}
              onClick={() => onAction(proposal.id, 'testing')}
            >
              <CheckCircle size={13} />
              Testing
            </button>
            <button
              className="pb-move-btn prev"
              style={{ '--ac': '#bf5af2' }}
              onClick={() => onAction(proposal.id, 'reject_with_reason')}
            >
              <Ban size={13} />
              Rebutjar
            </button>
          </>
        )}

        {/* TESTING → DONE */}
        {proposal.status === 'testing' && (
          <>
            <button
              className="pb-move-btn next done"
              onClick={() => onAction(proposal.id, 'done')}
            >
              <Check size={13} />
              Verificar
            </button>
            <button
              className="pb-move-btn prev"
              style={{ '--ac': '#bf5af2' }}
              onClick={() => onAction(proposal.id, 'reject_with_reason')}
            >
              <Ban size={13} />
              Rebutjar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CreateForm({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('elom')
  const [priority, setPriority] = useState('media')
  const [impact, setImpact] = useState('')
  const [effort, setEffort] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ 
      title: title.trim(), 
      description: description.trim(), 
      author, 
      priority,
      impact,
      effort
    })
  }

  return (
    <div className="pb-form-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="pb-form glass-strong" onSubmit={handleSubmit}>
        <div className="pb-form-header">
          <h3><Lightbulb size={16} /> Nova Proposta</h3>
          <button type="button" className="pb-form-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="pb-form-field">
          <label>Titol *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Què proposem millorar?"
            autoFocus
            required
          />
        </div>

        <div className="pb-form-field">
          <label>Descripcio</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripció detallada..."
            rows={2}
          />
        </div>

        <div className="pb-form-row">
          <div className="pb-form-field">
            <label>Chief</label>
            <select value={author} onChange={e => setAuthor(e.target.value)}>
              {CHIEFS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="pb-form-field">
            <label>Prioritat</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pb-form-row">
          <div className="pb-form-field">
            <label>Impacte (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={impact}
              onChange={e => setImpact(e.target.value)}
              placeholder="Valor que aporta"
            />
          </div>
          <div className="pb-form-field">
            <label>Esforç (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={effort}
              onChange={e => setEffort(e.target.value)}
              placeholder="Cost de fer-ho"
            />
          </div>
        </div>

        <button type="submit" className="pb-form-submit">
          <Plus size={14} /> Crear Proposta
        </button>
      </form>
    </div>
  )
}

function Column({ statusDef, proposals, onAction, onDelete }) {
  return (
    <div className="pb-column" style={{ '--cc': statusDef.color }}>
      <div className="pb-col-header">
        <div className="pb-col-title-row">
          <statusDef.icon size={14} style={{ color: statusDef.color }} />
          <span className="pb-col-title">{statusDef.label}</span>
        </div>
        <span className="pb-col-count">{proposals.length}</span>
      </div>

      <div className="pb-col-cards">
        {proposals.length === 0 ? (
          <div className="pb-col-empty">
            <statusDef.icon size={18} style={{ opacity: 0.2 }} />
            <span>Buit</span>
          </div>
        ) : (
          proposals.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onAction={onAction}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function ProposalsBoard() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: null, title: '', subtitle: '' })

  const loadProposals = useCallback(() => {
    fetch('/api/self-improvement/proposals')
      .then(r => r.json())
      .then(d => {
        const normalized = (d.proposals || []).map(p => ({
          id: p.id,
          title: p.title,
          description: p.description || p.impact || '',
          author: p.author || 'navi',
          status: mapStatus(p.status),
          priority: normalizePriority(p.priority),
          createdAt: p.generatedDate ? `${p.generatedDate}T00:00:00Z` : p.createdAt,
          area: p.area,
          steps: p.steps,
          rejectionReason: p.rejectionReason || null,
          source: 'self-improvement'
        }))
        setProposals(normalized)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadProposals() }, [loadProposals])

  // Auto-refresh every minute for SLA tracking
  useEffect(() => {
    const interval = setInterval(loadProposals, 60000)
    return () => clearInterval(interval)
  }, [loadProposals])

  function mapStatus(siStatus) {
    // Map Self-Improvement status to our pipeline
    if (siStatus === 'pending') return 'pending'
    if (siStatus === 'approved') return 'staging'
    if (siStatus === 'processing') return 'testing'
    if (siStatus === 'executed') return 'done'
    if (siStatus === 'denied') return 'debate'
    return 'preshape'
  }

  function normalizePriority(siPriority) {
    if (!siPriority) return 'media'
    const p = siPriority.toLowerCase()
    if (p.includes('critic') || p.includes('🔴')) return 'alta'
    if (p.includes('mitj') || p.includes('🟠')) return 'media'
    return 'baixa'
  }

  const handleAction = (id, action) => {
    if (action === 'reject_with_reason') {
      const proposal = proposals.find(p => p.id === id)
      setRejectModal({
        isOpen: true,
        id,
        title: proposal?.title || '',
        subtitle: 'Explica per què tanques aquesta proposta. L\'equip la podrà reavaluar.'
      })
      return
    }

    if (action === 'preshape') {
      // Stay in preshape - just viewing
    } else if (action === 'debate') {
      fetch('/api/self-improvement/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id.split('-').slice(-2).join('-'),
          generatedDate: id.split('-').slice(0, 3).join('-')
        })
      }).then(() => loadProposals())
    } else if (action === 'pending') {
      fetch('/api/self-improvement/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id.split('-').slice(-2).join('-'),
          generatedDate: id.split('-').slice(0, 3).join('-')
        })
      }).then(() => loadProposals())
    } else if (action === 'staging') {
      fetch('/api/self-improvement/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id.split('-').slice(-2).join('-'),
          generatedDate: id.split('-').slice(0, 3).join('-')
        })
      }).then(() => loadProposals())
    } else if (action === 'testing') {
      fetch('/api/self-improvement/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id.split('-').slice(-2).join('-'),
          generatedDate: id.split('-').slice(0, 3).join('-')
        })
      }).then(() => loadProposals())
    } else if (action === 'done') {
      fetch('/api/self-improvement/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id.split('-').slice(-2).join('-'),
          generatedDate: id.split('-').slice(0, 3).join('-')
        })
      }).then(() => loadProposals())
    }
  }

  const handleRejectWithReason = (reason) => {
    const id = rejectModal.id
    fetch(`/api/self-improvement/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'debate', rejectionReason: reason })
    }).then(() => {
      setRejectModal({ isOpen: false, id: null, title: '', subtitle: '' })
      loadProposals()
    })
  }

  const deleteProposal = (id) => {
    if (!confirm('Eliminar aquesta proposta?')) return
    fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      .then(() => loadProposals())
      .catch(() => {})
  }

  const createProposal = (data) => {
    fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(r => r.json())
      .then(() => {
        setShowForm(false)
        loadProposals()
      })
      .catch(() => {})
  }

  const getProposalsByStatus = (status) => {
    let filtered = proposals.filter(p => p.status === status)
    if (filter === 'mine') {
      filtered = filtered.filter(p => p.author === 'elom')
    }
    return filtered
  }

  const totalCount = proposals.length
  const doneCount = proposals.filter(p => p.status === 'done').length
  const overdueCount = proposals.filter(p => {
    if (p.status !== 'pending' || !p.createdAt) return false
    return ((new Date() - new Date(p.createdAt)) / (1000 * 60 * 60)) > SLA_HOURS
  }).length

  if (loading) {
    return (
      <div className="pb-loading">
        <div className="pb-spinner" />
        <span>Carregant propostes...</span>
      </div>
    )
  }

  return (
    <div className="pb-root">
      {/* Header */}
      <div className="pb-topbar">
        <div className="pb-topbar-left">
          <h1 className="pb-title">
            <Lightbulb size={20} className="amber neon-icon-amber" />
            Pipeline de Millores
          </h1>
          <span className="pb-total-badge">
            {totalCount} total · {doneCount} fetes
            {overdueCount > 0 && <span className="pb-overdue-count"> · {overdueCount} tard</span>}
          </span>
        </div>
        <div className="pb-topbar-right">
          <div className="pb-filter-toggle">
            <button
              className={`pb-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >Tot</button>
            <button
              className={`pb-filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >Els meus</button>
          </div>
          <button className="pb-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            Nova proposta
          </button>
        </div>
      </div>

      {/* Pipeline Legend */}
      <div className="pb-pipeline-legend">
        <span><Zap size={12} /> Pre-Shape</span>
        <span>→</span>
        <span><MessageSquare size={12} /> Debat</span>
        <span>→</span>
        <span><Timer size={12} /> Decisió (SLA 48h)</span>
        <span>→</span>
        <span><Play size={12} /> Staging</span>
        <span>→</span>
        <span><CheckCircle size={12} /> Testing</span>
        <span>→</span>
        <span><Archive size={12} /> Done</span>
      </div>

      {/* Board */}
      <div className="pb-board">
        {STATUSES.map(status => (
          <Column
            key={status.id}
            statusDef={status}
            proposals={getProposalsByStatus(status.id)}
            onAction={handleAction}
            onDelete={deleteProposal}
          />
        ))}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <CreateForm
          onClose={() => setShowForm(false)}
          onSubmit={createProposal}
        />
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, id: null, title: '', subtitle: '' })}
        onSubmit={handleRejectWithReason}
        title={rejectModal.title}
        subtitle={rejectModal.subtitle}
      />
    </div>
  )
}
