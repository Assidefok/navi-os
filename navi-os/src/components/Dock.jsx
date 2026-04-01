import { useEffect, useState } from 'react'
import { Settings, Brain, FlaskConical, Lightbulb } from 'lucide-react'
import './Dock.css'

const dockItems = [
  { id: 'ops',       label: 'Operacions', icon: Settings },
  { id: 'brain',     label: 'Cervell',    icon: Brain },
  { id: 'proposals', label: 'Propostes',  icon: Lightbulb },
  { id: 'lab',       label: 'Laboratori', icon: FlaskConical },
]

export default function Dock({ activeTab, setActiveTab }) {
  const [activeSessions, setActiveSessions] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = () => {
      fetch('/api/sessions')
        .then(r => r.json())
        .then(d => {
          if (cancelled) return
          setActiveSessions(d.activeCount || 0)
        })
        .catch(() => {
          if (!cancelled) setActiveSessions(0)
        })
    }

    load()
    const interval = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <nav className="dock" role="navigation" aria-label="Navegacio principal">
      <div className="dock-icons">
        {dockItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`dock-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              aria-current={activeTab === item.id ? 'page' : undefined}
              title={item.label}
            >
              <div className="dock-icon-wrap">
                <Icon size={28} strokeWidth={1.5} />
              </div>
              <span className="dock-tooltip">{item.label}</span>
              {item.id === 'ops' && activeSessions > 0 && (
                <span className="dock-live-badge" aria-hidden="true" />
              )}
              {activeTab === item.id && <span className="dock-active-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
