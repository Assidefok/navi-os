import { useState, useEffect, useCallback } from 'react'
import { Lightbulb, Plus, ChevronRight, ChevronLeft, X, Clock, User, AlertTriangle, Check, Ban, Play, Archive, MessageSquare } from 'lucide-react'
import './ProposalsBoard.css'

const STATUSES = [
  { id: 'rejected',   label: 'Rebutjada',   color: '#ff453a', icon: Ban },
  { id: 'pending',    label: 'Pendent',      color: '#ffb800', icon: Clock },
  { id: 'debate',     label: 'En debat',     color: '#bf5af2', icon: MessageSquare },
  { id: 'accepted',   label: 'Per fer',      color: '#00b4d8', icon: Check },
  { id: 'processing', label: 'En procés',    color: '#f97316', icon: Play },
  { id: 'done',       label: 'Completada',   color: '#30d158', icon: Archive },
]

const PRIORITIES = [
  { id: 'alta',    label: 'Alta',    color: '#ff453a' },
  { id: 'media',   label: 'Mitjana', color: '#ffb800' },
  { id: 'baixa',   label: 'Baixa',   color: '#30d158' },
]

const CHIEFS = [
  { id: 'elom',   label: 'ELOM (Visionari)' },
  { id: 'warren', label: 'WARREN (Qualitat)' },
  { id: 'jeff',   label: 'JEFF (Operacions)' },
  { id: 'sam',    label: 'SAM (AI)' },
]

function PriorityBadge({ priority }) {
  const p = PRIORITIES.find(p => p.id === priority) || PRIORITIES[1]
  return (
    <span className="pb-priority-badge" style={{ '--pcolor': p.color }}>
      <AlertTriangle size={10} />
      {p.label}
    </span>
  )
}

function ProposalCard({ proposal, onMove, onDelete }) {
  const authorChief = CHIEFS.find(c => c.id === proposal.author)

  const canMoveTo = (status) => {
    const idx = STATUSES.findIndex(s => s.id === status)
    return STATUSES.map(s => s.id)
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: '2-digit' })
    } catch { return iso }
  }

  // Show move buttons for adjacent statuses
  const currentIdx = STATUSES.findIndex(s => s.id === proposal.status)
  const prevStatus = currentIdx > 0 ? STATUSES[currentIdx - 1] : null
  const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null

  return (
    <div className="pb-card" data-status={proposal.status}>
      <div className="pb-card-header">
        <span className="pb-card-title">{proposal.title}</span>
        <button className="pb-card-delete" onClick={() => onDelete(proposal.id)} title="Eliminar">
          <X size={12} />
        </button>
      </div>

      {proposal.description && (
        <p className="pb-card-desc">{proposal.description}</p>
      )}

      <div className="pb-card-meta">
        {authorChief && (
          <span className="pb-card-author">
            <User size={10} />
            {authorChief.label.split(' ')[0]}
          </span>
        )}
        <span className="pb-card-date">
          <Clock size={10} />
          {formatDate(proposal.createdAt)}
        </span>
        <PriorityBadge priority={proposal.priority} />
      </div>

      <div className="pb-card-actions">
        {prevStatus && (
          <button
            className="pb-move-btn prev"
            style={{ '--ac': prevStatus.color }}
            onClick={() => onMove(proposal.id, prevStatus.id)}
            title={`Moure a ${prevStatus.label}`}
          >
            <ChevronLeft size={13} />
            {prevStatus.label}
          </button>
        )}
        {nextStatus && (
          <button
            className="pb-move-btn next"
            style={{ '--ac': nextStatus.color }}
            onClick={() => onMove(proposal.id, nextStatus.id)}
            title={`Moure a ${nextStatus.label}`}
          >
            {nextStatus.label}
            <ChevronRight size={13} />
          </button>
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), author, priority })
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
            placeholder="Titol de la proposta..."
            autoFocus
            required
          />
        </div>

        <div className="pb-form-field">
          <label>Descripcio</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripcio mes detallada..."
            rows={3}
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

        <button type="submit" className="pb-form-submit">
          <Plus size={14} /> Crear Proposta
        </button>
      </form>
    </div>
  )
}

function Column({ statusDef, proposals, onMove, onDelete }) {
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
              onMove={onMove}
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
  const [filter, setFilter] = useState('all') // all | mine

  const loadProposals = useCallback(() => {
    fetch('/api/proposals')
      .then(r => r.json())
      .then(d => {
        setProposals(d.proposals || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadProposals() }, [loadProposals])

  const moveProposal = (id, newStatus) => {
    fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(r => r.json())
      .then(() => loadProposals())
      .catch(() => {})
  }

  const deleteProposal = (id) => {
    if (!confirm('Eliminar aquesta proposta?')) return
    fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      .then(r => r.json())
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
      filtered = filtered.filter(p => p.author === 'elom') // Aleix sees "mine" as ELOM
    }
    return filtered
  }

  const totalCount = proposals.length
  const doneCount = proposals.filter(p => p.status === 'done').length

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
            Propostes
          </h1>
          <span className="pb-total-badge">{totalCount} total · {doneCount} fetes</span>
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

      {/* Board */}
      <div className="pb-board">
        {STATUSES.map(status => (
          <Column
            key={status.id}
            statusDef={status}
            proposals={getProposalsByStatus(status.id)}
            onMove={moveProposal}
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
    </div>
  )
}
