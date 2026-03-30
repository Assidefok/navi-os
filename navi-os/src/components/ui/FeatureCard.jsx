import './FeatureCard.css'

export default function FeatureCard({ icon: Icon, title, description, onClick, colorClass = '' }) {
  return (
    <div className={`feature-card ${colorClass}`} onClick={onClick}>
      {Icon && (
        <div className={`feature-icon ${colorClass}`}>
          <Icon size={32} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
