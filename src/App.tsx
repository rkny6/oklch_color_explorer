import { useState, useCallback, useEffect, useMemo } from 'react'
import { ColorField } from './components/ColorField'
import { Controls } from './components/Controls'
import { Palette } from './components/Palette'
import { ShadowControls } from './components/ShadowControls'
import { ShadowPalette } from './components/ShadowPalette'
import { HiddenColorControls } from './components/HiddenColorControls'
import { ShadowPreview } from './components/ShadowPreview'
import { ColorComparison } from './components/ColorComparison'
import { InfoModal } from './components/InfoModal'
import { 
  PathPoint, 
  ColorConstraints, 
  OklchColor,
  HiddenColorStyle,
  ShadowInfluencePreset,
  applyShadowInfluenceToPath,
  generateShadowBasePath,
  samplePath,
  hexToOklch,
  generateHiddenColorPalette
} from './utils/color'
import styles from './App.module.css'


type AppMode = 'explorer' | 'shadow' | 'hidden-color'

function App() {
  const [mode, setMode] = useState<AppMode>('explorer')
  const [lightness, setLightness] = useState(0.65)
  const [path, setPath] = useState<PathPoint[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [constraints, setConstraints] = useState<ColorConstraints>({
    lowChroma: false,
    coolOnly: false,
    warmOnly: false
  })

  // Shadow generator state
  const [baseColor, setBaseColor] = useState<OklchColor | null>(null)
  const [shadowEnabled, setShadowEnabled] = useState(true)
  const [shadowPreset, setShadowPreset] = useState<ShadowInfluencePreset>('natural')
  const [shadowStrength, setShadowStrength] = useState(0.9)
  const [environmentColorHex, setEnvironmentColorHex] = useState('#4a90e2')
  const [lightColorHex, setLightColorHex] = useState('#f9d56e')

  // Hidden color generator state
  const [hiddenColorStyle, setHiddenColorStyle] = useState<HiddenColorStyle>('neutralGray')
  const [lockLightness, setLockLightness] = useState(true)
  const [variationStrength, setVariationStrength] = useState(0.5)
  const [hiddenColorCount, setHiddenColorCount] = useState(5)
  const [hiddenColorBaseColor, setHiddenColorBaseColor] = useState<OklchColor | null>(null)
  const [hiddenColorVariations, setHiddenColorVariations] = useState<OklchColor[]>([])
  const [hiddenColorHexInput, setHiddenColorHexInput] = useState('')

  const environmentColor = useMemo(() => (
    hexToOklch(environmentColorHex) ?? { l: 0.68, c: 0.35, h: 210 }
  ), [environmentColorHex])

  const lightColor = useMemo(() => (
    hexToOklch(lightColorHex) ?? { l: 0.82, c: 0.22, h: 45 }
  ), [lightColorHex])

  const shadowBasePath = useMemo(() => {
    if (!baseColor) return []
    return generateShadowBasePath(baseColor, shadowPreset)
  }, [baseColor, shadowPreset])

  const shadowTransformedPath = useMemo(() => {
    if (!baseColor || shadowBasePath.length === 0) return []

    return applyShadowInfluenceToPath(shadowBasePath, {
      preset: shadowPreset,
      environmentColor,
      lightColor,
      strength: shadowStrength
    })
  }, [shadowBasePath, shadowPreset, environmentColor, lightColor, shadowStrength, baseColor])

  const shadowBasePreviewColors = useMemo(() => samplePath(shadowBasePath, 5), [shadowBasePath])
  const shadowTransformedPreviewColors = useMemo(
    () => samplePath(shadowTransformedPath, 5),
    [shadowTransformedPath]
  )

  // Generate hidden color variations when base color or style changes
  useEffect(() => {
    if (mode === 'hidden-color' && hiddenColorBaseColor) {
      const palette = generateHiddenColorPalette(hiddenColorBaseColor, {
        count: hiddenColorCount,
        style: hiddenColorStyle,
        strength: variationStrength,
        lockLightness,
        ensureGamut: true
      })
      setHiddenColorVariations(palette.variations)
    }
  }, [hiddenColorBaseColor, hiddenColorStyle, lockLightness, variationStrength, hiddenColorCount, mode])

  const handleAddPoint = useCallback((point: PathPoint) => {
    if (mode === 'shadow') {
      setBaseColor(point.color)
      return
    }

    if (mode === 'hidden-color') {
      setHiddenColorBaseColor(point.color)
      return
    }

    setPath(prev => [...prev, point])
  }, [mode])

  const handleUndo = useCallback(() => {
    setPath(prev => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setPath([])
    if (mode === 'hidden-color') {
      setHiddenColorBaseColor(null)
    }
    if (mode === 'shadow') {
      setBaseColor(null)
    }
  }, [mode])

  const handleDeletePoint = useCallback((id: string) => {
    setPath(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleUpdatePoint = useCallback((id: string, updates: Partial<PathPoint>) => {
    setPath(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }, [])

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode)
    setPath([])
    if (newMode === 'hidden-color') {
      setHiddenColorCount(4)
    }
    if (newMode !== 'hidden-color') {
      setHiddenColorBaseColor(null)
    }
    if (newMode !== 'shadow') {
      setBaseColor(null)
      setShadowEnabled(true)
    }
  }

  return (
    <div className={`${styles.app} ${styles[mode.replace('-', '')]}`}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Color Field Explorer</h1>
          <p className={styles.subtitle}>
            {mode === 'explorer'
              ? 'Navigate OKLCH color space · Build color paths'
              : mode === 'shadow'
                ? 'Generate shadow-aware palettes from a base color'
                : 'Generate subtle color variations · Controlled imperfection'
            }
          </p>
        </div>
        <button 
          className={styles.infoButton} 
          onClick={() => setShowInfo(true)}
          aria-label="Show help"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 8V13M9 5.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      {/* Mode Switcher */}
      <div className={styles.modeSwitcher}>
        <button 
          className={`${styles.modeButton} ${mode === 'explorer' ? styles.active : ''}`}
          onClick={() => handleModeChange('explorer')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
          </svg>
          Explorer
        </button>
        <button 
          className={`${styles.modeButton} ${mode === 'shadow' ? styles.active : ''}`}
          onClick={() => handleModeChange('shadow')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
          Shadow Generator
        </button>

          <button 
            className={`${styles.modeButton} ${mode === 'hidden-color' ? styles.active : ''}`}
            onClick={() => handleModeChange('hidden-color')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Hidden Colors
          </button>
      </div>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          {/* Universal Lightness Control */}
          <div className={styles.lightnessSection}>
            <div className={styles.sectionHeader}>
              <label className={styles.lightnessLabel}>Lightness</label>
              <span className={styles.lightnessValue}>{lightness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={lightness}
              onChange={(e) => setLightness(parseFloat(e.target.value))}
              className={styles.lightnessSlider}
            />
            <div className={styles.sliderLabels}>
              <span>Dark</span>
              <span>Light</span>
            </div>
          </div>

          <div className={styles.divider} />

          {mode === 'explorer' ? (
            <Controls
              constraints={constraints}
              onConstraintsChange={setConstraints}
              onUndo={handleUndo}
              onClear={handleClear}
              pathLength={path.length}
            />
          ) : mode === 'shadow' ? (
            <ShadowControls
              enabled={shadowEnabled}
              onToggleEnabled={setShadowEnabled}
              preset={shadowPreset}
              onPresetChange={setShadowPreset}
              strength={shadowStrength}
              onStrengthChange={setShadowStrength}
              environmentColor={environmentColorHex}
              lightColor={lightColorHex}
              onEnvironmentColorChange={setEnvironmentColorHex}
              onLightColorChange={setLightColorHex}
            />
          ) : (
            <HiddenColorControls
              style={hiddenColorStyle}
              onStyleChange={setHiddenColorStyle}
              lockLightness={lockLightness}
              onLockLightnessChange={setLockLightness}
              variationStrength={variationStrength}
              onVariationStrengthChange={setVariationStrength}
            />
          )}
        </aside>

        <section className={styles.canvas}>
          <ColorField
            lightness={lightness}
            constraints={constraints}
            path={path}
            shadowPath={mode === 'shadow' && shadowEnabled ? shadowTransformedPath : undefined}
            onAddPoint={handleAddPoint}
            onDeletePoint={handleDeletePoint}
            onUpdatePoint={handleUpdatePoint}
          />
        </section>

        <aside className={styles.palette}>
          {mode === 'explorer' ? (
            <Palette path={path} />
          ) : mode === 'shadow' ? (
            <>
              <ShadowPalette path={shadowBasePath} />
              {shadowBasePath.length > 0 && (
                <div className={styles.shadowPreviewSection}>
                  <ShadowPreview
                    originalColors={shadowBasePreviewColors}
                    shadowColors={shadowEnabled ? shadowTransformedPreviewColors : []}
                    shadowEnabled={shadowEnabled}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.hiddenColorPalette}>
                <ColorComparison 
                  baseColor={hiddenColorBaseColor}
                  variations={hiddenColorVariations}
                  variationCount={hiddenColorCount}
                  onVariationCountChange={setHiddenColorCount}
                />
              </div>
              {/* <div className={styles.useCasePreview}>
                <UseCasePreview 
                  baseColor={hiddenColorBaseColor}
                  variations={hiddenColorVariations}
                />
              </div> */}
            </>
          )}
        </aside>
      </main>

      <footer className={styles.footer}>
        {mode === 'hidden-color' ? (
          <>
            <span>Variation Style: {hiddenColorStyle}</span>
            <span>·</span>
            <span>Lightness: {lockLightness ? 'Locked' : 'Variable'}</span>
            <span>·</span>
            <span>L = {hiddenColorBaseColor ? hiddenColorBaseColor.l.toFixed(2) : '—'}</span>
          </>
        ) : (
          <>
            <span>X = Hue (0°–360°)</span>
            <span>·</span>
            <span>Y = Chroma (0–max)</span>
            <span>·</span>
            <span>L = {lightness.toFixed(2)}</span>
          </>
        )}
      </footer>

      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  )
}

export default App
