import { useState, useEffect } from 'react'
import { List, Plus, Pencil, Trash2, AlertCircle, X } from 'lucide-react'
import './TaskManager.css'

const STAGES = [
  { id: 'intake', label: 'Intake', color: '#a78bfa' },
  { id: 'scoping', label: 'Scoping', color: '#60a5fa' },
  { id: 'active', label: 'Active', color: '#34d399' },
  { id: 'review', label: 'Review', color: '#fbbf24' },
  { id: 'delivered', label: 'Delivered', color: '#f97316' },
  { id: 'renewal', label: 'Renewal', color: '#e879f9' }
]

const PRIORITIES = ['critica', 'alta', 'media', 'baixa']

const PRIORITY_CONFIG = {
  baixa: { label: 'Baixa', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  media: { label: 'Media', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  alta: { label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  critica: { label: 'Critica', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
}

const STORAGE_KEY = 'navi_ops_tasks'

const emptyTask = {
  title: '',
  client: '',
  assignee: 'Aleix',
  priority: 'media',
  stage: 'intake',
  dueDate: '',
  blockers: [],
  description: ''
}

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState(emptyTask)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setTasks(JSON.parse(stored))
      setLoading(false)
    } else {
      import('../data/tasks.json').then(data => {
        setTasks(data.default)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.default))
        setLoading(false)
      })
    }
  }, [])

  const persistTasks = (newTasks) => {
    setTasks(newTasks)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
  }

  const getStageConfig = (stageId) => STAGES.find(s => s.id === stageId) || STAGES[0]

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.priority === filter || t.stage === filter)

  const handleEdit = (task) => {
    setEditingTask(task)
    setForm({ ...task, blockers: task.blockers.join('\n') })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingTask(null)
    setForm({ ...emptyTask, dueDate: new Date().toISOString().split('T')[0] })
  }

  const handleSave = () => {
    const blockersArray = form.blockers
      ? form.blockers.split('\n').map(b => b.trim()).filter(Boolean)
      : []

    if (isCreating) {
      const newTask = {
        ...form,
        blockers: blockersArray,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      persistTasks([...tasks, newTask])
    } else {
      persistTasks(tasks.map(t =>
        t.id === editingTask.id
          ? { ...t, ...form, blockers: blockersArray, updatedAt: new Date().toISOString() }
          : t
      ))
    }
    setEditingTask(null)
    setIsCreating(false)
    setForm(emptyTask)
  }

  const handleDelete = (taskId) => {
    if (!confirm('Eliminar aquesta tasca?')) return
    persistTasks(tasks.filter(t => t.id !== taskId))
    setEditingTask(null)
  }

  const handleCancel = () => {
    setEditingTask(null)
    setIsCreating(false)
    setForm(emptyTask)
  }

  const stageSelect = (
    <select
      value={form.stage}
      onChange={e => setForm({ ...form, stage: e.target.value })}
    >
      {STAGES.map(s => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  )

  const prioritySelect = (
    <select
      value={form.priority}
      onChange={e => setForm({ ...form, priority: e.target.value })}
    >
      {PRIORITIES.map(p => (
        <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
      ))}
    </select>
  )

  if (loading) {
    return <div className="task-manager"><div className="tm-empty">Carregant...</div></div>
  }

  return (
    <>
      <div className="task-manager">
        <div className="tm-header">
          <h2><List size={16} /> Task Manager</h2>
          <span className="tm-count">{tasks.length} tasques</span>
        </div>

        <div className="tm-toolbar">
          <button className={`tm-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Totes
          </button>
          {STAGES.map(s => (
            <button
              key={s.id}
              className={`tm-filter ${filter === s.id ? 'active' : ''}`}
              onClick={() => setFilter(s.id)}
              style={filter === s.id ? { '--stage-color': s.color } : {}}
            >
              {s.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="tm-filter active" onClick={handleCreate}>
            <Plus size={14} /> Nova
          </button>
        </div>

        <div className="tm-table-wrapper">
          <table className="tm-table">
            <thead>
              <tr>
                <th>Tasca</th>
                <th>Prioritat</th>
                <th>Estat</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Blockers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="tm-empty">Cap tasca</td>
                </tr>
              )}
              {filteredTasks.map(task => {
                const stageConfig = getStageConfig(task.stage)
                const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.baixa
                const overdue = task.stage !== 'delivered' && isOverdue(task.dueDate)
                return (
                  <tr key={task.id}>
                    <td className="tm-title-cell">
                      <div className="tm-title">{task.title}</div>
                      <div className="tm-client">{task.client}</div>
                    </td>
                    <td>
                      <span className="priority-badge" style={{ color: priorityCfg.color, background: priorityCfg.bg }}>
                        {priorityCfg.label}
                      </span>
                    </td>
                    <td>
                      <span className="stage-badge" style={{ background: `${stageConfig.color}20`, color: stageConfig.color }}>
                        <span className="stage-dot" style={{ background: stageConfig.color }} />
                        {stageConfig.label}
                      </span>
                    </td>
                    <td className="tm-assignee">{task.assignee}</td>
                    <td className={`tm-date ${overdue ? 'overdue' : ''}`}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      {task.blockers.length > 0 && (
                        <span className="tm-blockers">
                          <AlertCircle size={12} />
                          {task.blockers[0]}
                        </span>
                      )}
                    </td>
                    <td className="tm-actions">
                      <button className="tm-action-btn" onClick={() => handleEdit(task)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button className="tm-action-btn" onClick={() => handleDelete(task.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(editingTask || isCreating) && (
        <div className="tm-edit-overlay" onClick={handleCancel}>
          <div className="tm-edit-modal" onClick={e => e.stopPropagation()}>
            <div className="tm-edit-header">
              <h3>{isCreating ? 'Nova Tasca' : 'Editar Tasca'}</h3>
              <button className="tm-edit-close" onClick={handleCancel}>
                <X size={16} />
              </button>
            </div>
            <div className="tm-edit-body">
              <div className="tm-field">
                <label>Titol</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Nom de la tasca"
                  autoFocus
                />
              </div>
              <div className="tm-field">
                <label>Client</label>
                <input
                  type="text"
                  value={form.client}
                  onChange={e => setForm({ ...form, client: e.target.value })}
                  placeholder="Client o projecte"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="tm-field">
                  <label>Estat</label>
                  {stageSelect}
                </div>
                <div className="tm-field">
                  <label>Prioritat</label>
                  {prioritySelect}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="tm-field">
                  <label>Assignee</label>
                  <input
                    type="text"
                    value={form.assignee}
                    onChange={e => setForm({ ...form, assignee: e.target.value })}
                  />
                </div>
                <div className="tm-field">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="tm-field">
                <label>Blockers (un per linia)</label>
                <textarea
                  value={form.blockers}
                  onChange={e => setForm({ ...form, blockers: e.target.value })}
                  placeholder=" obstacles o dependencies..."
                />
              </div>
            </div>
            <div className="tm-edit-footer">
              {!isCreating && (
                <button className="tm-btn tm-btn-delete" onClick={() => handleDelete(editingTask.id)}>
                  Eliminar
                </button>
              )}
              <button className="tm-btn tm-btn-cancel" onClick={handleCancel}>Cancelar</button>
              <button className="tm-btn tm-btn-save" onClick={handleSave} disabled={!form.title}>
                {isCreating ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
