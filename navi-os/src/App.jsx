import { useState } from 'react'
import TopBar from './components/TopBar'
import Dock from './components/Dock'
import Ops from './modules/Ops'
import Brain from './modules/Brain'
import Lab from './modules/Lab'
import './App.css'

const modules = [
  { id: 'ops', label: 'Operacions' },
  { id: 'brain', label: 'Cervell' },
  { id: 'lab', label: 'Laboratori' }
]

function App() {
  const [activeTab, setActiveTab] = useState('ops')
  const [draggedTab, setDraggedTab] = useState(null)
  const [tabs, setTabs] = useState(modules)

  const ActiveModule = {
    ops: Ops,
    brain: Brain,
    lab: Lab
  }[activeTab] || Ops

  const handleDragStart = (e, index) => {
    setDraggedTab(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedTab === null || draggedTab === index) return
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    if (draggedTab === null || draggedTab === index) return
    const newTabs = [...tabs]
    const [moved] = newTabs.splice(draggedTab, 1)
    newTabs.splice(index, 0, moved)
    setTabs(newTabs)
    setDraggedTab(null)
  }

  const handleDragEnd = () => {
    setDraggedTab(null)
  }

  return (
    <div className="app">
      <TopBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        draggedTab={draggedTab}
      />
      <main className="main-content">
        <ActiveModule />
      </main>
      <Dock
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  )
}

export default App
