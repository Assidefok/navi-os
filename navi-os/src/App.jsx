import { useState } from 'react'
import TopBar from './components/TopBar'
import Dock from './components/Dock'
import Settings from './components/Settings'
import Ops from './modules/Ops'
import Brain from './modules/Brain'
import Lab from './modules/Lab'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('ops')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const ActiveModule = {
    ops: Ops,
    brain: Brain,
    lab: Lab
  }[activeTab] || Ops

  return (
    <div className="app">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="main-content">
        <ActiveModule />
      </main>
      <Dock activeTab={activeTab} setActiveTab={setActiveTab} />
      {settingsOpen && (
        <Settings onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

export default App