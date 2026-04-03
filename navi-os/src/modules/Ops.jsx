// Ops.jsx - thin tab manager / router
import { useState, useEffect, useMemo } from 'react'
import {
  Activity, Zap, Link, FolderSync, Shield, Database, Users, LayoutList,
  MessageSquare, Moon,
} from 'lucide-react'
import TaskPipeline from '../components/TaskPipeline'
import Standups from './Ops/Standups'
import ChiefsCouncil from './Ops/ChiefsCouncil/ChiefsCouncil'
import DeliverableTracker from '../components/DeliverableTracker'
import TaskManager from '../components/TaskManager'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
import Files from '../components/Files'
import Security from '../components/Security'
import Sync from '../components/Sync'
import ProposalsBoard from './Proposals/ProposalsBoard'
import AutomationsBoard from './Ops/Automations/AutomationsBoard'
import { OvernightSummary } from './Ops/shared'
import SessionsModule from './Ops/sections/SessionsSection'
import CronModule from './Ops/sections/CronSection'
import ActivityModule from './Ops/sections/ActivitySection'
import './Ops.css'

const OPS_TAB_STORAGE_KEY = 'navi-os.ops.tab-order.v1'

export default function Ops() {
  const [viewMode, setViewMode] = useState('mission')

  const defaultPrimaryTabs = [
    { id: 'mission', label: 'Mission Control' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'cron', label: 'Cron' },
    { id: 'activity', label: 'Activity' },
    { id: 'orgchart', label: 'Org Chart' },
    { id: 'pipeline', label: 'PM Board' },
    { id: 'automation', label: 'Automations' },
  ]

  const utilityTabs = [
    ['manager', 'Task Manager', Activity],
    ['files', 'Files', FolderSync],
    ['sync', 'Sync', Database],
    ['security', 'Security', Shield],
    ['integration', 'Integrations', Link],
    ['chiefs', 'Chiefs Council', MessageSquare],
    ['standups', 'Standups', Users],
  ]

  const [primaryOrder, setPrimaryOrder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OPS_TAB_STORAGE_KEY) || 'null')
      if (Array.isArray(saved) && saved.length) return saved
    } catch {}
    return defaultPrimaryTabs.map(t => t.id)
  })

  useEffect(() => {
    try { localStorage.setItem(OPS_TAB_STORAGE_KEY, JSON.stringify(primaryOrder)) } catch {}
  }, [primaryOrder])

  const primaryTabs = useMemo(() => {
    const map = new Map(defaultPrimaryTabs.map(t => [t.id, t]))
    const ordered = primaryOrder.map(id => map.get(id)).filter(Boolean)
    defaultPrimaryTabs.forEach(tab => { if (!ordered.find(t => t.id === tab.id)) ordered.push(tab) })
    return ordered
  }, [primaryOrder])

  const moveTab = (fromId, toId) => {
    if (fromId === toId) return
    setPrimaryOrder(prev => {
      const next = prev.filter(id => id !== fromId)
      const idx = next.indexOf(toId)
      if (idx === -1) next.push(fromId)
      else next.splice(idx, 0, fromId)
      return next
    })
  }

  const [draggedTab, setDraggedTab] = useState(null)

  const renderPrimary = () => {
    if (viewMode === 'mission') return (
      <>
        <OvernightSummary />
        <MissionControl />
      </>
    )
    if (viewMode === 'sessions') return <SessionsModule />
    if (viewMode === 'cron') return <CronModule />
    if (viewMode === 'activity') return <ActivityModule onOpenTool={setViewMode} />
    return null
  }

  const renderUtility = () => {
    if (viewMode === 'orgchart') return <OrgChart />
    if (viewMode === 'pipeline') return (
      <>
        <TaskPipeline />
        <ProposalsBoard />
        <DeliverableTracker />
      </>
    )
    if (viewMode === 'manager') return <TaskManager />
    if (viewMode === 'files') return <Files />
    if (viewMode === 'sync') return <Sync />
    if (viewMode === 'security') return <Security />
    if (viewMode === 'automation') return <AutomationsBoard />
    if (viewMode === 'integration') return (
      <div className="placeholder-view">
        <div className="placeholder-icon"><Link size={48} className="amber" /></div>
        <h2>Integracions</h2>
        <p>Connexions externes: API, webhooks i serveis de tercers.</p>
      </div>
    )
    if (viewMode === 'chiefs') return <ChiefsCouncil />
    if (viewMode === 'standups') return <Standups />
    return null
  }

  const isPrimary = primaryTabs.some(tab => tab.id === viewMode)

  return (
    <div className="module-view ops">
      <h1 className="dashboard-title amber neon-amber">Operacions</h1>

      <div className="ops-primary-tabs">
        {primaryTabs.map(tab => (
          <button
            key={tab.id}
            className={`ops-primary-tab ${viewMode === tab.id ? 'active' : ''} ${draggedTab === tab.id ? 'dragging' : ''}`}
            draggable
            onDragStart={() => setDraggedTab(tab.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (draggedTab) moveTab(draggedTab, tab.id); setDraggedTab(null) }}
            onDragEnd={() => setDraggedTab(null)}
            onClick={() => setViewMode(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {isPrimary ? renderPrimary() : renderUtility()}

      <div className="ops-secondary-toolbar">
        <div className="ops-secondary-title">Utilitats OPS</div>
        <div className="ops-toggles compact">
          {utilityTabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`toggle-btn ${viewMode === id ? 'active' : ''}`}
              onClick={() => setViewMode(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
