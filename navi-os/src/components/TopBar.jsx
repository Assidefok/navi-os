import { Settings, Brain, FlaskConical } from 'lucide-react'
import './TopBar.css'

export default function TopBar({ tabs, activeTab, setActiveTab, onDragStart, onDragOver, onDrop, onDragEnd, draggedTab }) {
  const getIcon = (id) => {
    switch(id) {
      case 'ops': return <Settings size={18} />
      case 'brain': return <Brain size={18} />
      case 'lab': return <FlaskConical size={18} />
      default: return null
    }
  }

  return (
    <div className="top-bar">
      <div className="tabs-container">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            onDragEnd={onDragEnd}
          >
            {getIcon(tab.id)}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
