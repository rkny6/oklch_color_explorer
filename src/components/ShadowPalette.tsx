import { useState, useRef, useEffect } from 'react'
import { PathPoint, getShadowPalette, oklchToHex } from '../utils/color'
import styles from './ShadowPalette.module.css'

interface ShadowPaletteProps {
  path: PathPoint[]
}

const SHADOW_LABELS = ['Base', 'Light Shadow', 'Mid Shadow', 'Deep Shadow', 'Accent Shadow']

export function ShadowPalette({ path }: ShadowPaletteProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const palette = getShadowPalette(path)
  const colors = palette ? [
    palette.base,
    palette.lightShadow,
    palette.midShadow,
    palette.deepShadow,
    palette.accentShadow
  ] : []

  const copyToClipboard = async (hex: string, index: number) => {
    await navigator.clipboard.writeText(hex)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const copyAllColors = async () => {
    const hexValues = colors.map(c => oklchToHex(c)).join('\n')
    await navigator.clipboard.writeText(hexValues)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  // Render sphere preview
  useEffect(() => {
    if (!palette || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 160
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 10

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Create radial gradient for sphere
    const baseHex = oklchToHex(palette.base)
    const lightShadowHex = oklchToHex(palette.lightShadow)
    const midShadowHex = oklchToHex(palette.midShadow)
    const deepShadowHex = oklchToHex(palette.deepShadow)
    const accentHex = oklchToHex(palette.accentShadow)

    // Main sphere gradient (light comes from top-left)
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, 
      centerY - radius * 0.3, 
      0,
      centerX + radius * 0.1, 
      centerY + radius * 0.1, 
      radius * 1.2
    )
    
    // Highlight (slightly brighter base)
    gradient.addColorStop(0, baseHex)
    gradient.addColorStop(0.25, baseHex)
    gradient.addColorStop(0.45, lightShadowHex)
    gradient.addColorStop(0.65, midShadowHex)
    gradient.addColorStop(0.82, deepShadowHex)
    gradient.addColorStop(1, accentHex)

    // Draw sphere
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Add subtle rim light on the opposite side
    const rimGradient = ctx.createRadialGradient(
      centerX + radius * 0.6,
      centerY + radius * 0.5,
      0,
      centerX + radius * 0.6,
      centerY + radius * 0.5,
      radius * 0.5
    )
    rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
    rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = rimGradient
    ctx.fill()

    // Cast shadow below sphere
    const shadowGradient = ctx.createRadialGradient(
      centerX + 5,
      centerY + radius + 8,
      0,
      centerX + 5,
      centerY + radius + 8,
      radius * 0.8
    )
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)')
    shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)')
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.beginPath()
    ctx.ellipse(centerX + 5, centerY + radius + 8, radius * 0.7, radius * 0.15, 0, 0, Math.PI * 2)
    ctx.fillStyle = shadowGradient
    ctx.fill()

  }, [palette])

  if (path.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Shadow Palette</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </div>
          <p className={styles.emptyText}>
            Select a base color to generate shadow palette
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Shadow Palette</h3>
      </div>

      {/* Sphere Preview */}
      <div className={styles.previewSection}>
        <label className={styles.sectionLabel}>Preview</label>
        <div className={styles.sphereContainer}>
          <canvas 
            ref={canvasRef}
            width={160}
            height={160}
            className={styles.sphereCanvas}
          />
        </div>
      </div>

      {/* Gradient bands */}
      <div className={styles.bandsSection}>
        <label className={styles.sectionLabel}>Gradient Bands</label>
        <div className={styles.bands}>
          {colors.map((color, index) => (
            <div 
              key={index}
              className={styles.band}
              style={{ background: oklchToHex(color) }}
            />
          ))}
        </div>
      </div>

      {/* Color swatches */}
      <div className={styles.swatchesSection}>
        <div className={styles.swatchesHeader}>
          <label className={styles.sectionLabel}>Colors</label>
          <button 
            className={styles.copyAll}
            onClick={copyAllColors}
          >
            {copiedIndex === -1 ? 'Copied!' : 'Copy all'}
          </button>
        </div>
        <div className={styles.swatches}>
          {colors.map((color, index) => {
            const hex = oklchToHex(color)
            return (
              <button 
                key={index}
                className={styles.swatch}
                onClick={() => copyToClipboard(hex, index)}
              >
                <div 
                  className={styles.swatchColor}
                  style={{ background: hex }}
                />
                <div className={styles.swatchInfo}>
                  <span className={styles.swatchLabel}>{SHADOW_LABELS[index]}</span>
                  <span className={styles.swatchHex}>
                    {copiedIndex === index ? 'Copied!' : hex}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
