import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, MessageSquare, ChevronRight, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import './Standups.css'

const CHIEF_COLORS = {
  elom: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', emoji: '🚀' },
  warren: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', emoji: '📊' },
  jeff: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', emoji: '⚡' },
  sam: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', emoji: '🤖' }
}

function formatNextStandup() {
  const now = new Date()
  const standupHour = 8
  const standupMin = 30
  
  // Next standup: today at 8:30 or tomorrow if passed
  let next = new Date(now)
  next.setHours(standupHour, standupMin, 0, 0)
  
  // If today already passed, go to tomorrow
  if (now >= next) {
    next.setDate(next.getDate() + 1)
  }
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1)
  }
  
  return next
}

function TimeUntil({ target }) {
  const [now, setNow] = useState(new Date())
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])
  
  const diff = target - now
  if (diff <= 0) return <span className="standup-soon">Ara!</span>
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return <span>{days}d {hours % 24}h</span>
  }
  return <span>{hours}h {mins}m</span>
}

function ChiefStatusMini({ chiefId, name, emoji }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/chief/${chiefId}/status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [chiefId])
  
  const cfg = CHIEF_COLORS[chiefId.toLowerCase()] || { color: '#888', bg: 'rgba(136,136,136,0.15)', emoji: '👤' }
  
  return (
    <div className="chief-status-mini" style={{ borderColor: cfg.color + '30' }}>
      <div className="chief-mini-header">
        <span className="chief-mini-emoji">{emoji}</span>
        <span className="chief-mini-name">{name}</span>
      </div>
      {loading ? (
        <div className="chief-mini-loading">Carregant...</div>
      ) : status ? (
        <div className="chief-mini-content">
          <div className="chief-mini-project">
            {status.currentProject || 'Sense projecte actiu'}
          </div>
          <div className="chief-mini-meta">
            <span className={`status-dot ${status.status || 'unknown'}`} />
            <span>{status.status === 'in-progress' ? 'En curs' : status.status === 'review' ? 'En revisió' : status.status === 'done' ? 'Completat' : 'Aturat'}</span>
          </div>
          {status.commitment && (
            <div className="chief-mini-commitment">
              <MessageSquare size={11} />
              <span>{status.commitment}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="chief-mini-empty">No hay datos</div>
      )}
    </div>
  )
}

function StandupHistory({ meetings }) {
  const [expanded, setExpanded] = useState(null)
  
  if (!meetings || meetings.length === 0) {
    return (
      <div className="standups-empty">
        <Calendar size={32} style={{ opacity: 0.2 }} />
        <p>No hay reunions enregistrades</p>
      </div>
    )
  }
  
  return (
    <div className="standup-history">
      {meetings.map(m => (
        <div key={m.file} className={`standup-entry ${expanded === m.file ? 'expanded' : ''}`}>
          <button className="standup-entry-header" onClick={() => setExpanded(expanded === m.file ? null : m.file)}>
            <div className="entry-date">
              <Calendar size={14} />
              <span>{m.date}</span>
            </div>
            <div className="entry-chiefs">
              {m.chiefs.map(c => {
                const cfg = CHIEF_COLORS[c.toLowerCase()]
                return cfg ? (
                  <span key={c} className="chief-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.emoji}
                  </span>
                ) : null
              })}
            </div>
            <ChevronRight size={14} className={`entry-chevron ${expanded === m.file ? 'rotated' : ''}`} />
          </button>
          {expanded === m.file && (
            <div className="standup-entry-body">
              {m.summary ? (
                <div className="entry-summary">
                  <h4>Resum Executiu</h4>
                  <p>{m.summary}</p>
                </div>
              ) : null}
              {m.actions && m.actions.length > 0 && (
                <div className="entry-actions">
                  <h4>Action Items</h4>
                  <div className="action-list">
                    {m.actions.map((a, i) => (
                      <div key={i} className="action-item">
                        <CheckCircle2 size={12} className={a.done ? 'done' : 'pending'} />
                        <span>{a.text}</span>
                        <span className="action-owner">{a.owner}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <a href={`/api/standup/${m.file}`} target="_blank" className="entry-full-link">
                Veure document complet →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Standups() {
  const [loading, setLoading] = useState(true)
  const [standups, setStandups] = useState([])
  const [triggering, setTriggering] = useState(false)
  const nextStandup = formatNextStandup()
  
  useEffect(() => {
    fetch('/api/standups')
      .then(r => r.json())
      .then(d => {
        setStandups(d.meetings || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])
  
  const triggerStandup = async () => {
    setTriggering(true)
    try {
      const res = await fetch('/api/standup/trigger', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        // Refresh list
        const refresh = await fetch('/api/standups').then(r => r.json())
        setStandups(refresh.meetings || [])
      }
    } catch (e) {
      console.error('Error triggering standup:', e)
    }
    setTriggering(false)
  }
  
  const today = new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const isWeekday = new Date().getDay() !== 0 && new Date().getDay() !== 6
  const isStandupTime = new Date().getHours() >= 8 && new Date().getHours() < 10
  
  return (
    <div className="standups-module">
      <div className="standups-header">
        <div className="standups-title-row">
          <h2>🦋 Standups</h2>
          <button 
            className={`trigger-btn ${triggering ? 'loading' : ''}`} 
            onClick={triggerStandup}
            disabled={triggering}
            title="Generar standup ara"
          >
            <Play size={14} />
            {triggering ? 'Generant...' : 'Generar Ara'}
          </button>
        </div>
        <p className="standups-date">{today}</p>
      </div>
      
      {/* Next Standup Countdown */}
      <div className="standup-countdown" style={{ borderColor: isStandupTime ? '#22c55e' : 'rgba(255,184,0,0.3)' }}>
        <div className="countdown-label">
          <Clock size={16} />
          <span>Proper standup</span>
          {isWeekday ? (
            <span className="weekday-badge">Laborable</span>
          ) : (
            <span className="weekend-badge">Cap de setmana</span>
          )}
        </div>
        <div className="countdown-time">
          <TimeUntil target={nextStandup} />
          <span className="countdown-actual">
            {nextStandup.toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · {nextStandup.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {isStandupTime && (
          <div className="standup-alert">
            <AlertCircle size={14} />
            <span>És l'hora del standup! Prem "Generar Ara"</span>
          </div>
        )}
      </div>
      
      {/* Chiefs Status */}
      <div className="standups-chiefs">
        <h3 className="section-title">
          <Users size={15} />
          Estat dels Chiefs
        </h3>
        <div className="chiefs-grid">
          <ChiefStatusMini chiefId="elom" name="ELOM" emoji="🚀" />
          <ChiefStatusMini chiefId="warren" name="WARREN" emoji="📊" />
          <ChiefStatusMini chiefId="jeff" name="JEFF" emoji="⚡" />
          <ChiefStatusMini chiefId="sam" name="SAM" emoji="🤖" />
        </div>
      </div>
      
      {/* Standup History */}
      <div className="standups-history">
        <h3 className="section-title">
          <MessageSquare size={15} />
          Historial de Standups
        </h3>
        {loading ? (
          <div className="standups-loading">
            <RefreshCw size={20} className="spin" />
            <span>Carregant reunions...</span>
          </div>
        ) : (
          <StandupHistory meetings={standups} />
        )}
      </div>
    </div>
  )
}
