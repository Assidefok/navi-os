import { Sparkles } from 'lucide-react'
import './TopBar.css'

export default function TopBar({ onOpenSettings }) {
  return (
    <header className="top-bar">
      <button
        className="topbar-logo"
        onClick={onOpenSettings}
        aria-label="Obrir configuracio"
        title="Configuracio"
      >
        <Sparkles size={20} strokeWidth={1.5} />
        <span className="logo-text">Navi</span>
      </button>
    </header>
  )
}