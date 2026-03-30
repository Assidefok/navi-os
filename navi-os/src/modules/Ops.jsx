import { Settings, Zap, Link, FolderSync, Shield, Database, Activity } from 'lucide-react'
import MissionControl from './MissionControl'
import OrgChart from './OrgChart'
import FeatureCard from '../components/ui/FeatureCard'
import './Ops.css'

const FEATURES = [
  { icon: Activity, name: 'Status', desc: 'Estat del sistema' },
  { icon: Zap, name: 'Automation', desc: 'Automatitzacions' },
  { icon: Link, name: 'Integrations', desc: 'Connexions externes' },
  { icon: FolderSync, name: 'Files', desc: 'Gestio d\'arxius' },
  { icon: Database, name: 'Sync', desc: 'Sincronitzacio' },
  { icon: Shield, name: 'Security', desc: 'Seguretat' }
]

export default function Ops() {
  return (
    <div className="module-view ops">
      <h1 className="dashboard-title amber neon-amber">Operacions</h1>
      
      <MissionControl />

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <FeatureCard
            key={i}
            icon={f.icon}
            title={f.name}
            description={f.desc}
            colorClass="amber"
          />
        ))}
      </div>

      <OrgChart />
    </div>
  )
}
