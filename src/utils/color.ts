import { oklch, formatHex, displayable } from 'culori'

export interface OklchColor {
  l: number  // 0-1
  c: number  // 0-0.4 (normalized to 0-1 for UI)
  h: number  // 0-360
}

export interface PathPoint {
  id: string
  color: OklchColor
  x: number
  y: number
}

// Max chroma for OKLCH (approximate, varies by hue/lightness)
export const MAX_CHROMA = 0.4

// Convert normalized chroma (0-1) to actual OKLCH chroma
export function denormalizeChroma(normalizedChroma: number): number {
  return normalizedChroma * MAX_CHROMA
}

// Convert actual OKLCH chroma to normalized (0-1)
export function normalizeChroma(chroma: number): number {
  return chroma / MAX_CHROMA
}

// Convert OKLCH to HEX, clamping to displayable gamut
export function oklchToHex(color: OklchColor): string {
  const oklchColor = {
    mode: 'oklch' as const,
    l: color.l,
    c: denormalizeChroma(color.c),
    h: color.h
  }
  
  // Check if displayable, if not, reduce chroma until it is
  let c = oklchColor.c
  while (c > 0 && !displayable({ ...oklchColor, c })) {
    c -= 0.01
  }
  
  const hex = formatHex({ ...oklchColor, c })
  return hex || '#000000'
}

// Get display color from coordinates
export function getColorAtPosition(
  x: number, 
  y: number, 
  lightness: number,
  width: number,
  height: number
): OklchColor {
  const hue = (x / width) * 360
  const chroma = 1 - (y / height) // Invert so high chroma is at top
  
  return {
    l: lightness,
    c: Math.max(0, Math.min(1, chroma)),
    h: hue
  }
}

// Check if a color is within displayable gamut
export function isDisplayable(color: OklchColor): boolean {
  return displayable({
    mode: 'oklch',
    l: color.l,
    c: denormalizeChroma(color.c),
    h: color.h
  })
}

// Apply constraints to color
export interface ColorConstraints {
  lowChroma: boolean
  coolOnly: boolean
  warmOnly: boolean
}

export function applyConstraints(
  color: OklchColor, 
  constraints: ColorConstraints
): OklchColor {
  let { l, c, h } = color
  
  if (constraints.lowChroma) {
    c = Math.min(c, 0.3) // Limit to 30% of max chroma
  }
  
  if (constraints.coolOnly) {
    // Cool colors: 180-300 (cyan, blue, purple)
    if (h < 180 || h > 300) {
      // Map warm hues to cool range
      h = 180 + (h % 120)
    }
  }
  
  if (constraints.warmOnly) {
    // Warm colors: 0-60 and 300-360 (red, orange, yellow)
    if (h >= 60 && h <= 300) {
      // Map cool hues to warm range
      h = h % 60
    }
  }
  
  return { l, c, h }
}

// Fast OKLCH to HEX conversion (skips gamut checking for performance)
export function oklchToHexFast(color: OklchColor): string {
  const oklchColor = {
    mode: 'oklch' as const,
    l: color.l,
    c: denormalizeChroma(color.c),
    h: color.h
  }
  
  const hex = formatHex(oklchColor)
  return hex || '#000000'
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// Interpolate between two colors
export function interpolateColor(
  color1: OklchColor, 
  color2: OklchColor, 
  t: number
): OklchColor {
  // Handle hue interpolation (shortest path)
  let h1 = color1.h
  let h2 = color2.h
  
  const diff = h2 - h1
  if (Math.abs(diff) > 180) {
    if (diff > 0) {
      h1 += 360
    } else {
      h2 += 360
    }
  }
  
  return {
    l: color1.l + (color2.l - color1.l) * t,
    c: color1.c + (color2.c - color1.c) * t,
    h: (h1 + (h2 - h1) * t) % 360
  }
}

// Sample colors along a path
export function samplePath(points: PathPoint[], count: number): OklchColor[] {
  if (points.length === 0) return []
  if (points.length === 1) return Array(count).fill(points[0].color)
  
  const colors: OklchColor[] = []
  const totalSegments = points.length - 1
  
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const position = t * totalSegments
    const segmentIndex = Math.min(Math.floor(position), totalSegments - 1)
    const segmentT = position - segmentIndex
    
    const color = interpolateColor(
      points[segmentIndex].color,
      points[segmentIndex + 1].color,
      segmentT
    )
    colors.push(color)
  }
  
  return colors
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function interpolateHue(h1: number, h2: number, t: number): number {
  const diff = h2 - h1
  const shortest = Math.abs(diff) > 180
    ? diff > 0
      ? diff - 360
      : diff + 360
    : diff

  return (h1 + shortest * t + 360) % 360
}

function lightColorBias(lightColor: OklchColor, t: number): number {
  const hue = lightColor.h % 360
  const warmLight = hue <= 90 || hue >= 330
  const strength = warmLight ? -1 : 1

  return strength * t
}

function shadowLightnessFalloff(t: number, depth: number): number {
  return -depth * (1 - Math.pow(1 - t, 1.8))
}

export interface ShadowInfluenceOptions {
  preset: ShadowInfluencePreset
  environmentColor: OklchColor
  lightColor: OklchColor
  strength?: number
}

export type ShadowInfluencePreset = 'subtle' | 'natural' | 'strongEnvironment' | 'stylized'

export interface ShadowInfluenceConfig {
  name: string
  description: string
  envInfluence: number
  lightnessDepth: number
  chromaReduction: number
  chromaEnvBoost: number
  hueBlendStrength: number
  lightHueBias: number
}

export const SHADOW_INFLUENCE_PRESETS: Record<ShadowInfluencePreset, ShadowInfluenceConfig> = {
  subtle: {
    name: 'Subtle',
    description: 'Light guiding, gentle drift toward environment',
    envInfluence: 0.35,
    lightnessDepth: 0.18,
    chromaReduction: 0.18,
    chromaEnvBoost: 0.25,
    hueBlendStrength: 0.5,
    lightHueBias: 3
  },
  natural: {
    name: 'Natural',
    description: 'Balanced shadow flow with perceptual realism',
    envInfluence: 0.55,
    lightnessDepth: 0.28,
    chromaReduction: 0.24,
    chromaEnvBoost: 0.35,
    hueBlendStrength: 0.75,
    lightHueBias: 5
  },
  strongEnvironment: {
    name: 'Strong Environment',
    description: 'Aggressive drift toward the environment hue',
    envInfluence: 0.9,
    lightnessDepth: 0.36,
    chromaReduction: 0.28,
    chromaEnvBoost: 0.55,
    hueBlendStrength: 0.95,
    lightHueBias: 4
  },
  stylized: {
    name: 'Stylized',
    description: 'Sharper contrast and exaggerated hue shifts',
    envInfluence: 0.7,
    lightnessDepth: 0.40,
    chromaReduction: 0.12,
    chromaEnvBoost: 0.5,
    hueBlendStrength: 0.85,
    lightHueBias: 9
  }
}

export function applyShadowInfluenceToPath(
  path: PathPoint[],
  options: ShadowInfluenceOptions
): PathPoint[] {
  const { environmentColor, lightColor, preset, strength = 1 } = options
  const config = SHADOW_INFLUENCE_PRESETS[preset]

  return path.map((point, index) => {
    const t = path.length > 1 ? index / (path.length - 1) : 0
    const adjustedT = clamp(t)
    const envWeight = clamp(adjustedT * config.envInfluence * strength)

    const hueTarget = interpolateHue(point.color.h, environmentColor.h, envWeight * config.hueBlendStrength)
    const hueBias = lightColorBias(lightColor, adjustedT) * config.lightHueBias * strength
    const finalHue = interpolateHue(hueTarget, (hueTarget + hueBias + 360) % 360, 1)

    const finalLightness = clamp(
      point.color.l + shadowLightnessFalloff(adjustedT, config.lightnessDepth) * strength
    )

    const finalChroma = clamp(
      point.color.c * (1 - config.chromaReduction * adjustedT * strength)
        + environmentColor.c * config.chromaEnvBoost * adjustedT * strength
    )

    return {
      ...point,
      id: `${point.id}-shadow`,
      color: {
        l: finalLightness,
        c: finalChroma,
        h: finalHue
      }
    }
  })
}

export function generateShadowBasePath(
  baseColor: OklchColor,
  preset: ShadowInfluencePreset
): PathPoint[] {
  const config = SHADOW_INFLUENCE_PRESETS[preset]
  const points: PathPoint[] = []

  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const lightnessOffset = shadowLightnessFalloff(t, config.lightnessDepth * 0.8)
    const chromaOffset = -config.chromaReduction * t * baseColor.c * 0.7
    const hueOffset = (t - 0.4) * config.hueBlendStrength * 0.5

    const newL = clamp(baseColor.l + lightnessOffset)
    const newC = clamp(baseColor.c + chromaOffset)
    const newH = (baseColor.h + hueOffset + 360) % 360

    points.push({
      id: generateId(),
      color: {
        l: newL,
        c: newC,
        h: newH
      },
      x: (newH / 360) * 600,
      y: (1 - newC) * 400
    })
  }

  return points
}

// ============================================
// Shadow Path Generation
// ============================================

export type ShadowPreset = 'natural' | 'cool' | 'anime' | 'softGray'

export interface ShadowConfig {
  name: string
  description: string
  lightnessSteps: number[]     // Relative L changes (cumulative)
  chromaMultipliers: number[]  // Multipliers for chroma at each step
  hueShifts: number[]          // Hue shifts toward cool (negative = toward blue)
}

export const SHADOW_PRESETS: Record<ShadowPreset, ShadowConfig> = {
  natural: {
    name: 'Natural Shadow',
    description: 'Realistic shadow with subtle hue shift toward blue',
    lightnessSteps: [0, -0.08, -0.16, -0.24, -0.32],
    chromaMultipliers: [1, 0.95, 0.88, 0.78, 0.65],
    hueShifts: [0, -8, -18, -28, -35]
  },
  cool: {
    name: 'Cool Shadow',
    description: 'Strong shift toward blue/violet tones',
    lightnessSteps: [0, -0.07, -0.14, -0.22, -0.30],
    chromaMultipliers: [1, 1.05, 1.0, 0.90, 0.75],
    hueShifts: [0, -15, -30, -45, -55]
  },
  anime: {
    name: 'Anime Shadow',
    description: 'High contrast with saturated purple shadows',
    lightnessSteps: [0, -0.12, -0.22, -0.32, -0.42],
    chromaMultipliers: [1, 1.15, 1.25, 1.10, 0.85],
    hueShifts: [0, -20, -40, -55, -65]
  },
  softGray: {
    name: 'Soft Gray Shadow',
    description: 'Desaturated, neutral gray shadows',
    lightnessSteps: [0, -0.06, -0.13, -0.21, -0.30],
    chromaMultipliers: [1, 0.70, 0.45, 0.25, 0.12],
    hueShifts: [0, -5, -10, -12, -15]
  }
}

export interface ShadowPaletteResult {
  base: OklchColor
  lightShadow: OklchColor
  midShadow: OklchColor
  deepShadow: OklchColor
  accentShadow: OklchColor
}

// Generate shadow path from a base color using a preset
export function generateShadowPath(
  baseColor: OklchColor,
  preset: ShadowPreset
): PathPoint[] {
  const config = SHADOW_PRESETS[preset]
  const points: PathPoint[] = []
  
  for (let i = 0; i < config.lightnessSteps.length; i++) {
    // Calculate new lightness (clamped to 0-1)
    const newL = Math.max(0, Math.min(1, baseColor.l + config.lightnessSteps[i]))
    
    // Calculate new chroma (clamped to 0-1)
    const newC = Math.max(0, Math.min(1, baseColor.c * config.chromaMultipliers[i]))
    
    // Calculate new hue (wrap around 360)
    let newH = baseColor.h + config.hueShifts[i]
    if (newH < 0) newH += 360
    if (newH >= 360) newH -= 360
    
    const color: OklchColor = { l: newL, c: newC, h: newH }
    
    // Generate position on canvas (for visualization)
    // X based on hue (0-360 mapped to canvas width)
    // Y based on chroma (inverted, high chroma at top)
    points.push({
      id: generateId(),
      color,
      x: (newH / 360) * 600, // Will be recalculated based on canvas size
      y: (1 - newC) * 400
    })
  }
  
  return points
}

// Extract the 5 named shadow colors from path
export function getShadowPalette(points: PathPoint[]): ShadowPaletteResult | null {
  if (points.length === 0) return null

  const sampledColors = points.length >= 5
    ? points.slice(0, 5).map((point) => point.color)
    : samplePath(points, 5)

  if (sampledColors.length < 5) return null

  return {
    base: sampledColors[0],
    lightShadow: sampledColors[1],
    midShadow: sampledColors[2],
    deepShadow: sampledColors[3],
    accentShadow: sampledColors[4]
  }
}

// ============================================
// Hidden Color Generator
// ============================================

export type HiddenColorStyle = 'neutralGray' | 'warmVariation' | 'coolVariation' | 'painterly' | 'boldPainterly'

export interface HiddenColorConfig {
  name: string
  description: string
  targetHue: number | null
  hueShiftMax: number
  chromaScaleRange: [number, number]
  lightnessRange: [number, number]
  chromaCompression: number

  hueAnchors?: number[]
}

export const HIDDEN_COLOR_STYLES: Record<HiddenColorStyle, HiddenColorConfig> = {
  neutralGray: {
    name: 'Neutral Gray',
    description: 'Very subtle neutral shifts with quiet pigment variation.',
    targetHue: null,
    hueShiftMax: 4,
    chromaScaleRange: [0.5, 0.8],
    lightnessRange: [-0.003, 0.003],
    chromaCompression: 0.72
  },
  warmVariation: {
    name: 'Warm Variation',
    description: 'Subtle warm bias with restrained chroma and soft value preservation.',
    targetHue: 60,
    hueShiftMax: 14,
    chromaScaleRange: [0.88, 1.0],
    lightnessRange: [-0.004, 0.004],
    chromaCompression: 0.9
  },
  coolVariation: {
    name: 'Cool Variation',
    description: 'Subtle cool bias with restrained chroma and soft value preservation.',
    targetHue: 240,
    hueShiftMax: 14,
    chromaScaleRange: [0.88, 1.0],
    lightnessRange: [-0.004, 0.004],
    chromaCompression: 0.9
  },
  painterly: {
    name: 'Painterly',
    description: 'Expressive hidden pigment shifts with slight lightness breathing.',
    targetHue: null,
    hueShiftMax: 20,
    chromaScaleRange: [0.87, 1.1],
    lightnessRange: [-0.015, 0.015],
    chromaCompression: 0.88
  },
  boldPainterly: {
    name: 'Bold Painterly',
    description:
      'Expressive multi-hue hidden colors inspired by traditional painting. ' +
      'Warm highlights, stable midtones, cool shadows, and complementary accents.',

    // Fallback when hueAnchors is not used
    targetHue: null,
    hueShiftMax: 40,

    // Strong but still controllable saturation changes
    chromaScaleRange: [0.8, 1.25],

    // Only used when lockLightness = false.
    // For hidden colors, keep lockLightness = true by default.
    lightnessRange: [-0.03, 0.03],

    // Slightly compress extreme saturation changes
    chromaCompression: 0.92,

    // Relative hue offsets (degrees) from the base hue.
    // Structure:
    // 1. Warm highlight
    // 2. Slightly warm halftone
    // 3. Base color
    // 4. Cool shadow
    // 5. Complementary accent
    //
    // Example with orange base (30°):
    // 65°  → yellow-orange
    // 40°  → warm orange
    // 30°  → base
    // 320° → blue-violet shadow
    // 210° → cyan-blue complement
    hueAnchors: [35, 10, 0, -70, 180]
  }
}

export interface HiddenColorPalette {
  base: OklchColor
  variations: OklchColor[]
}

export type HiddenColorMode =
  | 'analogous'
  | 'triadic'
  | 'lightness-ramp'
  | 'chroma-shift'
  | 'neutral-muted'

export interface HiddenColorOptions {
  count: number
  strength?: number
  mode?: HiddenColorMode
  lockLightness: boolean
  style?: HiddenColorStyle

  hueShiftMax?: number
  targetHue?: number | null

  // NEW
  hueAnchors?: number[]

  chromaFactorRange?: [number, number]
  chromaScaleRange?: [number, number]
  lightnessShiftRange?: [number, number]
  ensureGamut?: boolean
  seed?: number
  minContrastRatio?: number
  chromaCompression?: number
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function easeInOutSigned(x: number): number {
  const sign = Math.sign(x)
  const t = Math.abs(x)
  return sign * smoothstep(t)
}

function gaussian(x: number, sigma = 0.55): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma))
}

function saturationResistance(chroma: number): number {
  // 高饱和颜色更稳定
  // c=0   -> 1.0
  // c=1.0 -> 0.35
  return 1 - Math.pow(clamp(chroma), 0.8) * 0.65
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function shortestHueDelta(from: number, to: number): number {
  const delta = normalizeHue(to - from)
  return delta > 180 ? delta - 360 : delta
}

function createVariationPositions(count: number): number[] {
  if (count <= 1) return [0]
  if (count === 5) return [-1, -0.5, 0, 0.5, 1]

  return Array.from({ length: count }, (_, index) => {
    return (index / (count - 1)) * 2 - 1
  })
}

function computeHueOffset(
  baseHue: number,
  config: HiddenColorConfig,
  position: number,
  strength: number,
  baseChroma: number
): number {

  // for hueAnchors
  if (
    config.hueAnchors &&
    config.hueAnchors.length >= 2
  ) {
    const anchors = config.hueAnchors

    // position: -1 ~ 1  ->  0 ~ 1
    const t = (position + 1) / 2

    // Map t across anchor segments
    const scaled = t * (anchors.length - 1)
    const index = Math.floor(scaled)
    const localT = scaled - index

    const a = anchors[index]
    const b = anchors[Math.min(index + 1, anchors.length - 1)]

    // Interpolate anchor offsets
    const rawOffset = a + (b - a) * localT

    // Respect strength and saturation resistance
    const resistance = saturationResistance(baseChroma)

    return rawOffset * strength * resistance
  }
  
  const resistance = saturationResistance(baseChroma)
  const shaped = easeInOutSigned(position)

  // 中间颜色更稳定
  const centerWeight = 1 - gaussian(position)

  const hueStrength = Math.pow(strength, 0.65) * 1.8

  // 基础位置偏移
  const positional =
    shaped *
    config.hueShiftMax *
    hueStrength *
    resistance *
    centerWeight
  
  // const positional =
  //   shaped *
  //   config.hueShiftMax *
  //   strength *
  //   resistance *
  //   centerWeight

  // 向目标色相吸引
  let attraction = 0

  if (config.targetHue !== null) {
    const delta = shortestHueDelta(baseHue, config.targetHue)

    attraction =
      delta *
      0.25 *
      hueStrength *
      resistance
  } else {
    // neutral / painterly：两端轻微偏暖/偏冷
    const target = position < 0 ? 240 : 60
    const delta = shortestHueDelta(baseHue, target)

    attraction =
      delta *
      0.15 *
      hueStrength *
      resistance
  }

  // 轻微 painterly 不对称
  const asymmetry = position > 0
    ? 0.92
    : 1.05

  return (positional + attraction) * asymmetry
}

function computeChromaScale(
  baseChroma: number,
  config: HiddenColorConfig,
  position: number,
  strength: number
): number {
  const [minScale, maxScale] = config.chromaScaleRange

  // 把 position 映射到 0-1
  const t = (position + 1) / 2
  const eased = smoothstep(t)

  // 平滑插值
  const rawScale =
    minScale + (maxScale - minScale) * eased

  // 根据 strength 向 1 收敛
  const blended = 1 + (rawScale - 1) * strength

  // 压缩极端变化
  const compressed =
    1 + (blended - 1) * config.chromaCompression

  // 低饱和颜色增加一点活性
  const lowChromaBoost =
    baseChroma < 0.08
      ? (0.08 - baseChroma) * 0.8 * strength
      : 0

  // 高饱和颜色减少变化幅度
  const resistance = saturationResistance(baseChroma)

  const finalScale =
    1 + (compressed - 1) * resistance + lowChromaBoost

  return clamp(finalScale, 0.35, 1.25)
}

function computeLightnessDelta(
  config: HiddenColorConfig,
  position: number,
  lockLightness: boolean,
  strength: number
): number {
  if (lockLightness) {
    return 0
  }

  const [minLight, maxLight] = config.lightnessRange

  const t = (position + 1) / 2
  const eased = smoothstep(t)

  let delta =
    minLight + (maxLight - minLight) * eased

  // 中心更稳定
  delta *= 1 - gaussian(position, 0.45) * 0.35

  return delta * strength
}

function isValidOklchColor(color: OklchColor): boolean {
  return Number.isFinite(color.l) && Number.isFinite(color.c) && Number.isFinite(color.h)
}

function clampOklchChannelValues(color: OklchColor): OklchColor {
  return {
    l: clamp(color.l),
    c: clamp(color.c),
    h: normalizeHue(color.h)
  }
}

function relativeLuminanceFromHex(hex: string): number {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((start) => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrastRatio(color: OklchColor, base: OklchColor): number {
  const colorLuminance = relativeLuminanceFromHex(oklchToHex(color))
  const baseLuminance = relativeLuminanceFromHex(oklchToHex(base))
  const lighter = Math.max(colorLuminance, baseLuminance)
  const darker = Math.min(colorLuminance, baseLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

export function isOklchInGamut(color: OklchColor): boolean {
  const candidate = clampOklchChannelValues(color)

  if (!displayable({
    mode: 'oklch',
    l: candidate.l,
    c: denormalizeChroma(candidate.c),
    h: candidate.h
  })) {
    return false
  }

  const roundTrip = hexToOklch(oklchToHex(candidate))
  if (!roundTrip) return false

  const hueDelta = Math.min(
    Math.abs(normalizeHue(candidate.h) - normalizeHue(roundTrip.h)),
    360 - Math.abs(normalizeHue(candidate.h) - normalizeHue(roundTrip.h))
  ) / 360
  const hueMatches = candidate.c < 0.001 || roundTrip.c < 0.001 || hueDelta < 0.01

  return (
    Math.abs(candidate.l - roundTrip.l) < 0.01 &&
    Math.abs(candidate.c - roundTrip.c) < 0.01 &&
    hueMatches
  )
}

export function clampChromaToGamut(color: OklchColor): OklchColor {
  const candidate = clampOklchChannelValues(color)
  if (isOklchInGamut(candidate)) return candidate

  let low = 0
  let high = candidate.c
  let best = { ...candidate, c: 0 }

  while (high - low > 0.001) {
    const c = (low + high) / 2
    const testColor = { ...candidate, c }

    if (isOklchInGamut(testColor)) {
      best = testColor
      low = c
    } else {
      high = c
    }
  }

  return best
}

function styleToHiddenColorOptions(
  style: HiddenColorStyle,
  lockLightness: boolean
): HiddenColorOptions {
  switch (style) {
    case 'warmVariation':
      return {
        count: 5,
        strength: 0.68,
        mode: 'analogous',
        lockLightness,
        targetHue: 60,
        hueShiftMax: 14,
        chromaScaleRange: [0.88, 1.0],
        lightnessShiftRange: [-0.004, 0.004],
        chromaCompression: 0.9,
        ensureGamut: true
      }
    case 'coolVariation':
      return {
        count: 5,
        strength: 0.68,
        mode: 'triadic',
        lockLightness,
        targetHue: 240,
        hueShiftMax: 14,
        chromaScaleRange: [0.88, 1.0],
        lightnessShiftRange: [-0.004, 0.004],
        chromaCompression: 0.9,
        ensureGamut: true
      }
    case 'painterly':
      return {
        count: 5,
        strength: 0.82,
        mode: 'lightness-ramp',
        lockLightness,
        targetHue: null,
        hueShiftMax: 20,
        chromaScaleRange: [0.87, 1.1],
        lightnessShiftRange: [-0.015, 0.015],
        chromaCompression: 0.88,
        ensureGamut: true
      }
    case 'boldPainterly':
      return {
        count: 5,
        strength: 0.9,
        mode: 'lightness-ramp',
        lockLightness,
        targetHue: null,
        hueShiftMax: 40,
        chromaScaleRange: [0.8, 1.25],
        lightnessShiftRange: [-0.03, 0.03],
        chromaCompression: 0.92,
        ensureGamut: true,
        
        hueAnchors: HIDDEN_COLOR_STYLES.boldPainterly.hueAnchors
      }
    case 'neutralGray':
    default:
      return {
        count: 5,
        strength: 0.58,
        mode: 'neutral-muted',
        lockLightness,
        targetHue: null,
        hueShiftMax: 4,
        chromaScaleRange: [0.5, 0.8],
        lightnessShiftRange: [-0.003, 0.003],
        chromaCompression: 0.72,
        ensureGamut: true
      }
  }
}

export function generateHiddenColorVariations(
  baseColor: OklchColor,
  options: HiddenColorOptions
): OklchColor[] {
  // 1. Validate input
  if (!isValidOklchColor(baseColor)) {
    throw new Error(
      'Invalid OKLCH color: expected finite l, c, and h values.'
    )
  }

  // 2. Normalize count
  const count = Math.max(1, Math.floor(options.count))
  if (count < 1) return []

  // 3. Normalize base color
  const base = clampOklchChannelValues(
    structuredClone(baseColor)
  )

  // 4. Normalize strength
  const strength = clamp(options.strength ?? 0.7)

  // strength = 0 → return identical copies
  if (strength === 0) {
    return Array.from(
      { length: count },
      () => structuredClone(base)
    )
  }

  // 5. Build style config from options
  const styleConfig: HiddenColorConfig = {
    name: 'custom',
    description: 'Custom hidden color configuration',
    targetHue: options.targetHue ?? null,
    hueShiftMax: options.hueShiftMax ?? 0,
    chromaScaleRange:
      options.chromaScaleRange ??
      options.chromaFactorRange ??
      [1, 1],
    lightnessRange:
      options.lightnessShiftRange ?? [0, 0],
    chromaCompression:
      options.chromaCompression ?? 1,

    // NEW
    hueAnchors: options.hueAnchors
  }

  // 6. Generate positions
  const positions = createVariationPositions(count)

  // 7. Options
  const ensureGamut = options.ensureGamut ?? true

  // 8. Generate colors
  const generated: OklchColor[] = []

  for (const position of positions) {
    // Hue shift
    const hueOffset = computeHueOffset(
      base.h,
      styleConfig,
      position,
      strength,
      base.c
    )

    // Chroma scaling
    const chromaScale = computeChromaScale(
      base.c,
      styleConfig,
      position,
      strength
    )

    // Lightness adjustment
    const lightnessDelta = computeLightnessDelta(
      styleConfig,
      position,
      options.lockLightness,
      strength
    )

    // Build candidate color
    const candidate: OklchColor = {
      l: clamp(base.l + lightnessDelta),
      c: clamp(base.c * chromaScale),
      h: normalizeHue(base.h + hueOffset)
    }

    // Keep within display gamut if requested
    generated.push(
      ensureGamut
        ? clampChromaToGamut(candidate)
        : clampOklchChannelValues(candidate)
    )
  }

  // 9. Optional contrast filtering
  const contrastFiltered = options.minContrastRatio
    ? generated.filter(
        (color) =>
          contrastRatio(color, base) >=
          options.minContrastRatio!
      )
    : generated

  return contrastFiltered
}

// Accept full options object
export function generateHiddenColorPalette(
  baseColor: OklchColor,
  options: HiddenColorOptions
): HiddenColorPalette

// Accept style + lockLightness shorthand
export function generateHiddenColorPalette(
  baseColor: OklchColor,
  style: HiddenColorStyle,
  lockLightness?: boolean
): HiddenColorPalette

// Implementation
export function generateHiddenColorPalette(
  baseColor: OklchColor,
  optionsOrStyle: HiddenColorOptions | HiddenColorStyle,
  lockLightness: boolean = true
): HiddenColorPalette {
  const options = typeof optionsOrStyle === 'string'
    ? styleToHiddenColorOptions(optionsOrStyle, lockLightness)
    : optionsOrStyle.style
      ? { ...styleToHiddenColorOptions(optionsOrStyle.style, optionsOrStyle.lockLightness ?? lockLightness), ...optionsOrStyle }
      : optionsOrStyle

  return {
    base: structuredClone(baseColor),
    variations: generateHiddenColorVariations(baseColor, options)
  }
}

// Parse HEX to OKLCH
export function hexToOklch(hex: string): OklchColor | null {
  try {
    const result = oklch(hex)
    if (!result) return null
    
    return {
      l: result.l ?? 0.5,
      c: normalizeChroma(result.c ?? 0),
      h: result.h ?? 0
    }
  } catch {
    return null
  }
}
