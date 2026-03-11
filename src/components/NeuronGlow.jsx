// Декоративный блок «нейроны» — точки и связи в стиле нейросети (розово-фиолетовые блики)
import styles from './NeuronGlow.module.css'

export function NeuronGlow({ className }) {
  return (
    <div className={`${styles.wrap} ${className || ''}`} aria-hidden>
      <div className={styles.grid}>
        {[...Array(9)].map((_, i) => (
          <div key={i} className={styles.node} style={{ ['--i']: i }} />
        ))}
      </div>
      <svg className={styles.lines} viewBox="0 0 200 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="neuronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--glow-pink)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--glow-purple)" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <line x1="30" y1="30" x2="90" y2="50" stroke="url(#neuronGrad)" strokeWidth="0.5" opacity="0.6" />
        <line x1="90" y1="50" x2="170" y2="40" stroke="url(#neuronGrad)" strokeWidth="0.5" opacity="0.5" />
        <line x1="50" y1="100" x2="100" y2="100" stroke="url(#neuronGrad)" strokeWidth="0.5" opacity="0.5" />
        <line x1="100" y1="100" x2="150" y2="160" stroke="url(#neuronGrad)" strokeWidth="0.5" opacity="0.5" />
        <line x1="30" y1="170" x2="100" y2="140" stroke="url(#neuronGrad)" strokeWidth="0.5" opacity="0.4" />
      </svg>
    </div>
  )
}
