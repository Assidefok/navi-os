import { User, Bot, Sparkles } from 'lucide-react'
import TeamOverview from '../components/TeamOverview'
import './OrgChart.css'

export default function OrgChart() {
  return (
    <div className="org-chart">
      <div className="org-header">
        <h2>Estructura Organitzativa</h2>
        <span className="org-badge">Multi-Agent</span>
      </div>

      <div className="org-tree">
        {/* Level 1: Human (Aleix) */}
        <div className="org-level">
          <div className="org-node human">
            <div className="node-icon">
              <User size={24} />
            </div>
            <div className="node-info">
              <span className="node-name">Aleix</span>
              <span className="node-role">Human</span>
            </div>
          </div>
        </div>

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch" />
        </div>

        {/* Level 2: Navi (Chief of Staff) */}
        <div className="org-level">
          <div className="org-node main-agent">
            <div className="node-icon navi">
              <Sparkles size={24} />
            </div>
            <div className="node-info">
              <span className="node-name">Navi</span>
              <span className="node-role">Chief of Staff</span>
            </div>
          </div>
        </div>

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch multi" />
        </div>

        {/* Level 3: Specialized Chiefs (TeamOverview) */}
        <div className="org-level overview-level">
          <TeamOverview />
        </div>
      </div>
    </div>
  )
}
