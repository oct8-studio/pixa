import { describe, it, expect } from 'vitest'
import { resolveStyle } from './validate'

describe('resolveStyle', () => {
  it('fills in defaults when no style given', () => {
    const resolved = resolveStyle()
    expect(resolved.foregroundColor).toBe('#000000')
    expect(resolved.backgroundColor).toBe('#ffffff')
    expect(resolved.dotShape).toBe('square')
    expect(resolved.eyeShape).toBe('square')
    expect(resolved.errorCorrectionLevel).toBe('M')
  })

  it('forces error correction to H when a logo is present', () => {
    const resolved = resolveStyle({ logo: { dataUrl: 'data:image/png;base64,x' }, errorCorrectionLevel: 'L' })
    expect(resolved.errorCorrectionLevel).toBe('H')
  })

  it('forces error correction to H when an image blend is present', () => {
    const resolved = resolveStyle({ imageBlend: { dataUrl: 'data:image/png;base64,x' } })
    expect(resolved.errorCorrectionLevel).toBe('H')
  })

  it('caps logo size ratio at 0.25', () => {
    const resolved = resolveStyle({ logo: { dataUrl: 'x', sizeRatio: 0.9 } })
    expect(resolved.logo?.sizeRatio).toBe(0.25)
  })

  it('caps image blend opacity at 0.25', () => {
    const resolved = resolveStyle({ imageBlend: { dataUrl: 'x', opacity: 0.9 } })
    expect(resolved.imageBlend?.opacity).toBe(0.25)
  })
})
