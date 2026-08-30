export type ModuleShape = 'square' | 'rounded' | 'circle'

export interface StyleOptions {
  foregroundColor?: string
  backgroundColor?: string
  dotShape?: ModuleShape
  eyeShape?: ModuleShape
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio?: number }
  frame?: { text: string; color?: string; textColor?: string }
  imageBlend?: { dataUrl: string; opacity?: number }
}

export interface ResolvedStyle {
  foregroundColor: string
  backgroundColor: string
  dotShape: ModuleShape
  eyeShape: ModuleShape
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio: number }
  frame?: { text: string; color: string; textColor: string }
  imageBlend?: { dataUrl: string; opacity: number }
}
