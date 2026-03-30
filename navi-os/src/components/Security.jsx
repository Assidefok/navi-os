import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, XCircle, Loader2, Key, Lock, Eye, Zap } from 'lucide-react'
import './Security.css'

function SecurityItem({ name, status, details, color = 'green' }) {
  return (
    <div className={`security-item ${status}`}>
      <div className={`security-item-icon ${color}`}><Icon size={16} /></div>
      <div className="security-item-body">
        <span className="security-item-name">{name}</span>
        {details && <span className="security-item-details">{details}</span>}
      </div>
      <div className={`security-item-status ${status}`}>
        {status === 'ok' && <><CheckCircle2 size={13} /> OK</>}
        {status === 'warning' && <><AlertTriangle size={13} /> Warning</>}
        {status === 'error' && <><XCircle size={13} /> Error</>}
        {status === 'unknown' && <span>—</span>}
      </div>
    </div>
  )
}

function SkillsStatus() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.ok ? r.json() : { skills: [] })
      .then(d => setSkills(d.skills || []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="security-section">
      <h3 className="section-title"><Zap size={14} /> Skills instal·lades</h3>
      <div className="security-items-list">
        {skills.length === 0 && <span className="empty-state">Cap skill trobada</span>}
        {skills.map(s => (
          <SecurityItem key={s.name} name={s.name} status="ok" details={s.source || s.type || 'skill'} color="amber" />
        ))}
      </div>
    </div>
  )
}

const DEFAULT_TOOLS = [
  { name: 'read', status: 'ok', type: 'tool' },
  { name: 'write', status: 'ok', type: 'tool' },
  { name: 'edit', status: 'ok', type: 'tool' },
  { name: 'exec', status: 'ok', type: 'tool' },
  { name: 'web_search', status: 'ok', type: 'tool' },
  { name: 'web_fetch', status: 'ok', type: 'tool' },
  { name: 'image_generate', status: 'ok', type: 'tool' },
  { name: 'sessions_yield', status: 'ok', type: 'tool' },
  { name: 'process', status: 'ok', type: 'tool' },
]

function ToolsStatus() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tools')
      .then(r => r.ok ? r.json() : { tools: DEFAULT_TOOLS })
      .then(d => setTools(d.tools || DEFAULT_TOOLS))
      .catch(() => setTools(DEFAULT_TOOLS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="security-section">
      <h3 className="section-title"><Key size={14} /> Tools disponibles</h3>
      <div className="security-items-list">
        {tools.map(t => (
          <SecurityItem key={t.name} name={t.name} status={t.status || 'ok'} details={t.type || 'tool'} color="sky" />
        ))}
      </div>
    </div>
  )
}

function GatewaySecurity() {
  const [gwStatus, setGwStatus] = useState({ auth: 'unknown', bind: 'unknown', trustedProxies: 'unknown' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gateway-security')
      .then(r => r.ok ? r.json() : { auth: 'unknown', bind: 'unknown', trustedProxies: 'unknown' })
      .then(setGwStatus)
      .catch(() => setGwStatus({ auth: 'unknown', bind: 'unknown', trustedProxies: 'unknown' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  const items = [
    { name: 'Gateway bind', status: gwStatus.bind === 'ok' ? 'ok' : 'warning', details: gwStatus.bind || 'local loopback' },
    { name: 'Auth password', status: gwStatus.auth === 'ok' ? 'ok' : 'warning', details: gwStatus.auth || 'enabled' },
    { name: 'Trusted proxies', status: gwStatus.trustedProxies === 'ok' ? 'ok' : 'warning', details: gwStatus.trustedProxies || 'not configured (local only)' },
  ]

  return (
    <div className="security-section">
      <h3 className="section-title"><Lock size={14} /> Gateway Security</h3>
      <div className="security-items-list">
        {items.map(item => (
          <SecurityItem key={item.name} name={item.name} status={item.status} details={item.details} color="amber" />
        ))}
      </div>
    </div>
  )
}

function AuditResults() {
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/security-audit')
      .then(r => r.ok ? r.json() : { critical: 0, warn: 0, info: 0, issues: [] })
      .then(setAudit)
      .catch(() => setAudit({ critical: 0, warn: 0, info: 0, issues: [] }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="status-loading"><Loader2 size={16} className="spin" /></div>

  return (
    <div className="security-section">
      <h3 className="section-title"><Eye size={14} /> Audit de seguretat</h3>
      <div className="audit-summary">
        <div className="audit-stat critical">
          <XCircle size={14} /> {audit?.critical || 0} critical
        </div>
        <div className="audit-stat warn">
          <AlertTriangle size={14} /> {audit?.warn || 0} warnings
        </div>
        <div className="audit-stat info">
          <CheckCircle2 size={14} /> {audit?.info || 0} info
        </div>
      </div>
      {audit?.issues?.length > 0 && (
        <div className="audit-issues">
          {audit.issues.map((issue, i) => (
            <div key={i} className={`audit-issue ${issue.level}`}>
              <span className="issue-level">{issue.level}</span>
              <span className="issue-text">{issue.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Security() {
  const [activeTab, setActiveTab] = useState('gateway')

  const tabs = [
    { id: 'gateway', label: 'Gateway' },
    { id: 'skills', label: 'Skills' },
    { id: 'tools', label: 'Tools' },
    { id: 'audit', label: 'Audit' },
  ]

  return (
    <div className="security-view">
      <div className="security-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`security-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="security-content">
        {activeTab === 'gateway' && <GatewaySecurity />}
        {activeTab === 'skills' && <SkillsStatus />}
        {activeTab === 'tools' && <ToolsStatus />}
        {activeTab === 'audit' && <AuditResults />}
      </div>
    </div>
  )
}
