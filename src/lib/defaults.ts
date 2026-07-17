import type { GradientSettings } from './types'

export const DEFAULT_SETTINGS: GradientSettings = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  backgroundColor: '#002647',
  spread: 0.7,
  useGlobalColor: true,
  globalColor: '#1949a4',
  blobs: [
    { id: 'a', x: 0.028125, y: 0.7683189189764985, radius: 0.5295510328038131, color: '#6366f1' },
    { id: 'b', x: 1, y: 0.2824414540827443, radius: 0.47948487475995877, color: '#ec4899' },
  ],
}
