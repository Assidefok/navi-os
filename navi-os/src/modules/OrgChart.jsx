import { useState } from 'react'
import { User, Sparkles, Rocket, Shield, Zap, Brain } from 'lucide-react'
import TeamOverview, { AgentDetailModal, loadAgentDetailsFromWorkspace } from '../components/TeamOverview'
import { orgHumans, orgAgents } from '../data/org-chart'
import './OrgChart.css'

const iconMap = {
  user: User, sparkles: Sparkles, rocket: Rocket,
  shield: Shield, zap: Zap, brain: Brain,
}

function OrgNode({ member, onClick }) {
  const IconComponent = iconMap[member.icon] || User
  
  return (
    <div
      className={`org-node ${member.type} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      title={onClick ? 'Click per veure detalls' : undefined}
    >
      <div className="node-icon" style={{ color: member.color }}>
        <IconComponent size={24} />
      </div>
      <div className="node-info">
        <span className="node-name">{member.name}</span>
        <span className="node-role">{member.role}</span>
      </div>
    </div>
  )
}

export default function OrgChart() {
  const [selectedAgent, setSelectedAgent] = useState(null)

  const human = orgHumans.find(h => h.visible)
  const mainAgent = orgAgents.find(a => a.visible && a.level === 2)
  const chiefs = orgAgents.filter(a => a.visible && a.level === 3)

  async function handleNaviClick(agent) {
    setSelectedAgent({ ...agent, loading: true })
    try {
      const enriched = await loadAgentDetailsFromWorkspace(agent)
      setSelectedAgent(enriched)
    } catch (err) {
      setSelectedAgent({ ...agent, error: err.message, loading: false })
    }
  }

  return (
    <div className="org-chart">
      <div className="org-header">
        <h2>Estructura Organitzativa</h2>
        <span className="org-badge">Multi-Agent</span>
      </div>

      <div className="org-tree">
        {human && (
          <div className="org-level">
            <OrgNode member={human} />
          </div>
        )}

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch" />
        </div>

        {mainAgent && (
          <div className="org-level">
            <OrgNode member={mainAgent} onClick={() => handleNaviClick(mainAgent)} />
          </div>
        )}

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch multi" />
        </div>

        <div className="org-level overview-level">
          <TeamOverview />
        </div>
      </div>

      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}
