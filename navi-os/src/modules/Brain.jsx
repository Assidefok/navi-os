import { useState, useEffect } from 'react'
import { Brain as BrainIcon, FileText, Search, BookOpen, Target, Clock, ChevronRight } from 'lucide-react'
import Modal from '../components/ui/Modal'
import FeatureCard from '../components/ui/FeatureCard'
import './Brain.css'

const FEATURES = [
  { icon: BrainIcon, name: 'Memory', desc: 'Memoria persistent' },
  { icon: FileText, name: 'Notes', desc: 'Notes i apunts' },
  { icon: Search, name: 'Search', desc: 'Cerca inteligent' },
  { icon: BookOpen, name: 'Knowledge', desc: 'Base de coneixement' },
  { icon: Target, name: 'Focus', desc: 'Mode concentracio' },
  { icon: Clock, name: 'History', desc: 'Historial de briefs' }
]

// Mock daily briefs data
const BRIEFS = [
  {
    id: 1,
    date: '2026-03-30',
    title: ' Dilluns 30 - Prioritats',
    priority: 'Alta',
    sections: [
      { title: 'Prioritats avui', content: '- Finalitzar modul Lab\n- Revisar cron jobs actius\n- Preparar demo per cliente' },
      { title: 'Activitat overnight', content: '- Audit nocturnal: 2 issues resolts\n- Backup git: Exit' },
      { title: 'Items pendents', content: '- Integracio API externa\n- Testing模块 nous' }
    ]
  },
  {
    id: 2,
    date: '2026-03-29',
    title: ' Divendres 29 - Resum',
    priority: 'Normal',
    sections: [
      { title: 'Prioritats', content: '- Migracio React completada\n- 4 cron jobs configurats' },
      { title: 'Activitat', content: '- Navi OS en produccio\n- Daily briefs actiu' }
    ]
  },
  {
    id: 3,
    date: '2026-03-28',
    title: ' Dijous 28 - Setup',
    priority: 'Normal',
    sections: [
      { title: 'Inici', content: '- Configuracio inicial workspace\n- Estructura de fitxers' }
    ]
  }
]

function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('- ')) {
      return <li key={i}>{line.substring(2)}</li>
    }
    return <p key={i}>{line}</p>
  })
}

export default function Brain() {
  const [briefs, setBriefs] = useState(BRIEFS)
  const [selectedBrief, setSelectedBrief] = useState(BRIEFS[0])
  const [briefModal, setBriefModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)

  return (
    <div className="module-view brain">
      <h1 className="dashboard-title sky neon-sky">Cervell</h1>

      {/* Daily Brief Section */}
      <div className="brief-section">
        <div className="brief-header" onClick={() => setBriefModal(true)}>
          <div className="brief-info">
            <FileText size={20} className="sky" />
            <div>
              <h3>Daily Brief</h3>
              <p>{selectedBrief.title}</p>
            </div>
          </div>
          <div className="brief-meta">
            <span className={`priority-badge ${selectedBrief.priority.toLowerCase()}`}>
              {selectedBrief.priority}
            </span>
            <ChevronRight size={18} />
          </div>
        </div>
        
        <button className="history-btn" onClick={() => setHistoryModal(true)}>
          <Clock size={16} />
          Veure historial
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
            colorClass="sky"
            onClick={f.name === 'History' ? () => setHistoryModal(true) : undefined}
          />
        ))}
      </div>

      {/* Brief Detail Modal */}
      <Modal
        isOpen={briefModal}
        onClose={() => setBriefModal(false)}
        title={selectedBrief.title}
      >
        <div className="brief-content">
          {selectedBrief.sections.map((section, i) => (
            <div key={i} className="brief-section-content">
              <h4>{section.title}</h4>
              <div className="markdown-content">
                {renderMarkdown(section.content)}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModal}
        onClose={() => setHistoryModal(false)}
        title="Historial de Daily Briefs"
        width="60%"
        height="70%"
      >
        <div className="history-list">
          {briefs.map(brief => (
            <div 
              key={brief.id}
              className={`history-item ${selectedBrief.id === brief.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedBrief(brief)
                setHistoryModal(false)
                setBriefModal(true)
              }}
            >
              <div className="history-date">{brief.date}</div>
              <div className="history-title">{brief.title}</div>
              <span className={`priority-badge ${brief.priority.toLowerCase()}`}>
                {brief.priority}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
