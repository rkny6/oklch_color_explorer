import { useState } from 'react'
import { OklchColor, oklchToHex } from '../utils/color'
import styles from './UseCasePreview.module.css'

interface UseCasePreviewProps {
  baseColor: OklchColor | null
  variations: OklchColor[]
}

type UseCase = 'hair' | 'fabric' | 'skin'

export function UseCasePreview({ baseColor, variations }: UseCasePreviewProps) {
  const [useCase, setUseCase] = useState<UseCase>('hair')

  if (!baseColor || variations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Use-Case Preview</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <p className={styles.emptyText}>
            Set a base color to preview use cases
          </p>
        </div>
      </div>
    )
  }

  const allColors = [baseColor, ...variations]
  const colorHexes = allColors.map(c => oklchToHex(c))

  const renderHairStrand = () => {
    return (
      <svg viewBox="0 0 300 400" className={styles.canvas}>
        <defs>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            {colorHexes.map((hex, i) => (
              <stop
                key={i}
                offset={`${(i / (colorHexes.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </linearGradient>
        </defs>
        
        {/* Hair strands - each strand uses a random color from the palette */}
        {[0, 1, 2, 3, 4].map((strandIdx) => {
          const baseX = 80 + strandIdx * 40
          const colorIdx = strandIdx % colorHexes.length
          const randomWave = Math.sin(strandIdx * 0.5) * 15
          
          return (
            <g key={strandIdx}>
              <path
                d={`M ${baseX + randomWave} 20 Q ${baseX + 10 + randomWave} 100, ${baseX + 5 + randomWave} 200 Q ${baseX - 5 + randomWave} 300, ${baseX + randomWave} 380`}
                stroke={colorHexes[colorIdx]}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
              />
              {/* Highlight on strand */}
              <path
                d={`M ${baseX + randomWave + 3} 20 Q ${baseX + 10 + randomWave} 100, ${baseX + 5 + randomWave} 200 Q ${baseX - 5 + randomWave} 300, ${baseX + randomWave} 380`}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              />
            </g>
          )
        })}
      </svg>
    )
  }

  const renderFabricFolds = () => {
    return (
      <svg viewBox="0 0 300 300" className={styles.canvas}>
        {/* Fabric with folds using color variations */}
        <defs>
          <linearGradient id="fabricGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            {colorHexes.map((hex, i) => (
              <stop
                key={i}
                offset={`${(i / (colorHexes.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </linearGradient>
          <linearGradient id="fabricGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            {colorHexes.reverse().map((hex, i) => (
              <stop
                key={i}
                offset={`${(i / (colorHexes.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </linearGradient>
        </defs>

        {/* Main fabric area */}
        <rect x="30" y="30" width="240" height="240" fill="url(#fabricGrad1)" rx="8" />
        
        {/* Fold shadows */}
        <path
          d="M 150 30 Q 140 100, 150 170 L 150 270"
          stroke={colorHexes[colorHexes.length - 1]}
          strokeWidth="20"
          fill="none"
          opacity="0.6"
        />
        
        {/* Fold highlights */}
        <path
          d="M 150 30 Q 160 100, 150 170 L 150 270"
          stroke={colorHexes[0]}
          strokeWidth="8"
          fill="none"
          opacity="0.4"
        />
        
        {/* Side folds */}
        {[70, 230].map((x, idx) => (
          <g key={idx}>
            <path
              d={`M ${x} 50 Q ${x + (idx === 0 ? -20 : 20)} 150, ${x} 250`}
              stroke={colorHexes[idx % colorHexes.length]}
              strokeWidth="15"
              fill="none"
              opacity="0.5"
            />
          </g>
        ))}
      </svg>
    )
  }

  const renderSkinTransition = () => {
    return (
      <svg viewBox="0 0 300 300" className={styles.canvas}>
        {/* Skin tone with subtle transitions */}
        <defs>
          <radialGradient id="skinGrad1" cx="30%" cy="30%">
            {colorHexes.map((hex, i) => (
              <stop
                key={i}
                offset={`${(i / (colorHexes.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </radialGradient>
        </defs>

        {/* Base circle */}
        <circle cx="150" cy="150" r="120" fill="url(#skinGrad1)" />
        
        {/* Subtle shading variations */}
        {colorHexes.map((hex, i) => {
          const angle = (i / colorHexes.length) * Math.PI * 2
          const x = 150 + Math.cos(angle) * 100
          const y = 150 + Math.sin(angle) * 100
          
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="30"
              fill={hex}
              opacity="0.1"
            />
          )
        })}
        
        {/* Highlight */}
        <ellipse
          cx="120"
          cy="120"
          rx="40"
          ry="60"
          fill="rgba(255, 255, 255, 0.15)"
        />
      </svg>
    )
  }

  const useCases: Record<UseCase, { label: string; render: () => React.ReactNode }> = {
    hair: {
      label: '💇 Hair',
      render: renderHairStrand
    },
    fabric: {
      label: '👗 Fabric',
      render: renderFabricFolds
    },
    skin: {
      label: '🎨 Skin Tone',
      render: renderSkinTransition
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Use-Case Preview</h3>
        <p className={styles.subtitle}>See how subtle colors work together</p>
      </div>

      {/* Use case selector */}
      <div className={styles.selector}>
        {(Object.entries(useCases) as [UseCase, any][]).map(([key, config]) => (
          <button
            key={key}
            className={`${styles.selectorButton} ${useCase === key ? styles.active : ''}`}
            onClick={() => setUseCase(key)}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className={styles.canvasContainer}>
        {useCases[useCase].render()}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.colorPalette}>
          <span className={styles.paletteLabel}>Colors in use:</span>
          <div className={styles.paletteSwatch}>
            {colorHexes.map((hex, i) => (
              <div
                key={i}
                className={styles.swatch}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      </div>

      <p className={styles.description}>
        These subtle colors create depth and interest without being obvious. Perfect for illustration, UI elements, and design details.
      </p>
    </div>
  )
}
