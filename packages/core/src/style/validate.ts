import type { StyleOptions, ResolvedStyle } from './types'

const MAX_LOGO_RATIO = 0.25
const DEFAULT_LOGO_RATIO = 0.2
const MAX_BLEND_OPACITY = 0.25
const DEFAULT_BLEND_OPACITY = 0.15

const COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s%]+\)$/

function validateColor(value: string, label: string): string {
  if (!COLOR_PATTERN.test(value)) {
    throw new Error(`Invalid color: ${value} (${label})`)
  }
  return value
}

function validateDataUrl(value: string, label: string): string {
  if (!value.startsWith('data:image/')) {
    throw new Error(`Invalid ${label}: must start with "data:image/"`)
  }
  return value
}

function clampRatio(value: number | undefined, defaultValue: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return defaultValue
  return Math.min(Math.max(value, 0), max)
}

export function resolveStyle(style: StyleOptions = {}): ResolvedStyle {
  const hasLogoOrBlend = !!style.logo || !!style.imageBlend || !!style.patternImage

  const foregroundColor = validateColor(style.foregroundColor ?? '#000000', 'foregroundColor')
  const backgroundColor = validateColor(style.backgroundColor ?? '#ffffff', 'backgroundColor')

  return {
    foregroundColor,
    backgroundColor,
    dotShape: style.dotShape ?? 'square',
    eyeShape: style.eyeShape ?? 'square',
    errorCorrectionLevel: hasLogoOrBlend ? 'H' : style.errorCorrectionLevel ?? 'M',
    patternImage: style.patternImage
      ? { dataUrl: validateDataUrl(style.patternImage.dataUrl, 'patternImage.dataUrl') }
      : undefined,
    logo: style.logo
      ? {
          dataUrl: validateDataUrl(style.logo.dataUrl, 'logo.dataUrl'),
          sizeRatio: clampRatio(style.logo.sizeRatio, DEFAULT_LOGO_RATIO, MAX_LOGO_RATIO)
        }
      : undefined,
    frame: style.frame
      ? {
          text: style.frame.text,
          color: validateColor(style.frame.color ?? '#000000', 'frame.color'),
          textColor: validateColor(style.frame.textColor ?? '#ffffff', 'frame.textColor')
        }
      : undefined,
    imageBlend: style.imageBlend
      ? {
          dataUrl: validateDataUrl(style.imageBlend.dataUrl, 'imageBlend.dataUrl'),
          opacity: clampRatio(style.imageBlend.opacity, DEFAULT_BLEND_OPACITY, MAX_BLEND_OPACITY)
        }
      : undefined
  }
}
