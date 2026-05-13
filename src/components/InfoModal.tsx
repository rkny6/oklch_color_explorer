import { useEffect, useRef } from 'react'
import styles from './InfoModal.module.css'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      ref={modalRef}
      className={styles.backdrop} 
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className={styles.content}>
          <h2 className={styles.title}>Color Field Explorer</h2>
          <p className={styles.intro}>
            A creative tool for navigating OKLCH color space and building color paths.
          </p>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What is OKLCH?</h3>
            <p className={styles.text}>
              OKLCH is a perceptually uniform color space with three dimensions: 
              <strong> Lightness</strong> (0-1), <strong>Chroma</strong> (saturation), 
              and <strong>Hue</strong> (0-360°). Unlike RGB or HSL, colors with the 
              same lightness value actually appear equally bright to human eyes.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>How to Use</h3>
            <ul className={styles.list}>
              <li>
                <span className={styles.action}>Click</span>
                <span className={styles.desc}>on the color field to add points to your path</span>
              </li>
              <li>
                <span className={styles.action}>Drag</span>
                <span className={styles.desc}>existing points to reposition them</span>
              </li>
              <li>
                <span className={styles.action}>Double-click</span>
                <span className={styles.desc}>or Shift+click a point to delete it</span>
              </li>
              <li>
                <span className={styles.action}>Lightness</span>
                <span className={styles.desc}>slider adjusts the L value across the entire field</span>
              </li>
              <li>
                <span className={styles.action}>Constraints</span>
                <span className={styles.desc}>limit colors to low chroma, cool, or warm tones</span>
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>The Palette</h3>
            <p className={styles.text}>
              As you build your path, the palette shows a gradient interpolated through 
              your selected colors, plus 7 evenly-sampled swatches. Click any swatch 
              to copy its hex code.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>The Field</h3>
            <p className={styles.text}>
              The horizontal axis represents <strong>Hue</strong> (0° to 360°), 
              while the vertical axis shows <strong>Chroma</strong> (low at top, 
              high at bottom). Gray areas indicate colors outside the displayable 
              sRGB gamut for the current lightness.
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>Press Esc or click outside to close</span>
        </div>
      </div>
    </div>
  )
}
