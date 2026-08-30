export type ModuleShape = 'square' | 'rounded' | 'circle'
export type EyeShape = ModuleShape | 'ring'

export interface StyleOptions {
  foregroundColor?: string
  backgroundColor?: string
  dotShape?: ModuleShape
  eyeShape?: EyeShape
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio?: number }
  frame?: { text: string; color?: string; textColor?: string }
  imageBlend?: { dataUrl: string; opacity?: number }
  patternImage?: { dataUrl: string }
}

export interface ResolvedStyle {
  foregroundColor: string
  backgroundColor: string
  dotShape: ModuleShape
  eyeShape: EyeShape
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  logo?: { dataUrl: string; sizeRatio: number }
  frame?: { text: string; color: string; textColor: string }
  imageBlend?: { dataUrl: string; opacity: number }
  patternImage?: { dataUrl: string }
}
