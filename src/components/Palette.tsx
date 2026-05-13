import { useState } from 'react'
import { PathPoint, OklchColor, oklchToHex, samplePath } from '../utils/color'
import styles from './Palette.module.css'

interface PaletteProps {
  path: PathPoint[]
}

export function Palette({ path }: PaletteProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Generate 7 colors from the path
  const paletteColors = samplePath(path, 7)

  const copyToClipboard = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const copyAllColors = async () => {
    const hexValues = paletteColors.map(c => oklchToHex(c)).join('\n')
    await navigator.clipboard.writeText(hexValues)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  if (path.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Palette</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </div>
          <p className={styles.emptyText}>
            Click on the color field to add points and create a palette
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Palette</h3>
        <span className={styles.count}>{path.length} point{path.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Gradient preview */}
      {path.length >= 2 && (
        <div className={styles.gradientSection}>
          <label className={styles.sectionLabel}>Gradient</label>
          <div 
            className={styles.gradient}
            style={{
              background: `linear-gradient(to right, ${paletteColors.map(c => oklchToHex(c)).join(', ')})`
            }}
          />
        </div>
      )}

      {/* Color swatches */}
      <div className={styles.swatchesSection}>
        <div className={styles.swatchesHeader}>
          <label className={styles.sectionLabel}>Colors</label>
          {paletteColors.length > 1 && (
            <button 
              className={styles.copyAll}
              onClick={copyAllColors}
            >
              {copiedIndex === -1 ? 'Copied!' : 'Copy all'}
            </button>
          )}
        </div>
        <div className={styles.swatches}>
          {paletteColors.map((color, index) => (
            <Swatch 
              key={index}
              color={color}
              index={index}
              copied={copiedIndex === index}
              onCopy={() => copyToClipboard(oklchToHex(color), index)}
            />
          ))}
        </div>
      </div>

      {/* Path points */}
      <div className={styles.pointsSection}>
        <label className={styles.sectionLabel}>Path Points</label>
        <div className={styles.points}>
          {path.map((point, index) => (
            <div key={point.id} className={styles.point}>
              <div 
                className={styles.pointSwatch}
                style={{ background: oklchToHex(point.color) }}
              />
              <span className={styles.pointIndex}>{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SwatchProps {
  color: OklchColor
  index: number
  copied: boolean
  onCopy: () => void
}

function Swatch({ color, copied, onCopy }: SwatchProps) {
  const hex = oklchToHex(color)
  
  return (
    <button 
      className={styles.swatch}
      onClick={onCopy}
      title="Click to copy"
    >
      <div 
        className={styles.swatchColor}
        style={{ background: hex }}
      />
      <div className={styles.swatchInfo}>
        <span className={styles.swatchHex}>
          {copied ? '✓ Copied' : hex}
        </span>
        <span className={styles.swatchOklch}>
          {color.l.toFixed(2)} · {color.c.toFixed(2)} · {color.h.toFixed(0)}°
        </span>
      </div>
    </button>
  )
}
