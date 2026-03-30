import { useState } from 'react'
import { FlaskConical, Code, Rocket, FileCode, Clock, ChevronRight, Plus, X, Play, Pause } from 'lucide-react'
import Modal from '../components/ui/Modal'
import FeatureCard from '../components/ui/FeatureCard'
import './Lab.css'

const FEATURES = [
  { icon: FlaskConical, name: 'Prototypes', desc: 'Projectes en desenvolupament' },
  { icon: Code, name: 'Build Logs', desc: 'Registre de construccio' },
  { icon: Rocket, name: 'Deploy', desc: 'Desplegament' },
  { icon: FileCode, name: 'Skills', desc: 'Habilitats del sistema' }
]

const PROTOTYPES = [
  {
    id: 1,
    name: 'Navi OS v2',
    description: 'Sistema operatiu personal amb React',
    status: 'active',
    lastBuild: '2026-03-30 01:55',
    progress: 75
  },
  {
    id: 2,
    name: 'Cron Manager',
    description: 'Gestio avançada de tasques programades',
    status: 'planning',
    lastBuild: '2026-03-28 15:30',
    progress: 30
  },
  {
    id: 3,
    name: 'Memory Bridge',
    description: 'Sincronitzacio de memoria entre sessions',
    status: 'planning',
    lastBuild: '2026-03-25 10:00',
    progress: 15
  }
]

const BUILD_LOGS = [
  { id: 1, timestamp: '2026-03-30 01:55', type: 'build', message: 'Navi OS - Build completat', status: 'success' },
  { id: 2, timestamp: '2026-03-30 03:00', type: 'cron', message: 'Overnight Audit - 2 issues resolts', status: 'success' },
  { id: 3, timestamp: '2026-03-30 08:00', type: 'cron', message: 'Daily Brief - Generat', status: 'success' },
  { id: 4, timestamp: '2026-03-29 23:00', type: 'cron', message: 'Rolling Docs - Actualitzat', status: 'success' },
  { id: 5, timestamp: '2026-03-29 02:00', type: 'cron', message: 'Repo Backup - Push exit', status: 'success' },
  { id: 6, timestamp: '2026-03-28 15:30', type: 'build', message: 'Cron Manager - Inicialitzat', status: 'success' },
  { id: 7, timestamp: '2026-03-28 10:15', type: 'build', message: 'React Migration - Completada', status: 'success' },
  { id: 8, timestamp: '2026-03-27 18:00', type: 'build', message: 'Mission Control - Implementat', status: 'success' }
]

export default function Lab() {
  const [showPrototypes, setShowPrototypes] = useState(false)
  const [showBuildLogs, setShowBuildLogs] = useState(false)
  const [selectedPrototype, setSelectedPrototype] = useState(null)

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#00ff41'
      case 'planning': return '#ffb800'
      case 'paused': return '#a0a0b0'
      default: return '#a0a0b0'
    }
  }

  return (
    <div className="module-view lab">
      <h1 className="dashboard-title green neon-green">Laboratori</h1>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" onClick={() => setShowPrototypes(true)}>
          <FlaskConical size={18} />
          Prototypes
        </button>
        <button className="action-btn" onClick={() => setShowBuildLogs(true)}>
          <Clock size={18} />
          Build Logs
        </button>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <FeatureCard
            key={i}
            icon={f.icon}
            title={f.name}
            description={f.desc}
            colorClass="green"
            onClick={
              f.name === 'Prototypes' ? () => setShowPrototypes(true) :
              f.name === 'Build Logs' ? () => setShowBuildLogs(true) : undefined
            }
          />
        ))}
      </div>

      {/* Prototypes Modal */}
      <Modal
        isOpen={showPrototypes}
        onClose={() => setShowPrototypes(false)}
        title="Prototypes"
        width="80%"
        height="80%"
      >
        <div className="prototypes-grid">
          {PROTOTYPES.map(proto => (
            <div 
              key={proto.id}
              className="prototype-card"
              onClick={() => setSelectedPrototype(proto)}
            >
              <div className="proto-header">
                <div 
                  className="proto-status"
                  style={{ background: getStatusColor(proto.status) }}
                />
                <span className="proto-status-text">{proto.status}</span>
              </div>
              <h3>{proto.name}</h3>
              <p>{proto.description}</p>
              <div className="proto-progress">
                <div 
                  className="proto-progress-bar"
                  style={{ width: `${proto.progress}%` }}
                />
              </div>
              <div className="proto-footer">
                <span>Ultim build: {proto.lastBuild}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Prototype Detail Modal */}
      <Modal
        isOpen={!!selectedPrototype}
        onClose={() => setSelectedPrototype(null)}
        title={selectedPrototype?.name || ''}
        width="75%"
        height="75%"
      >
        {selectedPrototype && (
          <div className="prototype-detail">
            <div className="detail-header">
              <div className="detail-status">
                <span 
                  className="status-dot"
                  style={{ background: getStatusColor(selectedPrototype.status) }}
                />
                {selectedPrototype.status}
              </div>
              <div className="detail-actions">
                <button className="detail-btn">
                  <Play size={16} /> Iniciar
                </button>
                <button className="detail-btn secondary">
                  <Pause size={16} /> Pausar
                </button>
              </div>
            </div>
            <p className="detail-description">{selectedPrototype.description}</p>
            <div className="detail-progress">
              <span>Progres</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${selectedPrototype.progress}%` }}
                />
              </div>
              <span>{selectedPrototype.progress}%</span>
            </div>
            <div className="detail-section">
              <h4>Build History</h4>
              <div className="build-history">
                <div className="build-item">
                  <Clock size={14} />
                  <span>{selectedPrototype.lastBuild}</span>
                  <span className="build-message">Ultim build</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Build Logs Modal */}
      <Modal
        isOpen={showBuildLogs}
        onClose={() => setShowBuildLogs(false)}
        title="Build Logs"
        width="80%"
        height="80%"
      >
        <div className="build-logs-list">
          {BUILD_LOGS.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-icon">
                {log.type === 'build' ? <Code size={16} /> : <Clock size={16} />}
              </div>
              <div className="log-content">
                <div className="log-message">{log.message}</div>
                <div className="log-timestamp">{log.timestamp}</div>
              </div>
              <div className={`log-status ${log.status}`}>
                {log.status === 'success' ? 'OK' : 'ERR'}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
