import { User, Bot, Columns, Users } from 'lucide-react'
import './OrgChart.css'

export default function OrgChart() {
  return (
    <div className="org-chart">
      <div className="org-header">
        <h2>Estructura Organitzativa</h2>
        <span className="org-badge">Placeholder</span>
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

        {/* Level 2: Goat (Main Agent) */}
        <div className="org-level">
          <div className="org-node main-agent">
            <div className="node-icon goat">
              <Bot size={24} />
            </div>
            <div className="node-info">
              <span className="node-name">Goat</span>
              <span className="node-role">Main Agent</span>
            </div>
          </div>
        </div>

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch" />
        </div>

        {/* Level 3: Agent Columns */}
        <div className="org-level columns-level">
          <div className="org-node column-agent">
            <div className="node-icon">
              <Columns size={24} />
            </div>
            <div className="node-info">
              <span className="node-name">Agent Columns</span>
              <span className="node-role">Specialized Agents</span>
            </div>
            <div className="node-placeholder">
              <span>Coming soon</span>
            </div>
          </div>
        </div>

        <div className="org-connector">
          <div className="connector-line" />
          <div className="connector-branch multi" />
        </div>

        {/* Level 4: Sub-agents */}
        <div className="org-level sub-agents-level">
          <div className="org-node sub-agent">
            <div className="node-icon">
              <Users size={20} />
            </div>
            <div className="node-info">
              <span className="node-name">Sub-Agents</span>
              <span className="node-role">Task Executors</span>
            </div>
            <div className="node-placeholder">
              <span>Coming soon</span>
            </div>
          </div>
          <div className="org-node sub-agent">
            <div className="node-icon">
              <Users size={20} />
            </div>
            <div className="node-info">
              <span className="node-name">Sub-Agents</span>
              <span className="node-role">Task Executors</span>
            </div>
            <div className="node-placeholder">
              <span>Coming soon</span>
            </div>
          </div>
          <div className="org-node sub-agent">
            <div className="node-icon">
              <Users size={20} />
            </div>
            <div className="node-info">
              <span className="node-name">Sub-Agents</span>
              <span className="node-role">Task Executors</span>
            </div>
            <div className="node-placeholder">
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
