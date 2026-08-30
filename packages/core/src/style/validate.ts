import type { StyleOptions, ResolvedStyle } from './types'

const MAX_LOGO_RATIO = 0.25
const DEFAULT_LOGO_RATIO = 0.2
const MAX_BLEND_OPACITY = 0.25
const DEFAULT_BLEND_OPACITY = 0.15

export function resolveStyle(style: StyleOptions = {}): ResolvedStyle {
  const hasLogoOrBlend = !!style.logo || !!style.imageBlend

  return {
    foregroundColor: style.foregroundColor ?? '#000000',
    backgroundColor: style.backgroundColor ?? '#ffffff',
    dotShape: style.dotShape ?? 'square',
    eyeShape: style.eyeShape ?? 'square',
    errorCorrectionLevel: hasLogoOrBlend ? 'H' : style.errorCorrectionLevel ?? 'M',
    logo: style.logo
      ? { dataUrl: style.logo.dataUrl, sizeRatio: Math.min(style.logo.sizeRatio ?? DEFAULT_LOGO_RATIO, MAX_LOGO_RATIO) }
      : undefined,
    frame: style.frame
      ? { text: style.frame.text, color: style.frame.color ?? '#000000', textColor: style.frame.textColor ?? '#ffffff' }
      : undefined,
    imageBlend: style.imageBlend
      ? { dataUrl: style.imageBlend.dataUrl, opacity: Math.min(style.imageBlend.opacity ?? DEFAULT_BLEND_OPACITY, MAX_BLEND_OPACITY) }
      : undefined
  }
}
