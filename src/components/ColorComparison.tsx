import { useState } from 'react'
import { OklchColor, oklchToHex } from '../utils/color'
import styles from './ColorComparison.module.css'

interface ColorComparisonProps {
  baseColor: OklchColor | null
  variations: OklchColor[]
  exaggerateDifference?: boolean
  variationCount?: number
  onVariationCountChange?: (count: number) => void
}

export function ColorComparison({ baseColor, variations, exaggerateDifference = false, variationCount, onVariationCountChange }: ColorComparisonProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!baseColor || variations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Subtle Variations</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
          </div>
          <p className={styles.emptyText}>
            Set a base color to generate variations
          </p>
        </div>
      </div>
    )
  }

  const copyToClipboard = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const baseHex = oklchToHex(baseColor)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Subtle Variations</h3>
        <span className={styles.count}>{variations.length} colors</span>
        {variationCount && onVariationCountChange && (
        <div className={styles.countControls}>
          <button
            className={styles.countButton}
            onClick={() => onVariationCountChange(Math.max(4, variationCount - 1))}
            disabled={variationCount <= 4}
            aria-label="Decrease variation count"
          >
            −
          </button>
          <button
            className={styles.countButton}
            onClick={() => onVariationCountChange(Math.min(8, variationCount + 1))}
            disabled={variationCount >= 8}
            aria-label="Increase variation count"
          >
            +
          </button>
        </div>
      )}
      </div>

      {/* {variationCount && onVariationCountChange && (
        <div className={styles.countControls}>
          <button
            className={styles.countButton}
            onClick={() => onVariationCountChange(Math.max(5, variationCount - 1))}
            disabled={variationCount <= 5}
            aria-label="Decrease variation count"
          >
            −
          </button>
          <button
            className={styles.countButton}
            onClick={() => onVariationCountChange(Math.min(10, variationCount + 1))}
            disabled={variationCount >= 10}
            aria-label="Increase variation count"
          >
            +
          </button>
        </div>
      )} */}

      {/* Info about subtlety
      <div className={styles.info}>
        <p className={styles.infoText}>
          {exaggerateDifference 
            ? '🔍 Differences exaggerated for visibility (actual variations are more subtle)'
            : '✓ Subtle, unified feel — differences reveal on close inspection'
          }
        </p>
      </div> */}

      {/* Base color section */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Base Color</label>
        <div 
          className={styles.baseSwatch}
          onMouseEnter={() => setHoveredIndex(-1)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => copyToClipboard(baseHex, -1)}
        >
          <div 
            className={styles.baseColor}
            style={{ backgroundColor: baseHex }}
          />
          <div className={styles.colorInfo}>
            <span className={styles.hex}>{baseHex}</span>
            <span className={styles.label}>Base</span>
          </div>
          {hoveredIndex === -1 && (
            <div className={styles.copyHint}>
              {copiedIndex === -1 ? 'Copied!' : 'Click to copy'}
            </div>
          )}
        </div>
      </div>

      {/* Variations grid */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Variations</label>
        <div className={styles.grid}>
          {variations.map((color, index) => {
            const hex = oklchToHex(color)
            const isHovered = hoveredIndex === index
            
            return (
              <div
                key={index}
                className={`${styles.colorCard} ${isHovered ? styles.hovered : ''}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => copyToClipboard(hex, index)}
              >
                <div 
                  className={styles.colorSwatch}
                  style={{ 
                    backgroundColor: hex,
                    opacity: exaggerateDifference ? 1 : 1
                  }}
                />
                <div className={styles.cardInfo}>
                  <span className={styles.index}>#{index + 1}</span>
                  <span className={styles.hex}>{hex}</span>
                </div>
                {isHovered && (
                  <div className={styles.overlay}>
                    {copiedIndex === index ? (
                      <span className={styles.copied}>✓ Copied</span>
                    ) : (
                      <span className={styles.copyText}>Copy</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Palette gradient preview */}
      {variations.length >= 2 && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Gradient Preview</label>
          <div 
            className={styles.gradient}
            style={{
              background: `linear-gradient(to right, ${
                [
                  `${oklchToHex(variations[0])} 0%`,
                  ...variations.map((variation, index) => {
                    const hex = oklchToHex(variation)
                    const position =
                      (index / (variations.length - 1)) * 100
                    return `${hex} ${position}%`
                  }),
                  `${oklchToHex(variations[variations.length - 1])} 100%`
                ].join(', ')
              })`
            }}
          />
        </div>
      )}

      {/* Comparison info
      <div className={styles.comparisonTip}>
        <span className={styles.tipIcon}>💡</span>
        <p className={styles.tipText}>
          Hover and compare: These colors feel unified at first glance but reveal subtle differences when examined closely — perfect for illustration details.
        </p>
      </div> */}
    </div>
  )
}
