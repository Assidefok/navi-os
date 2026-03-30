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

const STORAGE_KEY = 'navi_ops_tasks'

export default function TaskPipeline() {
  const [tasks, setTasks] = useState([])
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedOverStage, setDraggedOverStage] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setTasks(JSON.parse(stored))
    } else {
      // In Vite, JSON imports are available directly
      import('../data/tasks.json').then(m => {
        const data = m.default || m
        setTasks(data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }).catch(() => {
        // Fallback to empty array
        setTasks([])
      })
    }
  }, [])

  const persistTasks = (newTasks) => {
    setTasks(newTasks)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
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

  return (
    <div className="task-pipeline">
      <div className="tp-header">
        <h2>Task Pipeline</h2>
        <span className="task-count">{tasks.length} tasques</span>
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
                    {task.blockers.length > 0 && (
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
