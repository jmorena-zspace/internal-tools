export interface BlobConfig {
  id: string
  x: number      // 0–1 normalized left→right
  y: number      // 0–1 normalized top→bottom
  radius: number // normalized to canvas height (so blobs are circular)
  color: string  // hex
}

export interface GradientSettings {
  canvasWidth: number
  canvasHeight: number
  backgroundColor: string
  blobs: BlobConfig[]
  spread: number         // gaussian sigma multiplier — controls softness
  useGlobalColor: boolean
  globalColor: string
}
