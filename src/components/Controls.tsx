import { ColorConstraints } from '../utils/color'
import styles from './Controls.module.css'

interface ControlsProps {
  constraints: ColorConstraints
  onConstraintsChange: (constraints: ColorConstraints) => void
  onUndo: () => void
  onClear: () => void
  pathLength: number
}

export function Controls({
  constraints,
  onConstraintsChange,
  onUndo,
  onClear,
  pathLength
}: ControlsProps) {
  const toggleConstraint = (key: keyof ColorConstraints) => {
    const newConstraints = { ...constraints }
    
    // If enabling cool/warm, disable the other
    if (key === 'coolOnly' && !constraints.coolOnly) {
      newConstraints.warmOnly = false
    } else if (key === 'warmOnly' && !constraints.warmOnly) {
      newConstraints.coolOnly = false
    }
    
    newConstraints[key] = !constraints[key]
    onConstraintsChange(newConstraints)
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.label}>Constraints</label>
        <div className={styles.toggles}>
          <button
            className={`${styles.toggle} ${constraints.lowChroma ? styles.active : ''}`}
            onClick={() => toggleConstraint('lowChroma')}
          >
            <span className={styles.toggleIcon}>◐</span>
            Low Chroma
          </button>
          <button
            className={`${styles.toggle} ${constraints.coolOnly ? styles.active : ''}`}
            onClick={() => toggleConstraint('coolOnly')}
          >
            <span className={styles.toggleIcon}>❄</span>
            Cool Only
          </button>
          <button
            className={`${styles.toggle} ${constraints.warmOnly ? styles.active : ''}`}
            onClick={() => toggleConstraint('warmOnly')}
          >
            <span className={styles.toggleIcon}>☀</span>
            Warm Only
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.label}>Path Actions</label>
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={onUndo}
            disabled={pathLength === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h10a5 5 0 0 1 5 5v2"/>
              <path d="M3 10l4-4"/>
              <path d="M3 10l4 4"/>
            </svg>
            Undo
          </button>
          <button 
            className={`${styles.actionButton} ${styles.clearButton}`}
            onClick={onClear}
            disabled={pathLength === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18"/>
              <path d="M6 6l12 12"/>
            </svg>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
