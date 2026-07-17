'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { GradientSettings, BlobConfig } from '@/lib/types'
import { useWebGL } from '@/hooks/useWebGL'

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  settings: GradientSettings
  selectedBlobId: string | null
  showHandles: boolean
  onSelectBlob: (id: string | null) => void
  onUpdateBlob: (id: string, patch: Partial<BlobConfig>) => void
}

type Drag =
  | { type: 'move';   blobId: string; startMx: number; startMy: number; startBx: number; startBy: number }
  | { type: 'resize'; blobId: string; cx: number; cy: number }
  | null

// Distance in shader-space (aspect-corrected, normalized to canvas height)
function shaderDist(ax: number, ay: number, bx: number, by: number, aspect: number) {
  const dx = (ax - bx) * aspect
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

export function BlobCanvas({ canvasRef, settings, selectedBlobId, showHandles, onSelectBlob, onUpdateBlob }: Props) {
  const dragRef = useRef<Drag>(null)
  const { render } = useWebGL(canvasRef)

  // Sync canvas element dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = settings.canvasWidth
    canvas.height = settings.canvasHeight
  }, [canvasRef, settings.canvasWidth, settings.canvasHeight])

  // Re-render on every settings change
  useEffect(() => { render(settings) }, [settings, render])

  const uvFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect   = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left)  / rect.width,
      y: (e.clientY - rect.top)   / rect.height,
    }
  }, [canvasRef])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const uv     = uvFromEvent(e)
    const aspect = settings.canvasWidth / settings.canvasHeight

    // Check resize handle first (only for selected blob)
    if (selectedBlobId) {
      const blob = settings.blobs.find(b => b.id === selectedBlobId)
      if (blob) {
        // Resize handle is at (blob.x + blob.radius/aspect, blob.y) in UV space
        const hx = blob.x + blob.radius / aspect
        const hy = blob.y
        if (shaderDist(uv.x, uv.y, hx, hy, aspect) < 0.018) {
          dragRef.current = { type: 'resize', blobId: blob.id, cx: blob.x, cy: blob.y }
          return
        }
      }
    }

    // Hit-test all blobs (pick nearest center within 2× radius)
    let hit: BlobConfig | null = null
    let bestDist = Infinity
    for (const blob of settings.blobs) {
      const d = shaderDist(uv.x, uv.y, blob.x, blob.y, aspect)
      if (d < blob.radius * 2 && d < bestDist) { bestDist = d; hit = blob }
    }

    if (hit) {
      onSelectBlob(hit.id)
      dragRef.current = {
        type: 'move', blobId: hit.id,
        startMx: e.clientX, startMy: e.clientY,
        startBx: hit.x,     startBy: hit.y,
      }
    } else {
      onSelectBlob(null)
    }
  }, [settings, selectedBlobId, uvFromEvent, onSelectBlob])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const canvas = canvasRef.current!
      const rect   = canvas.getBoundingClientRect()
      const aspect = settings.canvasWidth / settings.canvasHeight

      if (drag.type === 'move') {
        const dxUV = (e.clientX - drag.startMx) / rect.width
        const dyUV = (e.clientY - drag.startMy) / rect.height
        onUpdateBlob(drag.blobId, {
          x: Math.max(0, Math.min(1, drag.startBx + dxUV)),
          y: Math.max(0, Math.min(1, drag.startBy + dyUV)),
        })
      } else {
        // Resize: radius = shader-distance from blob center to mouse
        const uv = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top)  / rect.height,
        }
        const r = shaderDist(uv.x, uv.y, drag.cx, drag.cy, aspect)
        onUpdateBlob(drag.blobId, { radius: Math.max(0.04, r) })
      }
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [canvasRef, settings, onUpdateBlob])

  const { canvasWidth, canvasHeight } = settings
  const aspect = canvasWidth / canvasHeight

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        width={canvasWidth}
        height={canvasHeight}
        className="absolute inset-0 w-full h-full rounded-lg"
        style={{ cursor: 'crosshair' }}
        onMouseDown={onMouseDown}
      />

      {/* Blob handles overlay */}
      {showHandles && (
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        >
          {settings.blobs.map(blob => {
            const cx = blob.x * canvasWidth
            const cy = blob.y * canvasHeight
            const r  = blob.radius * canvasHeight
            const isSelected = blob.id === selectedBlobId
            const color = settings.useGlobalColor ? settings.globalColor : blob.color
            const rhx = cx + (blob.radius / aspect) * canvasWidth

            return (
              <g key={blob.id}>
                <circle
                  cx={cx} cy={cy} r={r}
                  fill={color + '18'}
                  stroke={isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)'}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeDasharray={isSelected ? undefined : '8 5'}
                />
                <circle cx={cx} cy={cy} r={10} fill={color} stroke="white" strokeWidth={2.5} />
                {isSelected && (
                  <circle cx={rhx} cy={cy} r={8} fill="white" stroke={color} strokeWidth={2} />
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
