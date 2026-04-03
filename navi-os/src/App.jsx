import { useState, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import TopBar from './components/TopBar'
import Dock from './components/Dock'
import Settings from './components/Settings'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

const Ops = lazy(() => import('./modules/Ops'))
const Brain = lazy(() => import('./modules/Brain'))
const Lab = lazy(() => import('./modules/Lab'))
const ProposalsBoard = lazy(() => import('./modules/Proposals/ProposalsBoard'))

// Inner app component that uses routing hooks
function ModuleLoading() {
  return (
    <div style={{ padding: '2rem', color: '#e5e7eb' }}>
      Carregant Navi OS...
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Determine active tab from URL path
  const getActiveTab = () => {
    const segments = location.pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] || 'ops'
    if (['ops', 'brain', 'lab', 'proposals'].includes(lastSegment)) return lastSegment
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
          <Suspense fallback={<ModuleLoading />}>
            <ActiveModule />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Dock activeTab={activeTab} setActiveTab={handleTabChange} />
      {settingsOpen && (
        <ErrorBoundary>
          <Suspense fallback={<ModuleLoading />}>
            <Settings onClose={() => setSettingsOpen(false)} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/ops" element={<AppContent />} />
          <Route path="/brain" element={<AppContent />} />
          <Route path="/lab" element={<AppContent />} />
          <Route path="/proposals" element={<AppContent />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
