import { useState, useEffect } from 'react'
import { Inbox as InboxIcon, Plus, Tag, Clock, Filter, CheckCircle2, ChevronDown, X, RefreshCw, Trash2, MessageSquare, Lightbulb } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import './Inbox.css'

const STATUS_CONFIG = {
  new: { label: 'Nova', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  reviewing: { label: 'Revisant', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  accepted: { label: 'Acceptada', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  rejected: { label: 'Rebutjada', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  done: { label: 'Feta', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' }
}

function IdeaCard({ item, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new
  
  return (
    <div className="inbox-card" style={{ borderColor: cfg.color + '25' }}>
      <div className="inbox-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="inbox-card-left">
          <Lightbulb size={14} style={{ color: cfg.color, flexShrink: 0 }} />
          <div className="inbox-card-meta">
            <span className="inbox-card-title">{item.title}</span>
            <div className="inbox-card-tags-row">
              <span className="inbox-date">
                <Clock size={10} /> {item.created}
              </span>
              {item.tags.map(t => (
                <span key={t} className="inbox-tag">#{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="inbox-card-right">
          <span className="inbox-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
          <ChevronDown size={13} className={`inbox-chevron ${expanded ? 'rotated' : ''}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="inbox-card-body">
          <p className="inbox-card-content">{item.body || 'Sense descripció'}</p>
          <div className="inbox-card-actions">
            <select
              className="inbox-status-select"
              value={item.status}
              onChange={e => onUpdate(item.file, { status: e.target.value })}
              style={{ borderColor: cfg.color + '50', color: cfg.color }}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button className="inbox-delete-btn" onClick={() => onDelete(item.file)} title="Eliminar">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NewIdeaForm({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [type, setType] = useState('idea')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() && !body.trim()) return
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
    onSave({ title: title.trim() || body.slice(0, 50), body: body.trim(), tags: tagList, type })
  }
  
  return (
    <form className="inbox-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Títol</label>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Títol de la idea..." />
      </div>
      <div className="form-field">
        <label>Descripció</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Descriu la teva idea..." rows={4} />
      </div>
      <div className="form-field-row">
        <div className="form-field">
          <label>Tags (separats per comes)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="navi-os, automation, ia..." />
        </div>
        <div className="form-field" style={{ width: 140 }}>
          <label>Tipus</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="idea">Idea</option>
            <option value="note">Nota</option>
            <option value="bug">Bug</option>
            <option value="request">Request</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onClose}>Cancel·lar</button>
        <button type="submit" className="btn-save">Guardar</button>
      </div>
    </form>
  )
}

export default function Inbox() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const loadItems = () => {
    setLoading(true)
    fetch('/api/inbox')
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  
  useEffect(() => { loadItems() }, [])
  
  const handleSave = async (data) => {
    setSaving(true)
    try {
      const res = await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'inbox-ui' })
      })
      const result = await res.json()
      if (result.ok) {
        setShowForm(false)
        loadItems()
      }
    } finally { setSaving(false) }
  }
  
  const handleUpdate = async (filename, data) => {
    await fetch(`/api/inbox/${filename}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    loadItems()
  }
  
  const handleDelete = async (filename) => {
    if (!confirm('Eliminar aquesta idea?')) return
    await fetch(`/api/inbox/${filename}`, { method: 'DELETE' })
    loadItems()
  }
  
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const counts = { all: items.length, ...Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, items.filter(i => i.status === k).length])) }
  
  return (
    <div className="inbox-module">
      <div className="inbox-header">
        <div className="inbox-title-row">
          <div className="inbox-title-group">
            <InboxIcon size={20} className="inbox-icon" />
            <h2>Bústia d'Idees</h2>
          </div>
          <button className="inbox-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Nova Idea
          </button>
        </div>
        <p className="inbox-subtitle">
          Ideas, notes i peticions teves. Estructurat com Obsidian Vault per facilitar la gestió amb els chiefs.
        </p>
      </div>
      
      {/* Filters */}
      <div className="inbox-filters">
        {['all', ...Object.keys(STATUS_CONFIG)].map(f => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {STATUS_CONFIG[f]?.label || 'Totes'}
            <span className="filter-count">{counts[f] || 0}</span>
          </button>
        ))}
      </div>
      
      {/* Items */}
      {loading ? (
        <div className="inbox-loading">
          <RefreshCw size={20} className="spin" />
          <span>Carregant idees...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="inbox-empty">
          <MessageSquare size={32} style={{ opacity: 0.2 }} />
          <p>{filter === 'all' ? 'No hay idees encara. Clica "Nova Idea" per afegir la primera!' : `No hay idees "${STATUS_CONFIG[filter]?.label || filter}"`}</p>
        </div>
      ) : (
        <div className="inbox-list">
          {filtered.map(item => (
            <IdeaCard key={item.file} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
      
      {/* New Idea Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="inbox-modal-header">
            <h3><Lightbulb size={16} /> Nova Idea</h3>
            <button className="modal-close" onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <NewIdeaForm onSave={handleSave} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
