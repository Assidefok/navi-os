import { useState, useEffect } from 'react'
import { MessageSquare, Send, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, User } from 'lucide-react'
import './ChiefsCouncil.css'

// ─── Chief definitions ─────────────────────────────────────────────────────────

const CHIEFS = [
  {
    id: 'elom',
    name: 'ELOM',
    label: 'Chief Visionary Officer',
    emoji: '🚀',
    color: '#ff6b35',
    perspective: 'Visio 10x, apostes gegants',
    quote: '"If the scope doesn\'t terrify you, it\'s too small."',
  },
  {
    id: 'warren',
    name: 'WARREN',
    label: 'Chief Quality Officer',
    emoji: '📊',
    color: '#4ecdc4',
    perspective: 'Qualitat, risc, analisi profunda',
    quote: '"Risk comes from not knowing what you\'re doing."',
  },
  {
    id: 'jeff',
    name: 'JEFF',
    label: 'Chief Operations Officer',
    emoji: '⚡',
    color: '#ffe66d',
    perspective: 'Execucio, escalabilitat, processos',
    quote: '"Complexity is the enemy of execution."',
  },
  {
    id: 'sam',
    name: 'SAM',
    label: 'Chief AI Officer',
    emoji: '🤖',
    color: '#a29bfe',
    perspective: 'IA, tecnologia, pragmatisme',
    quote: '"Scale the thing that works."',
  },
]

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, chiefId }) {
  if (status === 'complete') {
    return <span className="cc-badge cc-badge--complete"><CheckCircle2 size={12} /> Completat</span>
  }
  if (status === 'responding') {
    return <span className="cc-badge cc-badge--responding" style={{ borderColor: CHIEFS.find(c => c.id === chiefId)?.color }}><AlertCircle size={12} /> Respondent</span>
  }
  return <span className="cc-badge cc-badge--waiting"><Clock size={12} /> Esperant</span>
}

// ─── Topic composer ───────────────────────────────────────────────────────────

function TopicComposer({ onSubmit, submitting }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim() })
    setTitle('')
    setDescription('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="cc-composer">
      <div className="cc-composer-header">
        <Sparkles size={16} className="cc-composer-icon" />
        <span>Navi proposa un tema</span>
      </div>
      <div className="cc-composer-body">
        <input
          className="cc-input cc-input--title"
          type="text"
          placeholder="Titol del tema..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={120}
        />
        <textarea
          className="cc-input cc-input--desc"
          placeholder="Descripcio o pregunta (opcional)..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          maxLength={600}
        />
        <button
          className="cc-btn cc-btn--primary"
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
        >
          <Send size={14} />
          {submitting ? 'Enviant...' : 'Publicar tema'}
        </button>
      </div>
    </div>
  )
}

// ─── Chief response card ───────────────────────────────────────────────────────

function ChiefCard({ chief, response, topicId, onRespond }) {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hasResponded = !!response

  const handleSubmit = () => {
    if (!draft.trim()) return
    setSubmitting(true)
    onRespond(topicId, chief.id, draft.trim(), () => setSubmitting(false))
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="cc-chief-card" style={{ '--chief-color': chief.color }}>
      <div className="cc-chief-header">
        <div className="cc-chief-identity">
          <span className="cc-chief-emoji">{chief.emoji}</span>
          <div className="cc-chief-info">
            <span className="cc-chief-name">{chief.name}</span>
            <span className="cc-chief-label">{chief.label}</span>
          </div>
        </div>
        {response && (
          <StatusBadge status="complete" chiefId={chief.id} />
        )}
      </div>

      <div className="cc-chief-perspective">
        <span className="cc-perspective-label">Perspectiva activa:</span>
        <span className="cc-perspective-value">{chief.perspective}</span>
      </div>

      {hasResponded ? (
        <div className="cc-chief-response">
          <p className="cc-response-text">{response.text}</p>
          <div className="cc-response-footer">
            <span className="cc-quote">{chief.quote}</span>
            <span className="cc-timestamp">
              <Clock size={11} />
              {new Date(response.timestamp).toLocaleString('ca-ES', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      ) : (
        <div className="cc-chief-pending">
          <p className="cc-pending-text">Aquest chief encara no ha respost.</p>
          <textarea
            className="cc-input cc-input--response"
            placeholder={`Escriu la resposta de ${chief.name}...`}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
          />
          <button
            className="cc-btn cc-btn--chief"
            style={{ '--chief-color': chief.color }}
            onClick={handleSubmit}
            disabled={!draft.trim() || submitting}
          >
            <Send size={13} />
            {submitting ? 'Enviant...' : `Resposta de ${chief.name}`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── History list ───────────────────────────────────────────────────────────────

function HistoryList({ topics, onSelect, selectedId }) {
  const [collapsed, setCollapsed] = useState(false)

  if (topics.length === 0) return null

  return (
    <div className="cc-history">
      <button className="cc-history-toggle" onClick={() => setCollapsed(c => !c)}>
        <MessageSquare size={15} />
        <span>Historial ({topics.length})</span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <div className="cc-history-list">
          {topics.map(topic => {
            const completeCount = (topic.responses || []).filter(r => r.text).length
            const allComplete = completeCount === 4
            return (
              <button
                key={topic.id}
                className={`cc-history-item ${selectedId === topic.id ? 'active' : ''} ${allComplete ? 'complete' : ''}`}
                onClick={() => onSelect(topic)}
              >
                <div className="cc-history-item-left">
                  <span className="cc-history-item-title">{topic.title}</span>
                  <span className="cc-history-item-meta">
                    {completeCount}/4 respostes
                    {allComplete ? ' · Completat' : ''}
                  </span>
                </div>
                <span className="cc-history-item-date">
                  {new Date(topic.createdAt).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit' })}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Topic detail view ─────────────────────────────────────────────────────────

function TopicDetail({ topic, chiefs, onRespond, onBack }) {
  const responsesByChief = Object.fromEntries(
    (topic.responses || []).map(r => [r.chiefId, r])
  )

  const respondedCount = Object.values(responsesByChief).filter(r => r?.text).length
  const allResponded = respondedCount === 4

  return (
    <div className="cc-topic-detail">
      <button className="cc-back-btn" onClick={onBack}>
        <ChevronUp size={15} style={{ transform: 'rotate(-90deg)' }} />
        Tornar al tema actual
      </button>

      <div className="cc-topic-header">
        <h2 className="cc-topic-title">{topic.title}</h2>
        {topic.description && (
          <p className="cc-topic-description">{topic.description}</p>
        )}
        <div className="cc-topic-meta">
          <span className="cc-topic-author">
            <Sparkles size={13} />
            Navi · {new Date(topic.createdAt).toLocaleString('ca-ES', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
          <span className={`cc-topic-status ${allResponded ? 'complete' : 'pending'}`}>
            {respondedCount}/4 respostes
            {allResponded && <CheckCircle2 size={13} />}
          </span>
        </div>
      </div>

      <div className="cc-chiefs-grid">
        {chiefs.map(chief => (
          <ChiefCard
            key={chief.id}
            chief={chief}
            response={responsesByChief[chief.id]}
            topicId={topic.id}
            onRespond={onRespond}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main ChiefsCouncil component ─────────────────────────────────────────────

export default function ChiefsCouncil() {
  const [topics, setTopics] = useState([])
  const [currentTopic, setCurrentTopic] = useState(null)
  const [selectedHistoryTopic, setSelectedHistoryTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchTopics = () => {
    fetch('/api/chiefs-council')
      .then(r => r.json())
      .then(data => {
        const sorted = [...(data.topics || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        setTopics(sorted)
        if (sorted.length > 0 && !currentTopic) {
          setCurrentTopic(sorted[0])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch topics:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  const handleCreateTopic = ({ title, description }) => {
    setSubmitting(true)
    fetch('/api/chiefs-council', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
      .then(r => r.json())
      .then(newTopic => {
        setTopics(prev => [newTopic, ...prev])
        setCurrentTopic(newTopic)
        setSelectedHistoryTopic(null)
        setSubmitting(false)
      })
      .catch(() => setSubmitting(false))
  }

  const handleRespond = (topicId, chiefId, text, onDone) => {
    fetch(`/api/chiefs-council/${topicId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiefId, text }),
    })
      .then(r => r.json())
      .then(updatedTopic => {
        setTopics(prev => prev.map(t => t.id === topicId ? updatedTopic : t))
        if (currentTopic?.id === topicId) setCurrentTopic(updatedTopic)
        if (selectedHistoryTopic?.id === topicId) setSelectedHistoryTopic(updatedTopic)
        onDone()
      })
      .catch(() => onDone())
  }

  const handleSelectHistory = (topic) => {
    setSelectedHistoryTopic(topic)
    setCurrentTopic(topic)
  }

  const viewTopic = selectedHistoryTopic || currentTopic

  if (loading) {
    return (
      <div className="cc-loading">
        <div className="cc-spinner" />
        <span>Carregant Chiefs Council...</span>
      </div>
    )
  }

  return (
    <div className="chiefs-council">
      <div className="cc-header">
        <div className="cc-header-left">
          <MessageSquare size={22} className="cc-header-icon" />
          <div>
            <h2 className="cc-title">Chiefs Council</h2>
            <p className="cc-subtitle">Espai on Navi proposa temes i els 4 chiefs responen des de la seva perspectiva</p>
          </div>
        </div>
        <div className="cc-chiefs-emoji-row">
          {CHIEFS.map(c => (
            <span key={c.id} className="cc-header-chief-emoji" title={c.name}>{c.emoji}</span>
          ))}
        </div>
      </div>

      <TopicComposer onSubmit={handleCreateTopic} submitting={submitting} />

      <HistoryList
        topics={topics}
        selectedId={viewTopic?.id}
        onSelect={handleSelectHistory}
      />

      {viewTopic ? (
        <TopicDetail
          topic={viewTopic}
          chiefs={CHIEFS}
          onRespond={handleRespond}
          onBack={() => { setSelectedHistoryTopic(null); setCurrentTopic(topics[0] || null) }}
        />
      ) : (
        <div className="cc-empty">
          <MessageSquare size={40} className="cc-empty-icon" />
          <p>Encara no hi ha temes.</p>
          <p>Posa un tema a dalt per iniciar el debat.</p>
        </div>
      )}
    </div>
  )
}
