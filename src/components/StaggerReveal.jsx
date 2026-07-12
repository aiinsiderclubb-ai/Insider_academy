import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './StaggerReveal.module.css'

/**
 * Fade-up children with 60ms stagger when the grid enters the viewport (once).
 */
export function StaggerReveal({
  children,
  className = '',
  stagger = 60,
  as: Tag = 'div',
}) {
  const { ref, visible } = useScrollReveal()

  return (
    <Tag
      ref={ref}
      className={`${styles.stagger} ${visible ? styles.visible : ''} ${className}`}
      style={{ '--stagger-step': `${stagger}ms` }}
    >
      {children}
    </Tag>
  )
}
