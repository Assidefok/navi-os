import { useState, useEffect } from 'react'
import { Plus, GripVertical, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react'
import './TaskPipeline.css'

const STAGES = [
  { id: 'intake', label: 'Intake', color: '#a78bfa' },
  { id: 'active', label: 'Active', color: '#34d399' },
  { id: 'review', label: 'Review', color: '#fbbf24' },
  { id: 'delivered', label: 'Delivered', color: '#f97316' }
]

const PRIORITY_CONFIG = {
  baixa: { label: 'Baixa', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  media: { label: 'Media', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  alta: { label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  critica: { label: 'Critica', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
}

const STAGE_TO_STATUS = {
  intake: 'todo',
  active: 'in-progress',
  review: 'review',
  delivered: 'done'
}

const STATUS_TO_STAGE = {
  'todo': 'intake',
  'in-progress': 'active',
  'review': 'review',
  'done': 'delivered'
}

const MAX_RETRIES = 3

function SkeletonBoard() {
  return (
    <div className="tp-skeleton-board">
      {STAGES.map(stage => (
        <div key={stage.id} className="tp-skeleton-column">
          <div className="tp-skeleton-header">
            <div className="skeleton-pill" style={{ width: `${40 + (stage.id.length * 8)}px` }} />
            <div className="skeleton-pill" style={{ width: '20px' }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="tp-skeleton-card" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="skeleton-row" style={{ width: '30%', height: '10px', marginBottom: '8px' }} />
              <div className="skeleton-row" style={{ width: '90%', height: '14px', marginBottom: '6px' }} />
              <div className="skeleton-row" style={{ width: '70%', height: '10px', marginBottom: '10px' }} />
              <div className="skeleton-row" style={{ width: '50%', height: '10px' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function TaskPipeline() {
  const [tasks, setTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedOverStage, setDraggedOverStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [usingLocalStorage, setUsingLocalStorage] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  // Auto-hide toast after 3s
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [showToast])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/pm-board')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const pipelineTasks = (data.tasks || []).map(task => {
        const clientName = task.assigneeChief?.name || task.assignee || 'Unknown'
        const clientEmoji = task.assigneeChief?.emoji || ''
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          client: `${clientEmoji} ${clientName}`,
          priority: task.priority || 'media',
          stage: STATUS_TO_STAGE[task.status] || 'intake',
          dueDate: task.dueDate,
          updatedAt: task.updatedDate,
          blockers: task.notes || []
        }
      })

      // If we were using localStorage fallback and API recovered
      if (usingLocalStorage) {
        setShowToast(true)
        setUsingLocalStorage(false)
      }

      setTasks(pipelineTasks)
      setError(null)
      setRetryCount(0)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message)

      // Fallback to localStorage
      const stored = localStorage.getItem('navi_ops_tasks')
      if (stored) {
        try {
          setTasks(JSON.parse(stored))
          setUsingLocalStorage(true)
        } catch {}
      }

      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000)
        setRetryCount(prev => prev + 1)
        setTimeout(fetchTasks, delay)
      }
    } finally {
      setLoading(false)
    }
  }

  // Persist to API and localStorage backup
  const persistTasks = async (newTasks, changedTaskId, newStage) => {
    setTasks(newTasks)
    localStorage.setItem('navi_ops_tasks', JSON.stringify(newTasks))

    if (changedTaskId) {
      const task = newTasks.find(t => t.id === changedTaskId)
      if (task) {
        try {
          const apiStatus = STAGE_TO_STATUS[newStage] || 'todo'
          const res = await fetch(`/api/pm-board/${changedTaskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              status: apiStatus,
              priority: task.priority,
              notes: task.blockers || []
            })
          })
          const data = await res.json()

          if (newStage === 'delivered' && data?.task) {
            fetch('/api/internal/automations/fire', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                triggerType: 'pm.task.delivered',
                triggerData: {
                  taskId: data.task.id,
                  taskTitle: data.task.title,
                  assignee: data.task.assignee,
                  priority: data.task.priority,
                  deliveredAt: new Date().toISOString()
                }
              })
            }).catch(() => {})
          }

          if (newStage === 'review' && data?.task) {
            fetch('/api/internal/automations/fire', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                triggerType: 'pm.task.review',
                triggerData: {
                  taskId: data.task.id,
                  taskTitle: data.task.title,
                  assignee: data.task.assignee
                }
              })
            }).catch(() => {})
          }
        } catch (err) {
          console.error('Error syncing task to API:', err)
        }
      }
    }
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, stageId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = (e, stageId) => {
    e.preventDefault()
    if (!draggedTask) return
    const updated = tasks.map(t =>
      t.id === draggedTask.id
        ? { ...t, stage: stageId, updatedAt: new Date().toISOString() }
        : t
    )
    persistTasks(updated, draggedTask.id, stageId)
    setDraggedTask(null)
    setDraggedOverStage(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDraggedOverStage(null)
  }

  const getTasksForStage = (stageId) => tasks.filter(t => t.stage === stageId)

  const priorityBadges = (priority) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.baixa
    return (
      <span className="priority-badge" style={{ color: cfg.color, background: cfg.bg }}>
        {cfg.label}
      </span>
    )
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="task-pipeline">
        <div className="tp-header">
          <h2>Task Pipeline</h2>
        </div>
        <SkeletonBoard />
      </div>
    )
  }

  return (
    <div className="task-pipeline">
      {usingLocalStorage && (
        <div className="tp-fallback-banner">
          <AlertCircle size={14} />
          <span>Sincronitzant desde localStorage — API no disponible</span>
          <button className="tp-banner-retry" onClick={() => { setUsingLocalStorage(false); fetchTasks() }}>
            <RefreshCw size={12} /> Reconnectar
          </button>
        </div>
      )}

      {showToast && (
        <div className="tp-toast">
          <CheckCircle2 size={14} />
          <span>Connectivitat recuperada — sincronitzant amb API</span>
        </div>
      )}

      {error && !usingLocalStorage && (
        <div className="tp-error-bar">
          <AlertCircle size={14} />
          <span>Error: {error}</span>
          {retryCount < MAX_RETRIES ? (
            <span className="tp-retry-info">Reintent {retryCount}/{MAX_RETRIES}...</span>
          ) : (
            <button className="tp-retry-btn" onClick={() => { setRetryCount(0); fetchTasks() }}>
              <RefreshCw size={12} /> Reintentar
            </button>
          )}
        </div>
      )}

      <div className="tp-header">
        <h2>Task Pipeline</h2>
        <span className="task-count">{tasks.length} tasques</span>
        <button className="sync-btn" onClick={fetchTasks} title="Sync amb API">
          ⟳
        </button>
      </div>

      <div className="kanban-board">
        {STAGES.map(stage => {
          const stageTasks = getTasksForStage(stage.id)
          const isOver = draggedOverStage === stage.id
          return (
            <div
              key={stage.id}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              style={{ '--stage-color': stage.color }}
              onDragOver={e => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage.id)}
            >
              <div className="column-header">
                <div className="column-title-row">
                  <span className="column-dot" style={{ background: stage.color }} />
                  <span className="column-title">{stage.label}</span>
                </div>
                <span className="column-count">{stageTasks.length}</span>
              </div>
              <div className="column-body">
                {stageTasks.map(task => (
                  <div
                    key={task.id}
                    className={`task-card ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-card-header">
                      <GripVertical size={14} className="drag-handle" />
                      {priorityBadges(task.priority)}
                    </div>
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <span className="task-client">{task.client}</span>
                      {task.dueDate && (
                        <span className="task-due">
                          {new Date(task.dueDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                    {task.blockers && task.blockers.length > 0 && (
                      <div className="task-blockers">
                        <AlertCircle size={12} />
                        <span>{task.blockers[0]}</span>
                      </div>
                    )}
                  </div>
                ))}
                {stageTasks.length === 0 && (
                  <div className="column-empty">—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
