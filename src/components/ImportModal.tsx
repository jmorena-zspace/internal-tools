'use client'

import { useEffect, useRef, useState } from 'react'
import type { GradientSettings } from '@/lib/types'

interface Props {
  onImport: (settings: GradientSettings) => void
  onClose: () => void
}

export function ImportModal({ onImport, onClose }: Props) {
  const [text, setText]   = useState('')
  const [error, setError] = useState('')
  const fileRef           = useRef<HTMLInputElement>(null)
  const textareaRef       = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const parse = (raw: string) => {
    try {
      const parsed = JSON.parse(raw)
      if (!parsed.blobs || !Array.isArray(parsed.blobs)) throw new Error('Missing blobs array')
      onImport(parsed as GradientSettings)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const handleApply = () => parse(text)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = ev.target?.result as string
      setText(raw)
      parse(raw)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-950 border border-neutral-800 rounded-xl w-[560px] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-white text-sm font-semibold">Import Settings</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-2">Paste JSON</label>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); setError('') }}
              placeholder='{ "blobs": [...], "backgroundColor": "#08080f", ... }'
              rows={10}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2.5 text-xs text-neutral-200 font-mono resize-none focus:outline-none transition-colors placeholder:text-neutral-700"
            />
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-600 text-xs">or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 text-xs transition-colors"
          >
            Choose a .json file
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-800">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleApply}
            disabled={!text.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
