import { useState, useEffect } from 'react'
import { Clock, ChevronDown, ChevronUp, User } from 'lucide-react'
import './DeliverableTracker.css'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  in_progress: { label: 'In Progress', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  review: { label: 'Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  delivered: { label: 'Delivered', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }
}

const STORAGE_KEY = 'navi_ops_deliverables'

export default function DeliverableTracker() {
  const [deliverables, setDeliverables] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setDeliverables(JSON.parse(stored))
    } else {
      import('../data/deliverables.json').then(data => {
        setDeliverables(data.default)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.default))
      })
    }
  }, [])

  const getStatusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending

  const isOverdue = (slaDate) => {
    return new Date(slaDate) < new Date()
  }

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div className="deliverable-tracker">
      <div className="dt-header">
        <h2>Deliverable Tracking</h2>
        <span className="del-count">{deliverables.length} deliverables</span>
      </div>

      <div className="del-list">
        {deliverables.map(del => {
          const cfg = getStatusCfg(del.status)
          const overdue = del.status !== 'delivered' && isOverdue(del.slaDate)
          const isOpen = expanded === del.id

          return (
            <div key={del.id} className="del-card">
              <div className="del-card-header" onClick={() => toggleExpand(del.id)}>
                <div className="del-left">
                  <span className="del-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
                    {cfg.label}
                  </span>
                  <span className="del-title">{del.title}</span>
                </div>
                <div className="del-right">
                  <span className={`del-sla ${overdue ? 'overdue' : ''}`}>
                    <Clock size={12} />
                    {new Date(del.slaDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              <div className="del-card-meta">
                <span className="del-client">
                  <User size={11} />
                  {del.clientName}
                </span>
                <span className="del-owner">{del.owner}</span>
              </div>

              {isOpen && (
                <div className="del-history">
                  <h4>Historial d'estat</h4>
                  {del.history.map((entry, i) => {
                    const ec = getStatusCfg(entry.status)
                    return (
                      <div key={i} className="history-entry">
                        <div className="history-dot" style={{ background: ec.color }} />
                        <div className="history-content">
                          <div className="history-date">{entry.date}</div>
                          <div className="history-status" style={{ color: ec.color }}>{ec.label}</div>
                          <div className="history-note">{entry.note}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
