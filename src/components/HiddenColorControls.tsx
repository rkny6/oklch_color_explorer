import { HiddenColorStyle, HIDDEN_COLOR_STYLES } from '../utils/color'
import styles from './HiddenColorControls.module.css'

interface HiddenColorControlsProps {
  style: HiddenColorStyle
  onStyleChange: (style: HiddenColorStyle) => void
  lockLightness: boolean
  onLockLightnessChange: (locked: boolean) => void
  variationStrength: number
  onVariationStrengthChange: (value: number) => void
}

export function HiddenColorControls({
  style,
  onStyleChange,
  lockLightness,
  onLockLightnessChange,
  variationStrength,
  onVariationStrengthChange
}: HiddenColorControlsProps) {
  return (
    <div className={styles.container}>
      {/* <div className={styles.section}>
        <label className={styles.label}>Base Color</label>
        {baseColor ? (
          <div className={styles.baseColorDisplay}>
            <div 
              className={styles.colorPreview}
              style={{ background: oklchToHex(baseColor) }}
            />
            <div className={styles.colorInfo}>
              <span className={styles.hexValue}>{oklchToHex(baseColor)}</span>
              <span className={styles.oklchValue}>
                L {baseColor.l.toFixed(2)} · C {baseColor.c.toFixed(2)} · H {baseColor.h.toFixed(0)}°
              </span>
            </div>
            <button className={styles.clearButton} onClick={onClearBase}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className={styles.inputGroup}>
            <input
              type="text"
              className={styles.hexInput}
              placeholder="#FF5733"
              value={hexInput}
              onChange={(e) => onHexInputChange(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={onHexSubmit}
              className={styles.applyButton}
              disabled={!hexInput}
            >
              Apply
            </button>
          </div>
        )}
        {!baseColor && (
          <p className={styles.hint}>Enter HEX or click on the color field</p>
        )}
      </div>

      <div className={styles.divider} /> */}

      <div className={styles.section}>
        <label className={styles.label}>Variation Style</label>
        <div className={styles.presets}>
          {(Object.entries(HIDDEN_COLOR_STYLES) as [HiddenColorStyle, any][]).map(([key, config]) => (
            <button
              key={key}
              className={`${styles.preset} ${style === key ? styles.active : ''}`}
              onClick={() => onStyleChange(key)}
              title={config.description}
            >
              <span className={styles.presetName}>{config.name}</span>
              <span className={styles.presetDesc}>{config.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.sliderRow}>
          <span className={styles.label}>Variation Strength</span>
          <span className={styles.sliderValue}>{variationStrength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={variationStrength}
          onChange={(e) => onVariationStrengthChange(parseFloat(e.target.value))}
          className={styles.rangeSlider}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.toggleRow}>
          <label className={styles.label}>Lock Lightness</label>
          <button
            className={`${styles.toggle} ${lockLightness ? styles.active : ''}`}
            onClick={() => onLockLightnessChange(!lockLightness)}
            aria-pressed={lockLightness}
          >
            <span className={styles.toggleIcon}>◐</span>
            {lockLightness ? 'Locked' : 'Unlocked'}
          </button>
        </div>
        <p className={styles.toggleDescription}>
          {lockLightness 
            ? 'All colors maintain the same perceived lightness (±0.02 L)'
            : 'Lightness varies subtly across the palette'
          }
        </p>
      </div>
    </div>
  )
}
