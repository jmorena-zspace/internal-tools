import type { GradientSettings } from './types'

export const DEFAULT_SETTINGS: GradientSettings = {
  canvasWidth: 1200,
  canvasHeight: 630,
  backgroundColor: '#08080f',
  spread: 1.2,
  useGlobalColor: false,
  globalColor: '#6366f1',
  blobs: [
    { id: 'a', x: 0.28, y: 0.45, radius: 0.30, color: '#6366f1' },
    { id: 'b', x: 0.72, y: 0.58, radius: 0.24, color: '#ec4899' },
    { id: 'c', x: 0.50, y: 0.18, radius: 0.22, color: '#06b6d4' },
  ],
}
