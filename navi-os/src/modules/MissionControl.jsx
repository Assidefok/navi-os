import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cpu, MessageSquare, Clock, Bot, Sparkles, Moon } from 'lucide-react'
import './MissionControl.css'

const MODELS = [
  { id: 'minimax-m2', name: 'MiniMax-M2', provider: 'MiniMax' },
  { id: 'codex-5.3', name: 'Codex 5.3', provider: 'OpenAI' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google' }
]

const SESSIONS = [
  { id: 1, label: 'Sessio Principal (actual)', icon: MessageSquare, status: 'Activa', duration: '2h 34m' },
  { id: 2, label: 'Navi OS', icon: Bot, status: 'Activa', duration: '1h 12m' },
  { id: 3, label: 'Subagent - Dev', icon: Sparkles, status: 'Inactiva', duration: '45m' }
]

const CRON_JOBS = [
  { id: 1, name: 'Repo Backup', schedule: '02:00', status: 'Programat', icon: Moon },
  { id: 2, name: 'Overnight Audit', schedule: '03:00', status: 'Programat', icon: Clock },
  { id: 3, name: 'Daily Brief', schedule: '08:00', status: 'Programat', icon: MessageSquare },
  { id: 4, name: 'Rolling Docs', schedule: '23:00', status: 'Programat', icon: Clock }
]

export default function MissionControl() {
  const [expandedSession, setExpandedSession] = useState(null)
  const [selectedModel, setSelectedModel] = useState('minimax-m2')

  const toggleSession = (id) => {
    setExpandedSession(expandedSession === id ? null : id)
  }

  return (
    <div className="mission-control">
      <div className="mc-header">
        <h2>Mission Control</h2>
      </div>

      {/* Model Selection */}
      <div className="mc-section">
        <h3>
          <Cpu size={16} />
          Model Actiu
        </h3>
        <div className="model-selector">
          {MODELS.map(model => (
            <button
              key={model.id}
              className={`model-btn ${selectedModel === model.id ? 'active' : ''}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <span className="model-name">{model.name}</span>
              <span className="model-provider">{model.provider}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="mc-section">
        <h3>
          <MessageSquare size={16} />
          Sessions Actives
        </h3>
        <div className="sessions-list">
          {SESSIONS.map(session => (
            <div key={session.id} className="session-card">
              <div 
                className="session-header"
                onClick={() => toggleSession(session.id)}
              >
                <div className="session-info">
                  <session.icon size={18} />
                  <span className="session-label">{session.label}</span>
                </div>
                <div className="session-meta">
                  <span className={`session-status ${session.status.toLowerCase()}`}>
                    {session.status}
                  </span>
                  {expandedSession === session.id ? 
                    <ChevronUp size={16} /> : <ChevronDown size={16} />
                  }
                </div>
              </div>
              {expandedSession === session.id && (
                <div className="session-details">
                  <div className="detail-row">
                    <span>Duracio:</span>
                    <span>{session.duration}</span>
                  </div>
                  <div className="detail-row">
                    <span>ID:</span>
                    <span>ses-{session.id.toString().padStart(4, '0')}</span>
                  </div>
                  <div className="detail-row">
                    <span>Estat:</span>
                    <span className={session.status === 'Activa' ? 'text-success' : 'text-muted'}>
                      {session.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="mc-section">
        <h3>
          <Clock size={16} />
          Cron Jobs
        </h3>
        <div className="cron-list">
          {CRON_JOBS.map(cron => (
            <div key={cron.id} className="cron-item">
              <cron.icon size={16} />
              <span className="cron-name">{cron.name}</span>
              <span className="cron-schedule">{cron.schedule}</span>
              <span className="cron-status">{cron.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
