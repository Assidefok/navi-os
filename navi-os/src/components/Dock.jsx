import { Settings, Brain, FlaskConical } from 'lucide-react'
import './Dock.css'

export default function Dock({ tabs, activeTab, setActiveTab }) {
  const getIcon = (id) => {
    switch(id) {
      case 'ops': return <Settings />
      case 'brain': return <Brain />
      case 'lab': return <FlaskConical />
      default: return null
    }
  }

  return (
    <div className="dock">
      <div className="dock-icons">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`dock-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            {getIcon(tab.id)}
          </div>
        ))}
      </div>
    </div>
  )
}
