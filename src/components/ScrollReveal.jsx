import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './ScrollReveal.module.css'

export function ScrollReveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const { ref, visible } = useScrollReveal()
  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.visible : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
