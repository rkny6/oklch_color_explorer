import { useRef, useEffect, useState, useCallback } from 'react'
import { 
  OklchColor, 
  PathPoint, 
  ColorConstraints,
  getColorAtPosition, 
  oklchToHex,
  oklchToHexFast,
  applyConstraints,
  generateId
} from '../utils/color'
import styles from './ColorField.module.css'

interface ColorFieldProps {
  lightness: number
  constraints: ColorConstraints
  path: PathPoint[]
  shadowPath?: PathPoint[]
  shadowBasePoint?: PathPoint | null
  hiddenColorBasePoint?: PathPoint | null
  onAddPoint: (point: PathPoint) => void
  onDeletePoint: (id: string) => void
  onUpdatePoint: (id: string, updates: Partial<PathPoint>) => void
  onDeleteShadowBasePoint?: () => void
  onDeleteHiddenColorBasePoint?: () => void
}

export function ColorField({ 
  lightness, 
  constraints, 
  path, 
  shadowPath,
  shadowBasePoint,
  hiddenColorBasePoint,
  onAddPoint,
  onDeletePoint,
  onUpdatePoint,
  onDeleteShadowBasePoint,
  onDeleteHiddenColorBasePoint
}: ColorFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const [hoverColor, setHoverColor] = useState<OklchColor | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null)
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null)
  const [backgroundUpdateKey, setBackgroundUpdateKey] = useState(0)

  // Check if position is near a point (for click/hover detection)
  const findPointAtPosition = useCallback((x: number, y: number): PathPoint | null => {
    const hitRadius = 15 // Generous click target
    for (let i = path.length - 1; i >= 0; i--) {
      const point = path[i]
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
      if (distance <= hitRadius) {
        return point
      }
    }
    return null
  }, [path])

  // Render the background color field (expensive, cached)
  const renderBackground = useCallback(() => {
    if (!backgroundCanvasRef.current) {
      backgroundCanvasRef.current = document.createElement('canvas')
    }
    
    const bgCanvas = backgroundCanvasRef.current
    const ctx = bgCanvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    
    // Prevent rendering with invalid dimensions
    if (width <= 0 || height <= 0) return
    
    bgCanvas.width = width
    bgCanvas.height = height
    
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    // Batch color calculations for better performance
    const colors = new Array(width * height)
    for (let i = 0; i < colors.length; i++) {
      const x = i % width
      const y = Math.floor(i / width)
      let color = getColorAtPosition(x, y, lightness, width, height)
      color = applyConstraints(color, constraints)
      colors[i] = color
    }

    // Convert to RGBA in a separate loop for better cache locality
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i]
      const hex = oklchToHexFast(color) // Use fast version for background
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      
      const idx = i * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255 // Full opacity for background
    }

    ctx.putImageData(imageData, 0, 0)
    
    // Trigger overlay re-render after background is updated
    setBackgroundUpdateKey(prev => prev + 1)
  }, [lightness, constraints, dimensions])

  // Render the overlay (path, points) - fast
  const renderOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions
    
    // Prevent rendering with invalid dimensions
    if (width <= 0 || height <= 0) return

    // Clear and draw background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)
    if (backgroundCanvasRef.current) {
      ctx.drawImage(backgroundCanvasRef.current, 0, 0)
    }

    const drawPathLine = (points: PathPoint[], strokeOptions: { lineWidth: number; dash: number[]; alpha: number; colorOverride?: boolean }) => {
      if (points.length < 2) return

      ctx.lineWidth = strokeOptions.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash(strokeOptions.dash)

      for (let i = 1; i < points.length; i++) {
        const start = points[i - 1]
        const end = points[i]
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.strokeStyle = strokeOptions.colorOverride
          ? oklchToHex(end.color)
          : `rgba(255, 255, 255, ${strokeOptions.alpha})`
        ctx.stroke()
      }

      ctx.setLineDash([])
    }

    const drawPoint = (point: PathPoint, isHovered: boolean, isDragging: boolean, showLabel = true, label = 1) => {
      const baseRadius = 8
      const radius = (isHovered || isDragging) ? baseRadius + 4 : baseRadius
      
      // Outer glow when dragging
      if (isDragging) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius + 6, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)'
        ctx.lineWidth = 3
        ctx.stroke()
      } else if (isHovered) {
        ctx.beginPath()
        ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = isDragging ? 'rgba(100, 200, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius - 2, 0, Math.PI * 2)
      ctx.fillStyle = oklchToHex(point.color)
      ctx.fill()

      if (showLabel) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label.toString(), point.x, point.y)
      }
    }

    if (path.length > 0) {
      drawPathLine(path, {
        lineWidth: 2,
        dash: [8, 6],
        alpha: 0.65
      })

      // Draw points
      path.forEach((point, index) => {
        const isHovered = point.id === hoveredPointId
        const isDragging = point.id === draggingPointId
        drawPoint(point, isHovered, isDragging, true, index + 1)
      })
    }

    // Draw shadow base point
    if (shadowBasePoint) {
      drawPoint(shadowBasePoint, shadowBasePoint.id === hoveredPointId, false, false)
    }

    // Draw hidden color base point
    if (hiddenColorBasePoint) {
      drawPoint(hiddenColorBasePoint, hiddenColorBasePoint.id === hoveredPointId, false, false)
    }
  }, [path, shadowPath, shadowBasePoint, hiddenColorBasePoint, dimensions, hoveredPointId, draggingPointId])

  // Handle resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ 
        width: Math.floor(width), 
        height: Math.floor(height) 
      })
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  // Render background when parameters change
  useEffect(() => {
    renderBackground()
  }, [renderBackground])

  // Render overlay when path or interaction state changes, or background updates
  useEffect(() => {
    renderOverlay()
  }, [renderOverlay, backgroundUpdateKey])

  // Throttled drag update
  const throttledDragUpdate = useRef<((x: number, y: number) => void) | null>(null)
  
  useEffect(() => {
    let rafId: number | null = null
    
    throttledDragUpdate.current = (x: number, y: number) => {
      if (rafId) return // Already scheduled
      
      rafId = requestAnimationFrame(() => {
        if (draggingPointId) {
          let color = getColorAtPosition(x, y, lightness, dimensions.width, dimensions.height)
          color = applyConstraints(color, constraints)
          onUpdatePoint(draggingPointId, { x, y, color })
        }
        rafId = null
      })
    }
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [draggingPointId, lightness, constraints, dimensions, onUpdatePoint])

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, dimensions.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, dimensions.height))

    // If dragging a point, update its position (throttled)
    if (draggingPointId) {
      throttledDragUpdate.current?.(x, y)
      let color = getColorAtPosition(x, y, lightness, dimensions.width, dimensions.height)
      color = applyConstraints(color, constraints)
      setHoverColor(color)
      setHoverPosition({ x, y })
      return
    }

    // Check if hovering over a point
    let hoveredId: string | null = null
    
    // Check path points
    const hitPoint = findPointAtPosition(x, y)
    if (hitPoint) {
      hoveredId = hitPoint.id
    }
    
    // Check shadow base point
    if (!hoveredId && shadowBasePoint) {
      const distance = Math.sqrt(Math.pow(shadowBasePoint.x - x, 2) + Math.pow(shadowBasePoint.y - y, 2))
      if (distance <= 15) {
        hoveredId = shadowBasePoint.id
      }
    }
    
    // Check hidden color base point
    if (!hoveredId && hiddenColorBasePoint) {
      const distance = Math.sqrt(Math.pow(hiddenColorBasePoint.x - x, 2) + Math.pow(hiddenColorBasePoint.y - y, 2))
      if (distance <= 15) {
        hoveredId = hiddenColorBasePoint.id
      }
    }
    
    setHoveredPointId(hoveredId)

    let color = getColorAtPosition(x, y, lightness, dimensions.width, dimensions.height)
    color = applyConstraints(color, constraints)
    
    setHoverColor(color)
    setHoverPosition({ x, y })
    setIsHovering(true)
  }

  // Handle mouse down - start drag or add point
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on an existing point
    const hitPoint = findPointAtPosition(x, y)
    if (hitPoint) {
      // Shift+click to delete
      if (e.shiftKey) {
        onDeletePoint(hitPoint.id)
        setHoveredPointId(null)
        return
      }
      // Start dragging
      setDraggingPointId(hitPoint.id)
      return
    }

    // Click on empty space adds a new point
    let color = getColorAtPosition(x, y, lightness, dimensions.width, dimensions.height)
    color = applyConstraints(color, constraints)

    onAddPoint({
      id: generateId(),
      color,
      x,
      y
    })
  }

  // Handle mouse up - stop drag
  const handleMouseUp = () => {
    setDraggingPointId(null)
  }

  // Handle double click - delete point
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check shadow base point
    if (shadowBasePoint) {
      const distance = Math.sqrt(Math.pow(shadowBasePoint.x - x, 2) + Math.pow(shadowBasePoint.y - y, 2))
      if (distance <= 15) {
        onDeleteShadowBasePoint?.()
        setHoveredPointId(null)
        return
      }
    }

    // Check hidden color base point
    if (hiddenColorBasePoint) {
      const distance = Math.sqrt(Math.pow(hiddenColorBasePoint.x - x, 2) + Math.pow(hiddenColorBasePoint.y - y, 2))
      if (distance <= 15) {
        onDeleteHiddenColorBasePoint?.()
        setHoveredPointId(null)
        return
      }
    }

    const hitPoint = findPointAtPosition(x, y)
    if (hitPoint) {
      onDeletePoint(hitPoint.id)
      setHoveredPointId(null)
      setDraggingPointId(null)
    }
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        width={Math.max(200, dimensions.width)}
        height={Math.max(200, dimensions.height)}
        className={styles.canvas}
        style={{ cursor: hoveredPointId ? (draggingPointId ? 'grabbing' : 'grab') : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsHovering(false); setHoveredPointId(null); setDraggingPointId(null) }}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* Hover tooltip */}
      {isHovering && hoverColor && (
        <div 
          className={styles.tooltip}
          style={{ 
            left: hoverPosition.x + 20, 
            top: hoverPosition.y - 60,
            transform: hoverPosition.x > dimensions.width - 200 ? 'translateX(-240px)' : 'none'
          }}
        >
          <div 
            className={styles.tooltipSwatch}
            style={{ background: oklchToHex(hoverColor) }}
          />
          <div className={styles.tooltipInfo}>
            <div className={styles.tooltipHex}>{oklchToHex(hoverColor)}</div>
            <div className={styles.tooltipOklch}>
              L: {hoverColor.l.toFixed(2)} · C: {hoverColor.c.toFixed(2)} · H: {hoverColor.h.toFixed(0)}°
            </div>
          </div>
        </div>
      )}

      {/* Crosshair cursor */}
      {isHovering && (
        <div 
          className={styles.crosshair}
          style={{ left: hoverPosition.x, top: hoverPosition.y }}
        />
      )}

      {/* Axis labels */}
      <div className={styles.axisLabelX}>Hue →</div>
      <div className={styles.axisLabelY}>← Chroma</div>
    </div>
  )
}
