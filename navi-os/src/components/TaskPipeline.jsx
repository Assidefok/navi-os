import { useState, useEffect } from 'react'
import { Plus, GripVertical, AlertCircle } from 'lucide-react'
import './TaskPipeline.css'

const STAGES = [
  { id: 'intake', label: 'Intake', color: '#a78bfa' },
  { id: 'scoping', label: 'Scoping', color: '#60a5fa' },
  { id: 'active', label: 'Active', color: '#34d399' },
  { id: 'review', label: 'Review', color: '#fbbf24' },
  { id: 'delivered', label: 'Delivered', color: '#f97316' },
  { id: 'renewal', label: 'Renewal', color: '#e879f9' }
]

const PRIORITY_CONFIG = {
  baixa: { label: 'Baixa', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  media: { label: 'Media', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  alta: { label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  critica: { label: 'Critica', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
}

// API status mapping: pipeline stages -> pm-board statuses
const STAGE_TO_STATUS = {
  intake: 'todo',
  scoping: 'todo',
  active: 'in-progress',
  review: 'review',
  delivered: 'done',
  renewal: 'done'
}

const STATUS_TO_STAGE = {
  'todo': 'intake',
  'in-progress': 'active',
  'review': 'review',
  'done': 'delivered'
}

export default function TaskPipeline() {
  const [tasks, setTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedOverStage, setDraggedOverStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load tasks from API on mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/pm-board')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      // Convert API tasks to pipeline format
      const pipelineTasks = (data.tasks || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        client: task.assignee || 'Unknown',
        priority: task.priority || 'media',
        stage: STATUS_TO_STAGE[task.status] || 'intake',
        dueDate: task.dueDate,
        updatedAt: task.updatedDate,
        blockers: task.notes || []
      }))
      setTasks(pipelineTasks)
      setError(null)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message)
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('navi_ops_tasks')
      if (stored) {
        setTasks(JSON.parse(stored))
      }
    } finally {
      setLoading(false)
    }
  }

  // Persist to API and localStorage backup
  const persistTasks = async (newTasks) => {
    setTasks(newTasks)
    // Backup to localStorage
    localStorage.setItem('navi_ops_tasks', JSON.stringify(newTasks))

    // Sync to API for each changed task
    for (const task of newTasks) {
      try {
        const apiStatus = STAGE_TO_STATUS[task.stage] || 'todo'
        await fetch(`/api/pm-board/${task.id}`, {
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
      } catch (err) {
        console.error('Error syncing task to API:', err)
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
    persistTasks(updated)
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

  if (loading) {
    return (
      <div className="task-pipeline loading">
        <div className="loading-spinner">Carregant tasques...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="task-pipeline error">
        <div className="error-message">
          <AlertCircle size={16} />
          <span>Error: {error}</span>
          <button onClick={fetchTasks}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="task-pipeline">
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
