'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useDialKit } from 'dialkit'
import type { BlobConfig, GradientSettings } from '@/lib/types'
import { DEFAULT_SETTINGS } from '@/lib/defaults'
import { BlobCanvas } from '@/components/BlobCanvas'
import { ExportModal } from '@/components/ExportModal'
import { exportPNG, exportSettingsJSON, importSettingsJSON, generateCode } from '@/lib/exportUtils'
import { generateId, nextBlobColor } from '@/lib/colorUtils'

export default function Page() {
  const [blobs, setBlobs]                     = useState(DEFAULT_SETTINGS.blobs)
  const [selectedBlobId, setSelectedBlobId]   = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const importRef  = useRef<HTMLInputElement>(null)
  const settingsRef = useRef<GradientSettings | null>(null) // stable ref for action handlers
  const selectedRef = useRef<string | null>(null)
  selectedRef.current = selectedBlobId

  const dials = useDialKit('Blob Gradient', {
    showHandles:  true,
    // Canvas
    canvasW:      { type: 'text' as const,  default: String(DEFAULT_SETTINGS.canvasWidth)  },
    canvasH:      { type: 'text' as const,  default: String(DEFAULT_SETTINGS.canvasHeight) },
    background:   { type: 'color' as const, default: DEFAULT_SETTINGS.backgroundColor },
    spread:       [DEFAULT_SETTINGS.spread, 0.2, 3.0] as [number, number, number],
    // Color
    useGlobal:    false,
    globalColor:  { type: 'color' as const, default: DEFAULT_SETTINGS.globalColor },
    blobColor:    { type: 'color' as const, default: '#6366f1' },
    // Blob actions
    addBlob:      { type: 'action' as const, label: '+ Add Blob'       },
    removeBlob:   { type: 'action' as const, label: 'Remove Selected'  },
    // Export actions
    exportPNG:    { type: 'action' as const, label: 'Export PNG'       },
    saveJSON:     { type: 'action' as const, label: 'Save JSON'        },
    importJSON:   { type: 'action' as const, label: 'Import JSON'      },
    exportCode:   { type: 'action' as const, label: 'Export Code →'   },
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
      if (action === 'importJSON') importRef.current?.click()
      if (action === 'exportCode') setShowExportModal(true)
    },
  })

  // Apply blobColor dial to selected blob when the color changes
  const prevBlobColor = useRef(dials.blobColor)
  useEffect(() => {
    if (dials.blobColor === prevBlobColor.current) return
    prevBlobColor.current = dials.blobColor
    const id = selectedRef.current
    if (id) setBlobs(bs => bs.map(b => b.id === id ? { ...b, color: dials.blobColor } : b))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dials.blobColor])

  const updateBlob = useCallback((id: string, patch: Partial<BlobConfig>) => {
    setBlobs(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [])

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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importSettingsJSON(file)
      setBlobs(imported.blobs)
      setSelectedBlobId(null)
    } catch {
      alert("Could not read the settings file — make sure it's a valid JSON export.")
    }
    e.target.value = ''
  }

  const { tsx, css } = showExportModal ? generateCode(effectiveSettings) : { tsx: '', css: '' }

  return (
    <div className="h-screen bg-neutral-950 overflow-hidden flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <BlobCanvas
          canvasRef={canvasRef}
          settings={effectiveSettings}
          selectedBlobId={selectedBlobId}
          showHandles={dials.showHandles}
          onSelectBlob={setSelectedBlobId}
          onUpdateBlob={updateBlob}
        />
      </div>

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

      {showExportModal && (
        <ExportModal tsx={tsx} css={css} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  )
}
