'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDialKit } from 'dialkit'
import type { BlobConfig, GradientSettings } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/defaults'
import { BlobCanvas } from '@/components/BlobCanvas'
import { ExportModal } from '@/components/ExportModal'
import { ImportModal } from '@/components/ImportModal'
import { exportPNG, exportSettingsJSON, generateCode } from '@/lib/exportUtils'
import { generateId, nextBlobColor } from '@/lib/colorUtils'

const ZOOM_STEP = 0.1
const ZOOM_MIN  = 0.1
const ZOOM_MAX  = 5.0

export default function Page() {
  const [blobs, setBlobs]                     = useState(DEFAULT_SETTINGS.blobs)
  const [selectedBlobId, setSelectedBlobId]   = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [zoom, setZoom]                       = useState(1)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsRef  = useRef<GradientSettings | null>(null)
  const selectedRef  = useRef<string | null>(null)
  selectedRef.current = selectedBlobId

  const selectedBlob = blobs.find(b => b.id === selectedBlobId) ?? null

  const dials = useDialKit('Blob Gradient', {
    showHandles: true,
    canvasW:     { type: 'text'  as const, default: String(DEFAULT_SETTINGS.canvasWidth)  },
    canvasH:     { type: 'text'  as const, default: String(DEFAULT_SETTINGS.canvasHeight) },
    background:  { type: 'color' as const, default: DEFAULT_SETTINGS.backgroundColor  },
    spread:      [DEFAULT_SETTINGS.spread, 0.2, 3.0] as [number, number, number],
    useGlobal:   DEFAULT_SETTINGS.useGlobalColor,
    globalColor: { type: 'color' as const, default: DEFAULT_SETTINGS.globalColor },
    addBlob:     { type: 'action' as const, label: '+ Add Blob'      },
    removeBlob:  { type: 'action' as const, label: 'Remove Selected' },
    exportPNG:   { type: 'action' as const, label: 'Export PNG'      },
    saveJSON:    { type: 'action' as const, label: 'Save JSON'       },
    importJSON:  { type: 'action' as const, label: 'Import JSON'     },
    exportCode:  { type: 'action' as const, label: 'Export Code →'  },
    copyJSON:    { type: 'action' as const, label: 'Copy JSON'       },
  }, {
    onAction: (action: string) => {
      const sel = selectedRef.current
      if (action === 'addBlob') {
        setBlobs(bs => [...bs, {
          id: generateId(), color: nextBlobColor(),
          x: 0.25 + Math.random() * 0.5,
          y: 0.25 + Math.random() * 0.5,
          radius: 0.18 + Math.random() * 0.1,
        }])
      }
      if (action === 'removeBlob' && sel) {
        setBlobs(bs => bs.length > 1 ? bs.filter(b => b.id !== sel) : bs)
        setSelectedBlobId(null)
      }
      if (action === 'exportPNG'  && canvasRef.current) exportPNG(canvasRef.current)
      if (action === 'saveJSON'   && settingsRef.current) exportSettingsJSON(settingsRef.current)
      if (action === 'importJSON') setShowImportModal(true)
      if (action === 'exportCode') setShowExportModal(true)
      if (action === 'copyJSON' && settingsRef.current)
        navigator.clipboard.writeText(JSON.stringify(settingsRef.current, null, 2))
    },
  })

  const updateBlob = useCallback((id: string, patch: Partial<BlobConfig>) => {
    setBlobs(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [])

  const handleImport = (imported: GradientSettings) => {
    setBlobs(imported.blobs)
    setSelectedBlobId(null)
  }

  const canvasW = Math.max(100, parseInt(dials.canvasW) || DEFAULT_SETTINGS.canvasWidth)
  const canvasH = Math.max(100, parseInt(dials.canvasH) || DEFAULT_SETTINGS.canvasHeight)

  const effectiveSettings: GradientSettings = {
    canvasWidth:     canvasW,
    canvasHeight:    canvasH,
    backgroundColor: dials.background,
    blobs,
    spread:          dials.spread,
    useGlobalColor:  dials.useGlobal,
    globalColor:     dials.globalColor,
  }
  settingsRef.current = effectiveSettings

  // Zoom helpers
  const fitZoom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const padding = 64
    const z = Math.min((width - padding) / canvasW, (height - padding) / canvasH)
    setZoom(Math.max(ZOOM_MIN, Math.round(z * 100) / 100))
  }, [canvasW, canvasH])

  // Auto-fit when canvas dimensions change
  useEffect(() => { fitZoom() }, [canvasW, canvasH, fitZoom])

  const changeZoom = (delta: number) => {
    setZoom(z => {
      const next = Math.round((z + delta) * 10) / 10
      return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next))
    })
  }

  const { tsx, css } = showExportModal ? generateCode(effectiveSettings) : { tsx: '', css: '' }

  return (
    <div className="h-screen bg-neutral-950 overflow-hidden">
      {/* Scrollable canvas stage */}
      <div ref={containerRef} className="h-full overflow-auto">
        <div className="min-h-full flex items-center justify-center p-8">
          <div style={{ width: canvasW * zoom, height: canvasH * zoom, flexShrink: 0, position: 'relative' }}>
            <BlobCanvas
              canvasRef={canvasRef}
              settings={effectiveSettings}
              selectedBlobId={selectedBlobId}
              showHandles={dials.showHandles}
              onSelectBlob={setSelectedBlobId}
              onUpdateBlob={updateBlob}
            />

            {/* Blob color picker — floats just outside the selected blob's radius ring */}
            {selectedBlob && !dials.useGlobal && (() => {
              const cx = selectedBlob.x * canvasW * zoom
              const cy = selectedBlob.y * canvasH * zoom
              const rPx = selectedBlob.radius * canvasH * zoom
              // Position below the radius ring; flip above if too close to bottom edge
              const belowY = cy + rPx + 8
              const top = belowY + 32 > canvasH * zoom ? cy - rPx - 40 : belowY
              return (
                <div
                  className="absolute flex items-center gap-2 h-8 bg-[#1c1c1e] border border-neutral-800 rounded-xl shadow-xl px-3 pointer-events-auto"
                  style={{ left: cx, top, transform: 'translateX(-50%)' }}
                >
                  <input
                    type="color"
                    value={selectedBlob.color}
                    onChange={e => updateBlob(selectedBlob.id, { color: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <span className="text-xs text-neutral-400 font-mono select-none">
                    {selectedBlob.color.toUpperCase()}
                  </span>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Bottom-right floating controls */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Zoom control */}
        <div className="flex items-center h-8 bg-[#1c1c1e] border border-neutral-800 rounded-xl shadow-xl overflow-hidden divide-x divide-neutral-800">
          <button
            onClick={() => changeZoom(ZOOM_STEP)}
            className="px-2.5 h-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm leading-none"
          >+</button>
          <span className="px-2.5 h-full flex items-center justify-center text-xs text-white font-mono tabular-nums min-w-[3.5rem] select-none">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => changeZoom(-ZOOM_STEP)}
            className="px-2.5 h-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm leading-none"
          >−</button>
          <button
            onClick={fitZoom}
            className="px-2.5 h-full text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >Fit</button>
          <button
            onClick={() => setZoom(1)}
            className="px-2.5 h-full text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >100%</button>
        </div>
      </div>

      {showImportModal && (
        <ImportModal onImport={handleImport} onClose={() => setShowImportModal(false)} />
      )}

      {showExportModal && (
        <ExportModal tsx={tsx} css={css} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
