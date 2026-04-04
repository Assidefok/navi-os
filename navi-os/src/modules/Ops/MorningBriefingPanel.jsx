// MorningBriefingPanel.jsx - JEFF: Operations morning briefing panel
import { useState, useEffect } from 'react'
import { Radio, Lightbulb, CheckCircle2, FileText, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'

const PROPOSALS_STORAGE_KEY = 'navi_ops_proposals'

function useActiveSessions() {
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const load = () => {
      fetch('/api/sessions')
        .then(r => r.json())
        .then(d => {
          const sessions = d.sessions || []
          const active = sessions.filter(s => s.presenceActive || s.status === 'running' || s.live)
          setCount(active.length)
          setTotal(sessions.length)
          setLive(true)
        })
        .catch(() => setLive(false))
    }
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [])

  return { count, total, live }
}

function useProposals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const pendingProposals = (data.proposals || []).filter(p => {
        // Pending statuses: preshape, debate, pending (SLA 48h)
        return ['preshape', 'debate', 'pending'].includes(p.status)
      })
      setPending(pendingProposals)
      setLoading(false)
      return
    }
    import('../../data/proposals.json').then(data => {
      const pendingProposals = (data.default.proposals || []).filter(p =>
        ['preshape', 'debate', 'pending'].includes(p.status)
      )
      setPending(pendingProposals)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const alta = pending.filter(p => p.priority === 'alta').length
  const mitjana = pending.filter(p => p.priority === 'media').length
  const baixa = pending.filter(p => p.priority === 'baixa').length

  return { pending, total: pending.length, alta, mitjana, baixa, loading }
}

function useDeliverables() {
  const [reviewToday, setReviewToday] = useState(0)
  const [deliveredToday, setDeliveredToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    const stored = localStorage.getItem('navi_ops_deliverables')
    if (stored) {
      const data = JSON.parse(stored)
      processData(data, today)
    } else {
      import('../../data/deliverables.json').then(data => {
        processData(data.default, today)
      }).catch(() => setLoading(false))
    }

    function processData(data, today) {
      const review = data.filter(d => {
        if (d.status !== 'review') return false
        const historyEntry = d.history?.find(h => h.status === 'review')
        return historyEntry && historyEntry.date === today
      }).length
      const delivered = data.filter(d => {
        if (d.status !== 'delivered') return false
        const historyEntry = d.history?.find(h => h.status === 'delivered')
        return historyEntry && historyEntry.date === today
      }).length
      setReviewToday(review)
      setDeliveredToday(delivered)
      setLoading(false)
    }
  }, [])

  return { reviewToday, deliveredToday, loading }
}

function useDailyBrief() {
  const [brief, setBrief] = useState(null)

  useEffect(() => {
    // Fetch from /api/briefs which returns daily-*.md files sorted by date desc
    fetch('/api/briefs')
      .then(r => r.json())
      .then(data => {
        if (data.briefs?.[0]) {
          setBrief(data.briefs[0])
        }
      })
      .catch(() => {})
  }, [])

  return brief
}

export default function MorningBriefingPanel() {
  const { count: activeSessions, total: totalSessions, live } = useActiveSessions()
  const { total: pendingProposals, alta, mitjana, baixa, loading: proposalsLoading } = useProposals()
  const { reviewToday, deliveredToday, loading: tasksLoading } = useDeliverables()
  const dailyBrief = useDailyBrief()

  const PRIORITY_COLORS = { alta: '#ff453a', mitjana: '#ffb800', baixa: '#30d158' }

  return (
    <div className="mbp-panel">
      {/* Panel title */}
      <div className="mbp-header">
        <div className="mbp-title-row">
          <Radio size={16} className="mbp-title-icon" />
          <span className="mbp-title">Morning Briefing</span>
        </div>
        <div className="mbp-live-dot">
          <div className={`live-indicator ${live ? 'active' : ''}`} />
          <span>{live ? 'LIVE' : '—'}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="mbp-kpi-row">
        {/* Active Sessions */}
        <div className="mbp-kpi-card">
          <div className="mbp-kpi-icon mbp-sessions-icon">
            <Radio size={18} />
          </div>
          <div className="mbp-kpi-body">
            <div className="mbp-kpi-value">
              {activeSessions}
              <span className="mbp-kpi-total">/{totalSessions}</span>
            </div>
            <div className="mbp-kpi-label">Sessions Actives</div>
          </div>
          <div className={`mbp-live-badge ${activeSessions > 0 ? 'active' : ''}`}>
            {activeSessions > 0 ? 'live' : 'idle'}
          </div>
        </div>

        {/* Pending Proposals */}
        <div className="mbp-kpi-card">
          <div className="mbp-kpi-icon mbp-proposals-icon">
            <Lightbulb size={18} />
          </div>
          <div className="mbp-kpi-body">
            <div className="mbp-kpi-value">
              {proposalsLoading ? <Loader2 size={16} className="spin" /> : pendingProposals}
            </div>
            <div className="mbp-kpi-label">Propostes Pendents</div>
            {!proposalsLoading && pendingProposals > 0 && (
              <div className="mbp-priority-row">
                {alta > 0 && (
                  <span className="mbp-priority-chip" style={{ '--pcolor': PRIORITY_COLORS.alta }}>
                    <AlertTriangle size={9} />{alta}
                  </span>
                )}
                {mitjana > 0 && (
                  <span className="mbp-priority-chip" style={{ '--pcolor': PRIORITY_COLORS.mitjana }}>
                    {mitjana}
                  </span>
                )}
                {baixa > 0 && (
                  <span className="mbp-priority-chip" style={{ '--pcolor': PRIORITY_COLORS.baixa }}>
                    {baixa}
                  </span>
                )}
              </div>
            )}
            {proposalsLoading && <div className="mbp-kpi-loading"><Loader2 size={10} className="spin" /></div>}
          </div>
        </div>

        {/* Tasks review/delivered today */}
        <div className="mbp-kpi-card">
          <div className="mbp-kpi-icon mbp-tasks-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="mbp-kpi-body">
            <div className="mbp-kpi-value">
              {tasksLoading ? <Loader2 size={16} className="spin" /> : (
                <span>
                  <span className="mbp-task-count">{reviewToday}</span>
                  <span className="mbp-task-sep">/</span>
                  <span className="mbp-task-count mbp-delivered">{deliveredToday}</span>
                </span>
              )}
            </div>
            <div className="mbp-kpi-label">Review / Avui</div>
          </div>
          {!tasksLoading && (reviewToday + deliveredToday) === 0 && (
            <div className="mbp-kpi-sublabel">res today</div>
          )}
        </div>

        {/* Daily Brief */}
        <div className="mbp-kpi-card mbp-brief-card">
          <div className="mbp-kpi-icon mbp-brief-icon">
            <FileText size={18} />
          </div>
          <div className="mbp-kpi-body mbp-brief-body">
            {dailyBrief ? (
              <>
                <div className="mbp-kpi-value mbp-brief-title">{dailyBrief.headlines?.[0]?.slice(0, 40) || 'Daily Brief'}...</div>
                <div className="mbp-kpi-label mbp-brief-date">{dailyBrief.timestamp || dailyBrief.date}</div>
              </>
            ) : (
              <>
                <div className="mbp-kpi-value mbp-brief-title">—</div>
                <div className="mbp-kpi-label">Daily Brief</div>
              </>
            )}
          </div>
          <a
            className="mbp-brief-link"
            href="/module/brief"
            target="_blank"
            rel="noopener noreferrer"
            title="Obrir Daily Brief"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Priority legend if proposals pending */}
      {!proposalsLoading && pendingProposals > 0 && (
        <div className="mbp-footer">
          <span className="mbp-footer-label">Prioritats:</span>
          {alta > 0 && <span className="mbp-footer-chip" style={{ '--pcolor': PRIORITY_COLORS.alta }}>Alta {alta}</span>}
          {mitjana > 0 && <span className="mbp-footer-chip" style={{ '--pcolor': PRIORITY_COLORS.mitjana }}>Mitjana {mitjana}</span>}
          {baixa > 0 && <span className="mbp-footer-chip" style={{ '--pcolor': PRIORITY_COLORS.baixa }}>Baixa {baixa}</span>}
        </div>
      )}
    </div>
  )
}
