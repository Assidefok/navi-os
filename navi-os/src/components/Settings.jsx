import { X } from 'lucide-react'
import './Settings.css'

export default function Settings({ onClose }) {
  return (
    <div
      className="settings-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configuracio"
    >
      <div
        className="settings-modal"
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
        <div className="settings-body">
          {/* Placeholder - to be implemented */}
          <p className="settings-placeholder">Aviat mes...</p>
        </div>
      </div>
    </div>
  )
}