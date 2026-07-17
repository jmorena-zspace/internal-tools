'use client'

import type { GradientSettings, BlobConfig } from '@/lib/types'
import { generateId, nextBlobColor } from '@/lib/colorUtils'

interface Props {
  settings: GradientSettings
  selectedBlobId: string | null
  onSelectBlob: (id: string | null) => void
  onChange: (s: GradientSettings) => void
  onImport: () => void
  onExportJSON: () => void
  onExportPNG: () => void
  onExportCode: () => void
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${on ? 'bg-indigo-500' : 'bg-neutral-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`}
      />
    </button>
  )
}

export function Sidebar({ settings, selectedBlobId, onSelectBlob, onChange, onImport, onExportJSON, onExportPNG, onExportCode }: Props) {
  const set  = (patch: Partial<GradientSettings>) => onChange({ ...settings, ...patch })
  const setBlob = (id: string, patch: Partial<BlobConfig>) =>
    set({ blobs: settings.blobs.map(b => b.id === id ? { ...b, ...patch } : b) })

  const addBlob = () => {
    const newBlob: BlobConfig = {
      id: generateId(),
      x: 0.25 + Math.random() * 0.5,
      y: 0.25 + Math.random() * 0.5,
      radius: 0.18 + Math.random() * 0.1,
      color: nextBlobColor(),
    }
    set({ blobs: [...settings.blobs, newBlob] })
  }

  const removeBlob = (id: string) => {
    if (settings.blobs.length <= 1) return
    set({ blobs: settings.blobs.filter(b => b.id !== id) })
    if (selectedBlobId === id) onSelectBlob(null)
  }

  return (
    <aside className="w-64 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <h1 className="text-white text-sm font-semibold tracking-wide">Blob Gradient</h1>
        <p className="text-neutral-500 text-xs mt-0.5">WebGL shader builder</p>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Canvas dimensions */}
        <section>
          <label className="section-label">Canvas</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="field-label">W</p>
              <input
                type="number" min={100} max={8000}
                value={settings.canvasWidth}
                onChange={e => set({ canvasWidth: Math.max(100, +e.target.value) })}
                className="field-input"
              />
            </div>
            <div className="flex-1">
              <p className="field-label">H</p>
              <input
                type="number" min={100} max={8000}
                value={settings.canvasHeight}
                onChange={e => set({ canvasHeight: Math.max(100, +e.target.value) })}
                className="field-input"
              />
            </div>
          </div>
        </section>

        {/* Background */}
        <section>
          <label className="section-label">Background</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={e => set({ backgroundColor: e.target.value })}
              className="color-swatch"
            />
            <span className="text-neutral-400 text-xs font-mono">{settings.backgroundColor}</span>
          </div>
        </section>

        {/* Spread */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <label className="section-label mb-0">Blur / Spread</label>
            <span className="text-neutral-500 text-xs font-mono">{settings.spread.toFixed(2)}</span>
          </div>
          <input
            type="range" min={0.2} max={3} step={0.01}
            value={settings.spread}
            onChange={e => set({ spread: +e.target.value })}
            className="w-full accent-indigo-500"
          />
        </section>

        {/* Global color */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label mb-0">Global Color</label>
            <Toggle on={settings.useGlobalColor} onToggle={() => set({ useGlobalColor: !settings.useGlobalColor })} />
          </div>
          {settings.useGlobalColor && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.globalColor}
                onChange={e => set({ globalColor: e.target.value })}
                className="color-swatch"
              />
              <span className="text-neutral-400 text-xs font-mono">{settings.globalColor}</span>
            </div>
          )}
        </section>

        {/* Blobs list */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="section-label mb-0">Blobs ({settings.blobs.length})</label>
            <button onClick={addBlob} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              + Add
            </button>
          </div>
          <div className="space-y-1">
            {settings.blobs.map((blob, i) => {
              const isSelected = blob.id === selectedBlobId
              return (
                <div
                  key={blob.id}
                  onClick={() => onSelectBlob(isSelected ? null : blob.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-neutral-800' : 'hover:bg-neutral-900'}`}
                >
                  {settings.useGlobalColor ? (
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: settings.globalColor }} />
                  ) : (
                    <input
                      type="color"
                      value={blob.color}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); setBlob(blob.id, { color: e.target.value }) }}
                      className="w-4 h-4 rounded-full border-0 p-0 cursor-pointer bg-transparent shrink-0"
                      style={{ appearance: 'none' }}
                    />
                  )}
                  <span className="text-xs text-neutral-300 flex-1">Blob {i + 1}</span>
                  <span className="text-xs text-neutral-600 font-mono tabular-nums">
                    {(blob.x * 100).toFixed(0)},{(blob.y * 100).toFixed(0)}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); removeBlob(blob.id) }}
                    className="text-neutral-700 hover:text-red-400 transition-colors text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
          {selectedBlobId && (
            <p className="text-neutral-600 text-xs mt-2">Drag blob to move · drag white handle to resize</p>
          )}
        </section>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-neutral-800 space-y-2">
        <div className="flex gap-2">
          <button onClick={onImport}   className="btn-ghost flex-1">Import</button>
          <button onClick={onExportJSON} className="btn-ghost flex-1">Save JSON</button>
        </div>
        <button onClick={onExportPNG}  className="btn-ghost w-full">Export PNG</button>
        <button onClick={onExportCode} className="btn-primary w-full">Export Code</button>
      </div>
    </aside>
  )
}
