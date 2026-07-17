import type { GradientSettings } from './types'

export function exportPNG(canvas: HTMLCanvasElement, filename = 'gradient.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function exportSettingsJSON(settings: GradientSettings) {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = 'gradient-settings.json'
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

export function importSettingsJSON(file: File): Promise<GradientSettings> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target?.result as string)) }
      catch { reject(new Error('Invalid settings file')) }
    }
    reader.readAsText(file)
  })
}

export function generateCode(settings: GradientSettings): { tsx: string; css: string } {
  const { backgroundColor, blobs, spread, useGlobalColor, globalColor } = settings

  const blurPx = Math.round(spread * 60)

  const gradients = blobs.map(b => {
    const color = useGlobalColor ? globalColor : b.color
    const x = Math.round(b.x * 100)
    const y = Math.round(b.y * 100)
    // radius is normalized to height; CSS circle percentages are relative to the element
    const r = Math.round(b.radius * 130)
    return `    radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent ${r}%)`
  }).join(',\n')

  const tsx = [
    `// BlobBackground.tsx`,
    `// Drop this component into your Next.js project and wrap your section content with it.`,
    ``,
    `export function BlobBackground({`,
    `  children,`,
    `  className = '',`,
    `}: {`,
    `  children: React.ReactNode`,
    `  className?: string`,
    `}) {`,
    `  return (`,
    `    <div`,
    `      className={className}`,
    `      style={{ position: 'relative', background: '${backgroundColor}', overflow: 'hidden' }}`,
    `    >`,
    `      {/* Blob layer — aria-hidden so screen readers skip it */}`,
    `      <div`,
    `        aria-hidden`,
    `        style={{`,
    `          position: 'absolute',`,
    `          inset: '-10%',`,
    `          pointerEvents: 'none',`,
    `          filter: 'blur(${blurPx}px)',`,
    `          background: \``,
    gradients + '`',
    `          ,`,
    `        }}`,
    `      />`,
    `      {children}`,
    `    </div>`,
    `  )`,
    `}`,
  ].join('\n')

  const css = [
    `.blob-bg {`,
    `  position: relative;`,
    `  background: ${backgroundColor};`,
    `  overflow: hidden;`,
    `}`,
    ``,
    `.blob-bg::before {`,
    `  content: '';`,
    `  position: absolute;`,
    `  inset: -10%;`,
    `  pointer-events: none;`,
    `  filter: blur(${blurPx}px);`,
    `  background:`,
    gradients + ';',
    `}`,
  ].join('\n')

  return { tsx, css }
}
