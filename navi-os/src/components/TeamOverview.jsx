import { Bot, Wrench, BookOpen, Code, Activity } from 'lucide-react'
import './TeamOverview.css'

// Agent data - realistic team members
const AGENTS = [
  {
    id: 'devops',
    name: 'DevOps Agent',
    role: 'Infrastructure & Automation',
    icon: Wrench,
    status: 'online',
    tasks: 5,
    description: 'Handles cron jobs, automation, CI/CD pipelines, and system maintenance'
  },
  {
    id: 'research',
    name: 'Research Agent',
    role: 'Web & Documentation',
    icon: BookOpen,
    status: 'busy',
    tasks: 3,
    description: 'Handles web search, documentation review, and continuous learning'
  },
  {
    id: 'code',
    name: 'Code Agent',
    role: 'Implementation & Review',
    icon: Code,
    status: 'online',
    tasks: 8,
    description: 'Handles code review, implementation, debugging, and refactoring'
  }
]

// Delegation feed data
const DELEGATIONS = [
  { id: 1, from: 'Navi', to: 'Code Agent', task: 'Review Navi OS authentication flow', time: '2m ago' },
  { id: 2, from: 'Navi', to: 'DevOps Agent', task: 'Set up daily backup cron', time: '15m ago' },
  { id: 3, from: 'Navi', to: 'Research Agent', task: 'Investigate OpenClaw v2 features', time: '1h ago' },
  { id: 4, from: 'Navi', to: 'Code Agent', task: 'Fix TaskManager state bug', time: '2h ago' },
  { id: 5, from: 'Navi', to: 'Research Agent', task: 'Find替代Claude API options', time: '3h ago' }
]

function StatusIndicator({ status }) {
  return (
    <span className={`status-indicator status-${status}`}>
      <span className="status-dot" />
      <span className="status-label">{status}</span>
    </span>
  )
}

function AgentCard({ agent }) {
  const Icon = agent.icon
  return (
    <div className="agent-card">
      <div className="agent-card-header">
        <div className="agent-icon-wrapper">
          <Icon size={20} />
        </div>
        <StatusIndicator status={agent.status} />
      </div>
      <div className="agent-card-body">
        <h4 className="agent-name">{agent.name}</h4>
        <span className="agent-role">{agent.role}</span>
        <p className="agent-description">{agent.description}</p>
      </div>
      <div className="agent-card-footer">
        <div className="task-count">
          <Activity size={14} />
          <span>{agent.tasks} tasks</span>
        </div>
      </div>
    </div>
  )
}

function DelegationFeed() {
  return (
    <div className="delegation-feed">
      <div className="delegation-header">
        <Bot size={16} />
        <h4>Recent Delegations</h4>
      </div>
      <div className="delegation-list">
        {DELEGATIONS.map(d => (
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
    </div>
  )
}

export default function TeamOverview() {
  return (
    <div className="team-overview">
      <div className="team-agents">
        {AGENTS.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
      <DelegationFeed />
    </div>
  )
}
