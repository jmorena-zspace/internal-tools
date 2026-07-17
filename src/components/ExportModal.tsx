'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  tsx: string
  css: string
  onClose: () => void
}

export function ExportModal({ tsx, css, onClose }: Props) {
  const [tab, setTab]       = useState<'tsx' | 'css'>('tsx')
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = () => {
    navigator.clipboard.writeText(tab === 'tsx' ? tsx : css)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-neutral-950 border border-neutral-800 rounded-xl w-[680px] max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <h2 className="text-white text-sm font-semibold">Export Code</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 px-5">
          {(['tsx', 'css'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-2.5 font-mono border-b-2 transition-colors ${tab === t ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
            >
              {t === 'tsx' ? 'React Component (.tsx)' : 'CSS Class (.css)'}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-500 px-5 pt-3 pb-1">
          {tab === 'tsx'
            ? 'A React component using inline styles. Drop it into your project and wrap any section.'
            : 'Pure CSS using a ::before pseudo-element. Add the .blob-bg class to any section element.'}
        </p>

        {/* Code */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          <pre className="bg-neutral-900 rounded-lg p-4 text-xs text-emerald-300 font-mono whitespace-pre overflow-x-auto leading-relaxed">
            {tab === 'tsx' ? tsx : css}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-800">
          <button onClick={onClose} className="btn-ghost">Close</button>
          <button onClick={copy} className={`btn-primary min-w-[120px] transition-all ${copied ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}>
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
