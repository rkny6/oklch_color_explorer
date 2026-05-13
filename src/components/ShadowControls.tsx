import { ShadowInfluencePreset, SHADOW_INFLUENCE_PRESETS } from '../utils/color'
import styles from './ShadowControls.module.css'

interface ShadowControlsProps {
  enabled: boolean
  onToggleEnabled: (enabled: boolean) => void
  preset: ShadowInfluencePreset
  onPresetChange: (preset: ShadowInfluencePreset) => void
  strength: number
  onStrengthChange: (value: number) => void
  environmentColor: string
  lightColor: string
  onEnvironmentColorChange: (hex: string) => void
  onLightColorChange: (hex: string) => void
}

const presetOrder: ShadowInfluencePreset[] = ['subtle', 'natural', 'strongEnvironment', 'stylized']

export function ShadowControls({
  enabled,
  onToggleEnabled,
  preset,
  onPresetChange,
  strength,
  onStrengthChange,
  environmentColor,
  lightColor,
  onEnvironmentColorChange,
  onLightColorChange
}: ShadowControlsProps) {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <label className={styles.label}>Shadow Influence</label>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>
        <p className={styles.hint}>
          Guide your raw path toward physically plausible shadow behavior.
        </p>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.label}>Environment Color</label>
        <div className={styles.colorInputs}>
          <input
            type="color"
            value={environmentColor}
            onChange={(e) => onEnvironmentColorChange(e.target.value)}
            className={styles.colorPicker}
          />
          <span className={styles.colorHex}>{environmentColor}</span>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Light Color</label>
        <div className={styles.colorInputs}>
          <input
            type="color"
            value={lightColor}
            onChange={(e) => onLightColorChange(e.target.value)}
            className={styles.colorPicker}
          />
          <span className={styles.colorHex}>{lightColor}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.label}>Influence</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={strength}
          onChange={(e) => onStrengthChange(parseFloat(e.target.value))}
          className={styles.rangeSlider}
        />
        <div className={styles.sliderLabels}>
          <span>Subtle</span>
          <span>{strength.toFixed(2)}</span>
          <span>Bold</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.label}>Presets</label>
        <div className={styles.presets}>
          {presetOrder.map((p) => {
            const config = SHADOW_INFLUENCE_PRESETS[p]
            return (
              <button
                key={p}
                className={`${styles.preset} ${preset === p ? styles.active : ''}`}
                onClick={() => onPresetChange(p)}
              >
                <span className={styles.presetName}>{config.name}</span>
                <span className={styles.presetDesc}>{config.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <label className={styles.label}>How It Works</label>
        <ul className={styles.infoList}>
          <li>Path colors move toward the environment hue over time</li>
          <li>Lightness drops faster at the start, then eases out</li>
          <li>Chroma is tempered unless the environment is saturated</li>
        </ul>
      </div>
    </div>
  )
}
