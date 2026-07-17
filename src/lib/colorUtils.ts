export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

const PALETTE = [
  '#6366f1', '#ec4899', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#f97316',
]
let paletteIdx = 0

export function nextBlobColor(): string {
  return PALETTE[paletteIdx++ % PALETTE.length]
}
