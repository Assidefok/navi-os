import { Bot, Wrench, BookOpen, Code, Activity, Sparkles, Rocket, BarChart3, Zap, Brain } from 'lucide-react'
import { useState, useEffect } from 'react'
import './TeamOverview.css'

// Simple markdown renderer
function renderMarkdown(text) {
  if (!text) return ''
  
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="md-code">$1</pre>')
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  html = html.replace(/^### (.+)$/gm, '<h5 class="md-h5">$1</h5>')
  html = html.replace(/^## (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^# (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="md-li">$2</li>')
  html = html.replace(/(<li class="md-li">.*<\/li>)/gs, '<ul class="md-ul">$1</ul>')
  html = html.replace(/\n\n/g, '</p><p class="md-p">')
  html = html.replace(/\n/g, '<br/>')
  html = '<p class="md-p">' + html + '</p>'
  html = html.replace(/<p class="md-p"><\/p>/g, '')
  html = html.replace(/<p class="md-p">(<h[345])/g, '$1')
  html = html.replace(/(<\/h[345]>)<\/p>/g, '$1')
  html = html.replace(/<\/ul>(<br\/>)?<\/p>/g, '</ul>')
  
  return html
}

const CHIEF_ICONS = {
  'elom': Rocket, 'warren': BarChart3, 'jeff': Zap, 'sam': Brain,
  'navi': Sparkles, 'gary-devops': Wrench, 'blair-brain': Brain, 'lena-lab': Activity,
}

const CHIEF_COLORS = {
  'elom': '#FF6B6B', 'warren': '#4ECDC4', 'jeff': '#FFE66D', 'sam': '#95E1D3',
}

function StatusIndicator({ status }) {
  const config = {
    'online': { label: 'online', color: '#4ADE80' },
    'busy': { label: 'busy', color: '#FBBF24' },
    'offline': { label: 'offline', color: '#6B7280' },
  }[status] || { label: 'offline', color: '#6B7280' }
  
  return (
    <span className={`status-indicator status-${status}`}>
      <span className="status-dot" style={{ backgroundColor: config.color }} />
      <span className="status-label">{config.label}</span>
    </span>
  )
}

function AgentCard({ agent, onClick }) {
  const Icon = agent.icon || Bot
  const accentColor = CHIEF_COLORS[agent.agentId] || '#8B5CF6'
  const isChief = ['elom', 'warren', 'jeff', 'sam'].includes(agent.agentId)
  
  const formatModel = (model) => {
    if (!model) return null
    if (model.includes('gpt-5.4')) return 'GPT 5.4'
    if (model.includes('gpt-5.3')) return 'GPT 5.3'
    if (model.includes('MiniMax-M2.7')) return 'MiniMax M2.7'
    return model.split('/').pop()
  }
  
  return (
    <div
      className="agent-card chief-card"
      style={{ borderLeftColor: accentColor }}
      onClick={() => onClick(agent)}
      title="Click per veure detalls"
    >
      <div className="agent-card-header">
        <div className="agent-icon-wrapper chief-icon" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
          <Icon size={20} />
        </div>
        <StatusIndicator status={agent.status || 'offline'} />
      </div>
      <div className="agent-card-body">
        <h4 className="agent-name">
          <span className="chief-emoji">{agent.emoji}</span>
          {agent.name}
        </h4>
        <span className="agent-role">{agent.role}</span>
        {agent.department && <span className="agent-department">{agent.department}</span>}
        {agent.inspiredBy && (
          <p className="agent-inspired"><span className="inspired-label">Inspired by:</span> {agent.inspiredBy}</p>
        )}
        {agent.description && <p className="agent-description">{agent.description}</p>}
      </div>
      <div className="agent-card-footer">
        {agent.heartbeatInterval && (
          <div className="heartbeat-info"><Activity size={14} /><span>{agent.heartbeatInterval}min</span></div>
        )}
        {isChief && agent.model && (
          <div className="model-info"><span className="model-badge">{formatModel(agent.model)}</span></div>
        )}
      </div>
    </div>
  )
}

export function AgentDetailModal({ agent, onClose }) {
  if (!agent) return null
  
  return (
    <div className="agent-modal-overlay" onClick={onClose}>
      <div className="agent-modal" onClick={e => e.stopPropagation()}>
        <div className="agent-modal-header">
          <div className="agent-modal-title">
            <span className="modal-emoji">{agent.emoji}</span>
            <h3>{agent.name}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {agent.loading ? (
          <div className="agent-modal-loading">
            <div className="loading-spinner" />
            <p>Carregant detalls...</p>
          </div>
        ) : agent.error ? (
          <div className="agent-modal-error"><p>Error: {agent.error}</p></div>
        ) : (
          <div className="agent-modal-content">
            <div className="modal-section">
              <h4>SOUL.md</h4>
              <div className="modal-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(agent.soul) }} />
            </div>
            <div className="modal-section">
              <h4>IDENTITY.md</h4>
              <div className="modal-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(agent.identity) }} />
            </div>
            <div className="modal-section">
              <h4>{agent.personalLabel || 'MEMORY.md'}</h4>
              <div className="modal-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(agent.personal) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DelegationFeed() {
  const [delegations, setDelegations] = useState([])
  
  useEffect(() => {
    const stored = localStorage.getItem('recent_delegations')
    if (stored) {
      try { setDelegations(JSON.parse(stored)) } catch { setDelegations([]) }
    }
  }, [])
  
  return (
    <div className="delegation-feed">
      <div className="delegation-header">
        <Bot size={16} />
        <h4>Delegation Queue</h4>
      </div>
      {delegations.length === 0 ? (
        <p className="no-delegations">No recent delegations</p>
      ) : (
        <div className="delegation-list">
          {delegations.map(d => (
            <div key={d.id} className="delegation-item">
              <div className="delegation-arrow">
                <span className="from">{d.from}</span>
                <span className="arrow">→</span>
                <span className="to">{d.to}</span>
              </div>
              <p className="delegation-task">{d.task}</p>
              <span className="delegation-time">{d.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function loadAgentDetailsFromWorkspace(agent) {
  // Shared logic for loading agent details from workspace
  // Returns a promise that resolves with the enriched agent
  return new Promise(async (resolve, reject) => {
    try {
      const isNavi = agent.agentId === 'navi'
      const workspacePrefix = '/home/user/.openclaw/workspace'
      const relativePath = agent.workspace?.startsWith(workspacePrefix)
        ? agent.workspace.slice(workspacePrefix.length + 1)
        : agent.workspace

      const soulPath = relativePath ? `${relativePath}/SOUL.md` : 'SOUL.md'
      const identityPath = relativePath ? `${relativePath}/IDENTITY.md` : 'IDENTITY.md'
      const personalPath = relativePath
        ? `${relativePath}/${isNavi ? 'USER.md' : 'MEMORY.md'}`
        : (isNavi ? 'USER.md' : 'MEMORY.md')

      const soulRes = await fetch(`/api/file?path=${encodeURIComponent(soulPath)}`)
      const soulData = soulRes.ok ? await soulRes.json() : { content: 'No SOUL.md found' }

      const identityRes = await fetch(`/api/file?path=${encodeURIComponent(identityPath)}`)
      const identityData = identityRes.ok ? await identityRes.json() : { content: 'No IDENTITY.md found' }

      let personalData = { content: '' }
      if (isNavi) {
        const userRes = await fetch(`/api/file?path=${encodeURIComponent(personalPath)}`)
        personalData = userRes.ok ? await userRes.json() : { content: 'No USER.md found' }
      } else {
        const memoryRes = await fetch(`/api/file?path=${encodeURIComponent(personalPath)}`)
        personalData = memoryRes.ok ? await memoryRes.json() : { content: 'No MEMORY.md found' }
      }

      resolve({
        ...agent,
        soul: soulData.content,
        identity: identityData.content,
        personal: personalData.content,
        personalLabel: isNavi ? 'USER.md' : 'MEMORY.md',
        loading: false
      })
    } catch (err) {
      reject(err)
    }
  })
}

export default function TeamOverview() {
  const [chiefs, setChiefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(null)
  
  useEffect(() => {
    async function loadOrgChart() {
      try {
        const res = await fetch('/api/org-chart')
        if (!res.ok) throw new Error('Failed to load org chart')
        const data = await res.json()
        
        const chiefList = []
        if (data.chiefs && data.chiefs.length > 0) {
          for (const chief of data.chiefs) {
            chiefList.push({
              ...chief,
              icon: CHIEF_ICONS[chief.agentId] || Bot,
              status: chief.status || 'offline',
              description: chief.description || `Chief of ${chief.department || chief.role}`
            })
          }
        }
        
        setChiefs(chiefList)
      } catch (err) {
        console.error('Error loading org chart:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrgChart()
  }, [])
  
  async function loadAgentDetails(agent) {
    setSelectedAgent({ ...agent, loading: true })
    try {
      const enriched = await loadAgentDetailsFromWorkspace(agent)
      setSelectedAgent(enriched)
    } catch (err) {
      setSelectedAgent({ ...agent, error: err.message, loading: false })
    }
  }
  
  if (loading) return (
    <div className="team-overview loading">
      <div className="loading-spinner" />
      <p>Loading team...</p>
    </div>
  )
  
  if (error) return (
    <div className="team-overview error">
      <p>Error loading team: {error}</p>
    </div>
  )
  
  if (chiefs.length === 0) return (
    <div className="team-overview empty">
      <p>No team members configured</p>
    </div>
  )
  
  return (
    <div className="team-overview">
      <div className="team-agents">
        {chiefs.map(agent => (
          <AgentCard key={agent.agentId || agent.id} agent={agent} onClick={loadAgentDetails} />
        ))}
      </div>
      <DelegationFeed />
      
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}
