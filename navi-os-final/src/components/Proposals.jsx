import { useState, useEffect } from 'react'
import { Lightbulb, Check, X, Clock } from 'lucide-react'
import './Proposals.css'

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProposals = () => {
    setLoading(true)
    fetch('/api/proposals')
      .then(r => r.json())
      .then(d => {
        setProposals(d.proposals || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    Promise.resolve().then(() => loadProposals())
  }, [])

  const updateProposal = (id, status) => {
    fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(r => r.json())
      .then(() => loadProposals())
      .catch(() => {})
  }

  const pending = proposals.filter(p => p.status === 'pending')
  const accepted = proposals.filter(p => p.status === 'accepted')
  const rejected = proposals.filter(p => p.status === 'rejected')

  if (loading) {
    return <div className="proposal-loading"><Clock size={18} /> Carregant...</div>
  }

  return (
    <div className="proposals-panel">
      <div className="proposals-header">
        <h3><Lightbulb size={16} /> Propostes de Millora</h3>
        <span className="proposals-count">{pending.length} pendents</span>
      </div>

      {proposals.length === 0 && (
        <div className="proposal-empty">
          <Lightbulb size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>No hi ha propostes. Quan et suggereixi millores, apareixeran aqui.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="proposals-list">
          {pending.map(p => (
            <div key={p.id} className="proposal-card pending">
              <div className="proposal-header">
                <span className="proposal-title">{p.title}</span>
                <span className="proposal-status pending">Pendent</span>
              </div>
              <p className="proposal-description">{p.description}</p>
              <div className="proposal-meta">
                Creat: {new Date(p.createdAt).toLocaleDateString('ca-ES')}
              </div>
              <div className="proposal-actions">
                <button className="proposal-btn accept" onClick={() => updateProposal(p.id, 'accepted')}>
                  <Check size={14} /> Acceptar
                </button>
                <button className="proposal-btn reject" onClick={() => updateProposal(p.id, 'rejected')}>
                  <X size={14} /> Rebutjar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <>
          <h4 style={{ fontFamily: 'Ubuntu', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Acceptades ({accepted.length})</h4>
          <div className="proposals-list">
            {accepted.map(p => (
              <div key={p.id} className="proposal-card accepted">
                <div className="proposal-header">
                  <span className="proposal-title">{p.title}</span>
                  <span className="proposal-status accepted">Acceptada</span>
                </div>
                <p className="proposal-description">{p.description}</p>
                <div className="proposal-meta">
                  {new Date(p.createdAt).toLocaleDateString('ca-ES')} {p.updatedAt && `· Actualitzat: ${new Date(p.updatedAt).toLocaleDateString('ca-ES')}`}
                </div>
                <div className="proposal-actions">
                  <button className="proposal-btn reject" onClick={() => updateProposal(p.id, 'rejected')}>
                    <X size={14} /> Rebutjar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {rejected.length > 0 && (
        <>
          <h4 style={{ fontFamily: 'Ubuntu', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Rebutjades ({rejected.length})</h4>
          <div className="proposals-list">
            {rejected.map(p => (
              <div key={p.id} className="proposal-card rejected">
                <div className="proposal-header">
                  <span className="proposal-title">{p.title}</span>
                  <span className="proposal-status rejected">Rebutjada</span>
                </div>
                <p className="proposal-description">{p.description}</p>
                <div className="proposal-meta">
                  {new Date(p.createdAt).toLocaleDateString('ca-ES')}
                </div>
                <div className="proposal-actions">
                  <button className="proposal-btn accept" onClick={() => updateProposal(p.id, 'accepted')}>
                    <Check size={14} /> Acceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
