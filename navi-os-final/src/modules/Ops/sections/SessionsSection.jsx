// SessionsModule - extracted from Ops.jsx
import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import {
  OpsShell, KpiCard, SessionDetailPanel,
  formatDate, formatRuntime, getSessionBucket,
} from '../shared'

export default function SessionsModule() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [groupBy, setGroupBy] = useState('smart')
  const [selectedSession, setSelectedSession] = useState(null)
  const [expandedLanes, setExpandedLanes] = useState({})

  const loadSessions = () => {
    setLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(d => setSessions(d.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const active = sessions.filter(s => s.presenceActive || s.status === 'running' || s.status === 'active').length
  const mainCount = sessions.filter(s => s.type === 'main').length
  const subagents = sessions.filter(s => s.type === 'subagent').length
  const cronCount = sessions.filter(s => s.type === 'cron').length
  const statuses = Array.from(new Set(sessions.map(s => s.status || 'unknown')))
  const channels = Array.from(new Set(sessions.map(s => s.channel || '—')))

  const filtered = sessions.filter(session => {
    if (typeFilter !== 'all' && (session.type || 'main') !== typeFilter) return false
    if (statusFilter !== 'all' && (session.status || 'unknown') !== statusFilter) return false
    if (channelFilter !== 'all' && (session.channel || '—') !== channelFilter) return false
    return true
  })

  const toggleLane = (key) => {
    setExpandedLanes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const smartBuckets = filtered.reduce((acc, session) => {
    const bucket = getSessionBucket(session)
    if (!acc[bucket.bucketKey]) {
      acc[bucket.bucketKey] = {
        key: bucket.bucketKey,
        label: bucket.bucketLabel,
        lanes: {},
      }
    }
    if (!acc[bucket.bucketKey].lanes[bucket.laneKey]) {
      acc[bucket.bucketKey].lanes[bucket.laneKey] = {
        key: bucket.laneKey,
        label: bucket.laneLabel,
        sessions: [],
      }
    }
    acc[bucket.bucketKey].lanes[bucket.laneKey].sessions.push(session)
    return acc
  }, {})

  const bucketOrder = ['telegram', 'webchat', 'subagent', 'cron', 'system', 'other']
  const orderedBuckets = Object.values(smartBuckets)
    .map(bucket => ({
      ...bucket,
      lanes: Object.values(bucket.lanes)
        .map(lane => {
          const laneSessions = [...lane.sessions].sort((a, b) => {
            const aTime = new Date(a.lastActivityAt || a.startedAt || 0).getTime()
            const bTime = new Date(b.lastActivityAt || b.startedAt || 0).getTime()
            return bTime - aTime
          })
          const latest = laneSessions[0]
          const activeCount = laneSessions.filter(s => s.presenceActive || s.live || s.status === 'running' || s.status === 'active').length
          return {
            ...lane,
            sessions: laneSessions,
            latest,
            activeCount,
          }
        })
        .sort((a, b) => {
          if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount
          const aTime = new Date(a.latest?.lastActivityAt || a.latest?.startedAt || 0).getTime()
          const bTime = new Date(b.latest?.lastActivityAt || b.latest?.startedAt || 0).getTime()
          return bTime - aTime
        }),
    }))
    .sort((a, b) => {
      const ai = bucketOrder.indexOf(a.key)
      const bi = bucketOrder.indexOf(b.key)
      if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      return a.label.localeCompare(b.label)
    })

  const simpleGroups = filtered.reduce((acc, session) => {
    const key = groupBy === 'type'
      ? (session.type || 'main')
      : groupBy === 'status'
        ? (session.status || 'unknown')
        : groupBy === 'channel'
          ? (session.channel || '—')
          : 'Totes les sessions'
    if (!acc[key]) acc[key] = []
    acc[key].push(session)
    return acc
  }, {})

  return (
    <OpsShell title="Sessions" icon={MessageSquare} onRefresh={loadSessions}>
      <div className="ops-kpi-grid">
        <KpiCard label="Totals" value={sessions.length} tone="amber" />
        <KpiCard label="Actives" value={active} tone="green" />
        <KpiCard label="Subagents" value={subagents} tone="sky" />
        <KpiCard label="Cron" value={cronCount} tone="violet" />
      </div>

      <div className="ops-filter-tabs">
        {[
          ['all', 'Totes'],
          ['main', 'Main'],
          ['subagent', 'Subagents'],
          ['cron', 'Cron'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`ops-filter-tab ${typeFilter === id ? 'active' : ''}`}
            onClick={() => setTypeFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ops-session-controls">
        <label>
          <span>Estat</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Tots</option>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          <span>Canal</span>
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
            <option value="all">Tots</option>
            {channels.map(channel => <option key={channel} value={channel}>{channel}</option>)}
          </select>
        </label>
        <label>
          <span>Agrupar per</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            <option value="smart">Intel·ligent</option>
            <option value="type">Tipus</option>
            <option value="status">Estat</option>
            <option value="channel">Canal</option>
            <option value="none">Sense agrupacio</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="ops-empty-state">Carregant sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-state">No hi ha sessions per mostrar</div>
      ) : groupBy === 'smart' ? (
        <div className="ops-grouped-sections">
          {orderedBuckets.map(bucket => (
            <section key={bucket.key} className="ops-session-group">
              <div className="ops-group-title">{bucket.label} · {bucket.lanes.length}</div>
              <div className="ops-session-clusters">
                {bucket.lanes.map(lane => {
                  const isExpanded = !!expandedLanes[lane.key]
                  return (
                    <div key={lane.key} className="ops-session-cluster-card">
                      <button className="ops-session-cluster-header" onClick={() => toggleLane(lane.key)}>
                        <div>
                          <div className="ops-list-title">{lane.label}</div>
                          <div className="ops-list-subtitle">
                            {lane.activeCount} actives · {lane.sessions.length} sessions · ultima {formatDate(lane.latest?.lastActivityAt || lane.latest?.startedAt)}
                          </div>
                        </div>
                        <div className="ops-session-cluster-right">
                          <span className={`ops-status-pill ${lane.activeCount > 0 ? 'active' : 'done'}`}>{lane.activeCount > 0 ? 'active' : 'history'}</span>
                          <span className="ops-cluster-toggle">{isExpanded ? '−' : '+'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="ops-session-cluster-body">
                          {lane.sessions.map(session => (
                            <button key={session.id} className="ops-list-card ops-session-card compact" onClick={() => setSelectedSession(session)}>
                              <div className="ops-list-top">
                                <div>
                                  <div className="ops-list-title compact">{session.label || session.id}</div>
                                  <div className="ops-list-subtitle">{session.channel || 'sense canal'} · {session.model || 'sense model'}</div>
                                </div>
                                <span className={`ops-status-pill ${session.live ? 'active' : session.status || 'unknown'}`}>{session.live ? 'live' : session.status || 'unknown'}</span>
                              </div>
                              <div className="ops-meta-grid compact">
                                <div><span>Tipus</span><strong>{session.type || 'main'}</strong></div>
                                <div><span>Activitat</span><strong>{formatDate(session.lastActivityAt || session.startedAt)}</strong></div>
                                <div><span>Tokens</span><strong>{(session.totalTokens || 0).toLocaleString()}</strong></div>
                                <div><span>Runtime</span><strong>{formatRuntime(session.runtimeMs)}</strong></div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="ops-grouped-sections">
          {Object.entries(simpleGroups).map(([group, groupSessions]) => (
            <section key={group} className="ops-session-group">
              {groupBy !== 'none' && <div className="ops-group-title">{group} · {groupSessions.length}</div>}
              <div className="ops-list-stack">
                {groupSessions.map(session => (
                  <button key={session.id} className="ops-list-card ops-session-card" onClick={() => setSelectedSession(session)}>
                    <div className="ops-list-top">
                      <div>
                        <div className="ops-list-title">{session.label || session.id}</div>
                        <div className="ops-list-subtitle">{session.channel || 'sense canal'} · {session.model || 'sense model'}</div>
                      </div>
                      <span className={`ops-status-pill ${session.live ? 'active' : session.status || 'unknown'}`}>{session.live ? 'live' : session.status || 'unknown'}</span>
                    </div>
                    <div className="ops-meta-grid compact">
                      <div><span>Tipus</span><strong>{session.type || 'main'}</strong></div>
                      <div><span>Inici</span><strong>{formatDate(session.startedAt)}</strong></div>
                      <div><span>Tokens</span><strong>{(session.totalTokens || 0).toLocaleString()}</strong></div>
                      <div><span>Runtime</span><strong>{formatRuntime(session.runtimeMs)}</strong></div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="ops-module-footer-note">Main: {mainCount} · Sessions vives: {active}</div>

      {selectedSession && <SessionDetailPanel session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </OpsShell>
  )
}
