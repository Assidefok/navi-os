import { Bot, Wrench, BookOpen, Code, Activity, Sparkles, Rocket, BarChart3, Zap, Brain } from 'lucide-react'
import { useState, useEffect } from 'react'
import './TeamOverview.css'

// Simple markdown renderer
function renderMarkdown(text) {
  if (!text) return ''
  
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Code blocks (```...```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="md-code">$1</pre>')
  
  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
  
  // Headers (# ## ### etc)
  html = html.replace(/^### (.+)$/gm, '<h5 class="md-h5">$1</h5>')
  html = html.replace(/^## (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^# (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  
  // Bold (**...** or __...__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  
  // Italic (*...* or _..._)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  
  // Lists (- item or * item)
  html = html.replace(/^- (.+)$/gm, '<li class="md-li">$1</li>')
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="md-li">$2</li>')
  
  // Wrap consecutive li elements in ul
  html = html.replace(/(<li class="md-li">.*<\/li>)/gs, '<ul class="md-ul">$1</ul>')
  
  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p class="md-p">')
  html = html.replace(/\n/g, '<br/>')
  
  // Wrap in paragraph
  html = '<p class="md-p">' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="md-p"><\/p>/g, '')
  html = html.replace(/<p class="md-p">(<h[345])/g, '$1')
  html = html.replace(/(<\/h[345]>)<\/p>/g, '$1')
  html = html.replace(/<\/ul>(<br\/>)?<\/p>/g, '</ul>')
  
  return html
}

// Chief emoji mapping based on agentId
const CHIEF_ICONS = {
  'elom': Rocket,
  'warren': BarChart3,
  'jeff': Zap,
  'sam': Brain,
  'navi': Sparkles,
  'gary-devops': Wrench,
  'blair-brain': Brain,
  'lena-lab': Activity,
}

// Status colors for chiefs
const CHIEF_COLORS = {
  'elom': '#FF6B6B',
  'warren': '#4ECDC4',
  'jeff': '#FFE66D',
  'sam': '#95E1D3',
}

function StatusIndicator({ status }) {
  const statusConfig = {
    'online': { label: 'online', color: '#4ADE80' },
    'busy': { label: 'busy', color: '#FBBF24' },
    'offline': { label: 'offline', color: '#6B7280' },
  }
  const config = statusConfig[status] || statusConfig.offline
  
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
  
  // Format model name for display
  const formatModel = (model) => {
    if (!model) return null
    if (model.includes('gpt-5.4')) return 'GPT 5.4'
    if (model.includes('gpt-5.3')) return 'GPT 5.3 Codex'
    if (model.includes('MiniMax-M2.7-highspeed')) return 'MiniMax M2.7 (Fast)'
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
        {agent.department && (
          <span className="agent-department">{agent.department}</span>
        )}
        {agent.inspiredBy && (
          <p className="agent-inspired">
            <span className="inspired-label">Inspired by:</span> {agent.inspiredBy}
          </p>
        )}
        {agent.description && (
          <p className="agent-description">{agent.description}</p>
        )}
      </div>
      <div className="agent-card-footer">
        {agent.heartbeatInterval && (
          <div className="heartbeat-info">
            <Activity size={14} />
            <span>{agent.heartbeatInterval}min</span>
          </div>
        )}
        {isChief && agent.model && (
          <div className="model-info">
            <span className="model-badge">{formatModel(agent.model)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function AgentDetailModal({ agent, onClose }) {
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
          <div className="agent-modal-error">
            <p>Error: {agent.error}</p>
          </div>
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
    // Load delegations from localStorage or use defaults
    const stored = localStorage.getItem('recent_delegations')
    if (stored) {
      try {
        setDelegations(JSON.parse(stored))
      } catch {
        setDelegations([])
      }
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
        
        // Add ONLY the chiefs (Navi is shown separately in OrgChart.jsx as Level 2)
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
      // Determine which files to load based on agent type
      const isNavi = agent.agentId === 'navi'
      
      // Load SOUL.md
      const soulRes = await fetch(`/api/file?path=${encodeURIComponent(agent.workspace + '/SOUL.md')}`)
      const soulData = soulRes.ok ? await soulRes.json() : { content: 'No SOUL.md found' }
      
      // Load IDENTITY.md
      const identityRes = await fetch(`/api/file?path=${encodeURIComponent(agent.workspace + '/IDENTITY.md')}`)
      const identityData = identityRes.ok ? await identityRes.json() : { content: 'No IDENTITY.md found' }
      
      // For Navi (main orchestrator), load USER.md. For chiefs, load MEMORY.md
      let personalData = { content: '' }
      if (isNavi) {
        const userRes = await fetch(`/api/file?path=${encodeURIComponent(agent.workspace + '/USER.md')}`)
        personalData = userRes.ok ? await userRes.json() : { content: 'No USER.md found' }
      } else {
        const memoryRes = await fetch(`/api/file?path=${encodeURIComponent(agent.workspace + '/MEMORY.md')}`)
        personalData = memoryRes.ok ? await memoryRes.json() : { content: 'No MEMORY.md found' }
      }
      
      setSelectedAgent({
        ...agent,
        soul: soulData.content,
        identity: identityData.content,
        personal: personalData.content,
        personalLabel: isNavi ? 'USER.md' : 'MEMORY.md',
        loading: false
      })
    } catch (err) {
      setSelectedAgent({ ...agent, error: err.message, loading: false })
    }
  }
  
  if (loading) {
    return (
      <div className="team-overview loading">
        <div className="loading-spinner" />
        <p>Loading team...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="team-overview error">
        <p>Error loading team: {error}</p>
      </div>
    )
  }
  
  if (chiefs.length === 0) {
    return (
      <div className="team-overview empty">
        <p>No team members configured</p>
      </div>
    )
  }
  
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
