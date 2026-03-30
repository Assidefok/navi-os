import { Settings, Brain, FlaskConical } from 'lucide-react'
import './Dock.css'

const dockItems = [
  { id: 'ops', label: 'Operacions', icon: Settings },
  { id: 'brain', label: 'Cervell', icon: Brain },
  { id: 'lab', label: 'Laboratori', icon: FlaskConical },
]

export default function Dock({ activeTab, setActiveTab }) {
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
              {activeTab === item.id && <span className="dock-active-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}