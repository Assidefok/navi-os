import { useState, useEffect } from 'react'
import { X, Cpu, Check } from 'lucide-react'
import './Settings.css'

const AVAILABLE_MODELS = [
  { id: 'openai-codex/gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI Codex', ctx: '266k', tags: ['default', 'principal'] },
  { id: 'minimax-portal/MiniMax-M2.7', name: 'MiniMax-M2.7', provider: 'MiniMax', ctx: '200k', tags: ['fallback#1'] },
  { id: 'minimax-portal/MiniMax-M2.7-highspeed', name: 'MiniMax-M2.7 HighSpeed', provider: 'MiniMax', ctx: '200k', tags: ['fallback#2'] },
  { id: 'openai-codex/gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#3'] },
  { id: 'openai-codex/gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#4', 'code'] },
  { id: 'openai-codex/gpt-5.2-codex', name: 'GPT-5.2 Codex', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#5', 'code'] },
  { id: 'openai-codex/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#6'] },
  { id: 'openai-codex/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#7'] },
  { id: 'openai-codex/gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#8'] },
  { id: 'openai-codex/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI Codex', ctx: '266k', tags: ['fallback#9'] },
  { id: 'openai-codex/gpt-5.4-nano', name: 'GPT-5.4 Nano', provider: 'OpenAI Codex', ctx: '—', tags: ['pending', 'subagents'], pending: true },
]

function ModelCard({ model, isActive, onSelect }) {
  const isDefault = model.tags.includes('default')
  const isPending = model.pending
  return (
    <div
      className={`model-card ${isActive ? 'active' : ''} ${isDefault ? 'default' : ''} ${isPending ? 'pending' : ''}`}
      onClick={isPending ? undefined : () => onSelect(model.id)}
      role="button"
      tabIndex={isPending ? -1 : 0}
      onKeyDown={e => !isPending && e.key === 'Enter' && onSelect(model.id)}
      style={isPending ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
      <div className="model-card-header">
        <span className="model-name">{model.name}</span>
        {isActive && <Check size={14} className="model-check" />}
        {isDefault && <span className="model-badge default-badge">Principal</span>}
        {isPending && <span className="model-badge pending-badge">Pending</span>}
      </div>
      <div className="model-card-body">
        <span className="model-provider">{model.provider}</span>
        <span className="model-ctx">{model.pending ? 'pending' : `${model.ctx} ctx`}</span>
      </div>
      {model.tags.filter(t => t.startsWith('fallback')).length > 0 && (
        <div className="model-fallback-hint">
          <span className="fallback-label">Fallback #{model.tags.find(t => t.startsWith('fallback'))?.replace('fallback#', '')}</span>
        </div>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="settings-section-title">
      <Icon size={14} />
      {children}
    </h3>
  )
}

export default function Settings({ onClose }) {
  const [activeTab, setActiveTab] = useState('models')
  const [currentModel, setCurrentModel] = useState('openai-codex/gpt-5.4')
  const [ollamaStatus, setOllamaStatus] = useState('no_configurat')

  useEffect(() => {
    // Fetch current model from API if available
    fetch('/api/current-model')
      .then(r => r.json())
      .then(d => { if (d.model) setCurrentModel(d.model) })
      .catch(() => {})
  }, [])

  const handleModelSelect = (modelId) => {
    setCurrentModel(modelId)
    // In a real implementation, this would persist to OpenClaw config
  }

  const tabs = [
    { id: 'models', label: 'Models' },
    { id: 'delegation', label: 'Delegacio' },
    { id: 'system', label: 'Sistema' },
  ]

  return (
    <div
      className="settings-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configuracio"
    >
      <div
        className="settings-modal settings-modal-wide"
        onClick={e => e.stopPropagation()}
      >
        <header className="settings-header">
          <h2>Configuracio</h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Tancar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-body">
          {/* MODELS TAB */}
          {activeTab === 'models' && (
            <div className="settings-section">
              <SectionTitle icon={Cpu}>Models Disponibles</SectionTitle>
              <p className="settings-description">
                Model actual: <strong>{AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || currentModel}</strong>
              </p>
              <div className="models-grid">
                {AVAILABLE_MODELS.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isActive={currentModel === model.id}
                    onSelect={handleModelSelect}
                  />
                ))}
              </div>

              {ollamaStatus === 'no_configurat' && (
                <div className="ollama-notice">
                  <p>Ollama encara no esta configurat. Un cop ho estigui, apareixera aqui com a proveidor adicional per tasques diminutes.</p>
                </div>
              )}
            </div>
          )}

          {/* DELEGATION TAB */}
          {activeTab === 'delegation' && (
            <div className="settings-section">
              <SectionTitle icon={Cpu}>Arquitectura de Delegacio</SectionTitle>
              <div className="delegation-info">
                <div className="delegation-layer">
                  <span className="layer-label">Navi (Tu)</span>
                  <span className="layer-desc">Orquestrador principal</span>
                </div>
                <div className="delegation-arrow">↓</div>
                <div className="delegation-layer">
                  <span className="layer-label">Chiefs (ELOM, WARREN, JEFF, SAM)</span>
                  <span className="layer-desc">Decideixen tasques pròpies vs delegació</span>
                </div>
                <div className="delegation-arrow">↓</div>
                <div className="delegation-layer">
                  <span className="layer-label">Subagents especialitzats</span>
                  <span className="layer-desc">Models petits: GPT-5.2, MiniMax-2.5, GPT-5.3 Codex, Ollama</span>
                </div>
              </div>
              <p className="settings-description">
                Cada chief te el seu propi pla de subagents a <code>team/&lt;chief&gt;/SUBAGENTS.md</code>
              </p>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="settings-section">
              <SectionTitle icon={Cpu}>Sistema</SectionTitle>
              <div className="system-info-grid">
                <div className="system-info-row">
                  <span>Gateway</span>
                  <span className="status-ok">Connectat</span>
                </div>
                <div className="system-info-row">
                  <span>Workspace</span>
                  <span className="status-ok">/home/user/.openclaw/workspace</span>
                </div>
                <div className="system-info-row">
                  <span>Port Navi OS</span>
                  <span className="status-ok">8100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
