import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import Dock from './components/Dock'
import Settings from './components/Settings'
import ErrorBoundary from './components/ErrorBoundary'
import Ops from './modules/Ops'
import Brain from './modules/Brain'
import Lab from './modules/Lab'
import ProposalsBoard from './modules/Proposals/ProposalsBoard'
import './App.css'

// Inner app component that uses routing hooks
function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname.replace('/', '') || 'ops'
    if (['ops', 'brain', 'lab', 'proposals'].includes(path)) return path
    return 'ops'
  }

  const activeTab = getActiveTab()

  const ActiveModule = {
    ops: Ops,
    brain: Brain,
    lab: Lab,
    proposals: ProposalsBoard,
  }[activeTab] || Ops

  const handleTabChange = (tab) => {
    navigate(`/${tab}`)
  }

  return (
    <div className="app">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="main-content">
        <ErrorBoundary>
          <ActiveModule />
        </ErrorBoundary>
      </main>
      <Dock activeTab={activeTab} setActiveTab={handleTabChange} />
      {settingsOpen && (
        <ErrorBoundary>
          <Settings onClose={() => setSettingsOpen(false)} />
        </ErrorBoundary>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/ops" element={<AppContent />} />
          <Route path="/brain" element={<AppContent />} />
          <Route path="/lab" element={<AppContent />} />
          <Route path="/proposals" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
