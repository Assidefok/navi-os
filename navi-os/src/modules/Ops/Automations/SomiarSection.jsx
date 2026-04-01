import { useState, useEffect } from 'react'
import { Moon, SunMedium, Play, Pause, RefreshCw, Clock, Zap, BarChart3, ChevronDown } from 'lucide-react'

const CHIEF_EMOJIS = { elom: '🚀', warren: '📊', jeff: '⚡', sam: '🤖' }

function SomiarCard({ mode, config }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [running, setRunning] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchStatus = () => {
    setLoading(true)
    fetch(`/api/somiar/${mode}/status`)
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchStatus() }, [])

  const handleToggle = async () => {
    setToggling(true)
    try {
      await fetch(`/api/somiar/${mode}/toggle`, { method: 'POST' })
      fetchStatus()
    } finally { setToggling(false) }
  }

  const handleRun = async () => {
    setRunning(true)
    try {
      const res = await fetch(`/api/somiar/${mode}/run`, { method: 'POST' })
      const data = await res.json()
      if (!data.ok) alert(data.reason)
      else fetchStatus()
    } finally { setRunning(false) }
  }

  if (loading) {
    return (
      <div className={`somiar-card ${mode}`}>
        <div className="somiar-loading">
          <RefreshCw size={16} className="spin" />
          Carregant...
        </div>
      </div>
    )
  }

  const isDay = mode === 'dia'
  const Icon = isDay ? SunMedium : Moon
  const label = isDay ? 'Somiar de Dia' : 'Somiar de Nit'
  const color = isDay ? '#f59e0b' : '#6366f1'
  const bg = isDay ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)'
  const border = isDay ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'

  const formatLast = (iso) => {
    if (!iso) return 'Mai executat'
    try { return new Date(iso).toLocaleString('ca-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
    catch { return iso }
  }

  return (
    <div className={`somiar-card ${mode} ${status?.enabled ? 'enabled' : 'disabled'}`}
      style={{ borderColor: border, background: status?.enabled ? bg : 'rgba(255,255,255,0.02)' }}>
      <div className="somiar-header" onClick={() => setExpanded(v => !v)}>
        <div className="somiar-header-left">
          <Icon size={20} style={{ color, flexShrink: 0 }} />
          <div className="somiar-title-group">
            <span className="somiar-title">{label}</span>
            <span className="somiar-window">{config.window}</span>
          </div>
          <span className={`somiar-badge ${status?.enabled ? 'on' : 'off'}`}
            style={{ background: status?.enabled ? color + '22' : 'rgba(255,255,255,0.06)', color: status?.enabled ? color : '#888' }}>
            {status?.enabled ? 'Actiu' : 'Pausat'}
          </span>
        </div>
        <div className="somiar-header-right">
          {status?.lastRun && (
            <span className="somiar-last">
              <Clock size={11} />
              {formatLast(status.lastRun)}
            </span>
          )}
          {status?.cycles > 0 && (
            <span className="somiar-cycles">
              <BarChart3 size={11} />
              {status.cycles} cicles
            </span>
          )}
          <button className="somiar-toggle" onClick={e => { e.stopPropagation(); handleToggle() }}
            disabled={toggling} title={status?.enabled ? 'Pausar' : 'Activar'}>
            {status?.enabled ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="somiar-run" onClick={e => { e.stopPropagation(); handleRun() }}
            disabled={running || !status?.enabled} title="Executar ara">
            {running ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
          </button>
          <ChevronDown size={14} className={`somiar-chevron ${expanded ? 'rotated' : ''}`} />
        </div>
      </div>

      <p className="somiar-description">{config.description}</p>

      {expanded && (
        <div className="somiar-details">
          <div className="somiar-chiefs">
            <span className="detail-label">Chiefs implicats:</span>
            <div className="chiefs-row">
              {['elom', 'warren', 'jeff', 'sam'].map(c => (
                <span key={c} className="chief-tag" style={{ color: config.chiefColor[c] }}>
                  {CHIEF_EMOJIS[c]} {c.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div className="somiar-conditions">
            <span className="detail-label">Condició d'execució:</span>
            <span>{config.condition}</span>
          </div>
          <div className="somiar-actions">
            <span className="detail-label">Accions:</span>
            <ul>
              {config.actionList.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          <button className="somiar-refresh" onClick={fetchStatus}>
            <RefreshCw size={12} /> Actualitzar estat
          </button>
        </div>
      )}
    </div>
  )
}

export default function SomiarSection() {
  const dayConfig = {
    window: '9:00 - 20:00',
    description: 'Quan no hi ha activitat meva (missatges, consultes, notifs) durant 30 min, els chiefs proposen millores operatives i de funcionalitats per assolir els objectius.',
    condition: "30 min d'inactivitat + dins horari 9-20h",
    chiefColor: { elom: '#f97316', warren: '#3b82f6', jeff: '#22c55e', sam: '#a855f7' },
    actionList: [
      'Revisió light de cada chief (ELOM, WARREN, JEFF, SAM)',
      'Validació de salut tècnica (SAM)',
      'Auditoria ràpida (WARREN)',
      'Checkpoint operatiu (JEFF)',
      'Proposta de millora si es detecta algo'
    ]
  }
  const nitConfig = {
    window: '20:00 - 06:00',
    description: 'Anàlisi profunda mentre dorms. Cada 30 min sense activitat, els chiefs fan una revisió a fons i generen insights estructurats.',
    condition: '30 min d\'inactivitat + dins horari 20-06h',
    chiefColor: { elom: '#f97316', warren: '#3b82f6', jeff: '#22c55e', sam: '#a855f7' },
    actionList: [
      'Deep dive de cada chief',
      'Snapshot complet del sistema',
      'Anàlisi de memòries dels chiefs',
      'Quality audit complet (WARREN)',
      'Revisió estratègica (ELOM)',
      'Informe nocturn a .somiar-cycles/'
    ]
  }

  return (
    <div className="somiar-section">
      <div className="somiar-section-header">
        <h3>🌙🤖 Somiar — Self-Improvement Automations</h3>
        <p>Els chiefs treballen sols quan no tens res a fer. Revisions automàtiques cada 30 min.</p>
      </div>
      <SomiarCard mode="dia" config={dayConfig} />
      <SomiarCard mode="nit" config={nitConfig} />
    </div>
  )
}
