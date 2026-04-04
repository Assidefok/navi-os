import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Play, Pause, Plus, X, Settings, ChevronRight, ChevronDown,
  RefreshCw, Trash2, CheckCircle2, XCircle, AlertCircle, Clock,
  GitBranch, MessageSquare, Bell, Check, Ban, ArrowRight, Loader2,
  BarChart3, ToggleLeft, ToggleRight
} from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import SomiarSection from './SomiarSection'
import './AutomationsBoard.css'

const TRIGGER_TYPES = [
  { id: 'idea.accepted', label: 'Idea acceptada', icon: '✓', category: 'Lab' },
  { id: 'idea.rejected', label: 'Idea rebutjada', icon: '✗', category: 'Lab' },
  { id: 'debate.approved', label: 'Debat aprovat', icon: '✓', category: 'Proposals' },
  { id: 'debate.rejected', label: 'Debat rebutjat', icon: '✗', category: 'Proposals' },
  { id: 'proposal.status_changed', label: 'Proposta canvia estat', icon: '↔', category: 'Proposals' },
  { id: 'pm_board.task_created', label: 'Tasca creada al PM', icon: '+', category: 'PM Board' },
  { id: 'pm_board.task_assigned', label: 'Tasca assignada', icon: '→', category: 'PM Board' },
  { id: 'pm_board.task_done', label: 'Tasca completada', icon: '✓', category: 'PM Board' },
  { id: 'cron.daily', label: 'Una vegada al dia', icon: '⏰', category: 'Cron' },
  { id: 'cron.hourly', label: 'Cada hora', icon: '⏱', category: 'Cron' },
]

const ACTION_TYPES = [
  { id: 'proposal.create', label: 'Crear proposta', icon: '📋' },
  { id: 'proposal.update_status', label: 'Canviar estat proposta', icon: '↔' },
  { id: 'pm_board.create_task', label: 'Crear tasca al PM Board', icon: '📌' },
  { id: 'backlog.add', label: 'Afegir al BACKLOG agent', icon: '📝' },
  { id: 'message.send', label: 'Enviar missatge', icon: '💬' },
  { id: 'notification.send', label: 'Notificar (Telegram)', icon: '🔔' },
  { id: 'debate.set_outcome', label: 'Establir resultat debat', icon: '⚖' },
]

function AutomationCard({ automation, onToggle, onEdit, onDelete, onTest }) {
  const [expanded, setExpanded] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/automations/${automation.id}/trigger`, { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
    } catch (err) {
      setTestResult({ error: err.message })
    }
    setTesting(false)
  }

  const formatDate = (iso) => {
    if (!iso) return 'Mai'
    try { return new Date(iso).toLocaleString('ca-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  const triggerInfo = TRIGGER_TYPES.find(t => t.id === automation.trigger?.type)

  return (
    <div className={`automation-card ${automation.enabled ? 'enabled' : 'disabled'}`}>
      <div className="automation-header" onClick={() => setExpanded(v => !v)}>
        <div className="automation-header-left">
          <button className="expand-btn" onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className={`auto-status-dot ${automation.enabled ? 'on' : 'off'}`} />
          <span className="automation-name">{automation.name}</span>
          <span className="automation-trigger-badge">
            {triggerInfo?.icon} {triggerInfo?.label || automation.trigger?.type}
          </span>
        </div>
        <div className="automation-header-right">
          <span className="trigger-count" title="Vegades executada">
            <BarChart3 size={12} /> {automation.triggerCount || 0}
          </span>
          <span className="last-triggered" title="Última execució">
            <Clock size={11} /> {formatDate(automation.lastTriggered)}
          </span>
          <button
            className="icon-btn"
            onClick={e => { e.stopPropagation(); onToggle(automation.id) }}
            title={automation.enabled ? 'Desactivar' : 'Activar'}
          >
            {automation.enabled ? <ToggleRight size={18} className="green" /> : <ToggleLeft size={18} />}
          </button>
          <button
            className="icon-btn"
            onClick={e => { e.stopPropagation(); handleTest() }}
            title="Testejar ara"
            disabled={testing || !automation.enabled}
          >
            {testing ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
          </button>
          <button
            className="icon-btn"
            onClick={e => { e.stopPropagation(); onEdit(automation) }}
            title="Editar"
          >
            <Settings size={14} />
          </button>
          <button
            className="icon-btn danger"
            onClick={e => { e.stopPropagation(); onDelete(automation.id) }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {automation.description && (
        <p className="automation-description">{automation.description}</p>
      )}

      {testResult && (
        <div className={`test-result ${testResult.error ? 'error' : 'success'}`}>
          {testResult.error ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{testResult.error || `Executat: ${testResult.result?.length || 0} accions`}</span>
        </div>
      )}

      {expanded && (
        <div className="automation-details">
          <div className="detail-section">
            <h4><GitBranch size={13} /> Trigger</h4>
            <div className="trigger-config">
              <code>{automation.trigger?.type}</code>
              <span>{triggerInfo?.category}</span>
            </div>
          </div>

          <div className="detail-section">
            <h4><ArrowRight size={13} /> Accions ({automation.actions?.length || 0})</h4>
            <div className="actions-list">
              {automation.actions?.map((action, i) => {
                const actionInfo = ACTION_TYPES.find(a => a.id === action.type)
                return (
                  <div key={i} className="action-item">
                    <span className="action-icon">{actionInfo?.icon}</span>
                    <span className="action-label">{actionInfo?.label || action.type}</span>
                    {action.label && <span className="action-custom-label"> — {action.label}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AutomationForm({ automation, onSave, onClose }) {
  const [form, setForm] = useState({
    name: automation?.name || '',
    description: automation?.description || '',
    triggerType: automation?.trigger?.type || 'idea.accepted',
    actions: automation?.actions || [{ type: 'proposal.create', label: '' }]
  })

  const addAction = () => {
    setForm(f => ({ ...f, actions: [...f.actions, { type: 'proposal.create', label: '' }] }))
  }

  const removeAction = (idx) => {
    setForm(f => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }))
  }

  const updateAction = (idx, field, value) => {
    setForm(f => ({
      ...f,
      actions: f.actions.map((a, i) => i === idx ? { ...a, [field]: value } : a)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      ...automation,
      name: form.name.trim(),
      description: form.description.trim(),
      trigger: { type: form.triggerType },
      actions: form.actions.filter(a => a.type)
    })
  }

  return (
    <div className="auto-form-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="auto-form glass-strong" onSubmit={handleSubmit}>
        <div className="auto-form-header">
          <h3><Zap size={16} /> {automation?.id ? 'Editar Automatització' : 'Nova Automatització'}</h3>
          <button type="button" className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="auto-form-body">
          <div className="form-field">
            <label>Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom de l'automatització..."
              required
            />
          </div>

          <div className="form-field">
            <label>Descripció</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Què fa aquesta automatització..."
              rows={2}
            />
          </div>

          <div className="form-field">
            <label>Trigger (quan s'executa)</label>
            <div className="trigger-select-grid">
              {TRIGGER_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`trigger-option ${form.triggerType === t.id ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, triggerType: t.id }))}
                >
                  <span className="trigger-option-icon">{t.icon}</span>
                  <span className="trigger-option-label">{t.label}</span>
                  <span className="trigger-option-cat">{t.category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Accions (que fa quan s'executa)</label>
            {form.actions.map((action, idx) => {
              const actionInfo = ACTION_TYPES.find(a => a.id === action.type)
              return (
                <div key={idx} className="action-form-row">
                  <select
                    value={action.type}
                    onChange={e => updateAction(idx, 'type', e.target.value)}
                  >
                    <option value="">Selecciona acció...</option>
                    {ACTION_TYPES.map(a => (
                      <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={action.label || ''}
                    onChange={e => updateAction(idx, 'label', e.target.value)}
                    placeholder="Descripció opcional..."
                  />
                  {form.actions.length > 1 && (
                    <button type="button" className="icon-btn danger" onClick={() => removeAction(idx)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              )
            })}
            <button type="button" className="add-action-btn" onClick={addAction}>
              <Plus size={13} /> Afegir acció
            </button>
          </div>
        </div>

        <div className="auto-form-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel·lar</button>
          <button type="submit" className="submit-btn"><Check size={14} /> Guardar</button>
        </div>
      </form>
    </div>
  )
}

function ExecutionLog({ log }) {
  const formatDate = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleString('ca-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  return (
    <div className="exec-log">
      <div className="log-header">
        <h4><Clock size={13} /> Últimes execucions ({log.length})</h4>
      </div>
      <div className="log-entries">
        {log.length === 0 && <div className="log-empty">Cap execució registrada</div>}
        {log.slice().reverse().map((entry, i) => (
          <div key={i} className={`log-entry ${entry.success ? 'success' : 'error'}`}>
            <div className="log-entry-header">
              <span className={`log-status-icon ${entry.success ? 'ok' : 'err'}`}>
                {entry.success ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              </span>
              <span className="log-auto-name">{entry.automationName}</span>
              <span className="log-trigger-type">{entry.trigger}</span>
              <span className="log-time">{formatDate(entry.executedAt)}</span>
            </div>
            {entry.results?.map((r, j) => (
              <div key={j} className={`log-action-result ${r.success ? '' : 'error'}`}>
                <span>{r.action}</span>
                <span>{r.success ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AutomationsBoard() {
  const [automations, setAutomations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAuto, setEditingAuto] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(false)

  const loadAutomations = useCallback(() => {
    fetch('/api/automations')
      .then(r => r.json())
      .then(d => { setAutomations(d.automations || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const loadLog = useCallback(() => {
    setLogLoading(true)
    fetch('/api/automations/log')
      .then(r => r.json())
      .then(d => { setLog(d.log || []); setLogLoading(false) })
      .catch(() => setLogLoading(false))
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => loadAutomations())
  }, [loadAutomations])

  const handleToggle = async (id) => {
    await fetch(`/api/automations/${id}/toggle`, { method: 'POST' })
    loadAutomations()
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar aquesta automatització?')) return
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    loadAutomations()
  }

  const handleSave = async (autoData) => {
    if (autoData.id) {
      await fetch(`/api/automations/${autoData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoData)
      })
    } else {
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoData)
      })
    }
    setShowForm(false)
    setEditingAuto(null)
    loadAutomations()
  }

  const handleEdit = (auto) => {
    setEditingAuto(auto)
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingAuto(null)
    setShowForm(true)
  }

  const stats = {
    total: automations.length,
    enabled: automations.filter(a => a.enabled).length,
    disabled: automations.filter(a => !a.enabled).length,
    totalRuns: automations.reduce((sum, a) => sum + (a.triggerCount || 0), 0)
  }

  return (
    <div className="automations-board">
      <div className="ab-header">
        <div className="ab-header-left">
          <h1 className="ab-title"><Zap size={22} className="amber neon-icon-amber" /> Automatitzacions</h1>
          <div className="ab-stats">
            <span className="stat"><Play size={12} className="green" /> {stats.enabled} actives</span>
            <span className="stat"><Pause size={12} /> {stats.disabled} inactives</span>
            <span className="stat"><BarChart3 size={12} /> {stats.totalRuns} execucions totals</span>
          </div>
        </div>
        <div className="ab-header-right">
          <button className="log-toggle-btn" onClick={() => { setShowLog(v => !v); if (!showLog) loadLog() }}>
            <Clock size={14} /> {showLog ? 'Amaga' : 'Mostra'} log
          </button>
          <button className="ab-add-btn" onClick={handleNew}>
            <Plus size={15} /> Nova automatització
          </button>
        </div>
      </div>

      {showLog && (
        <ExecutionLog log={log} />
      )}

      {loading ? (
        <div className="ab-loading">
          <Loader2 size={24} className="spin" />
          <span>Carregant automatitzacions...</span>
        </div>
      ) : automations.length === 0 ? (
        <div className="ab-empty">
          <Zap size={40} style={{ opacity: 0.2 }} />
          <h3>Cap automatització</h3>
          <p>Les automatitzacions connecten triggers amb accions — quan passa algo, fan coses automàticament.</p>
          <button className="ab-add-btn" onClick={handleNew}>
            <Plus size={14} /> Crear primera automatització
          </button>
        </div>
      ) : (
        <div className="automations-list">
          <SomiarSection />
          {automations.map(auto => (
            <AutomationCard
              key={auto.id}
              automation={auto}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AutomationForm
          automation={editingAuto}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingAuto(null) }}
        />
      )}
    </div>
  )
}
