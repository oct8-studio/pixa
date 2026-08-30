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
    const resolved = resolveStyle({ logo: { dataUrl: 'data:image/png;base64,x', sizeRatio: 0.9 } })
    expect(resolved.logo?.sizeRatio).toBe(0.25)
  })

  it('caps image blend opacity at 0.25', () => {
    const resolved = resolveStyle({ imageBlend: { dataUrl: 'data:image/png;base64,x', opacity: 0.9 } })
    expect(resolved.imageBlend?.opacity).toBe(0.25)
  })

  it('throws on an invalid foregroundColor', () => {
    expect(() => resolveStyle({ foregroundColor: '#000" onload="alert(2)' })).toThrow(/Invalid color/)
  })

  it('throws on an invalid backgroundColor', () => {
    expect(() => resolveStyle({ backgroundColor: 'not-a-color' })).toThrow(/Invalid color/)
  })

  it('throws on an invalid frame color/textColor', () => {
    expect(() => resolveStyle({ frame: { text: 'Scan me', color: 'javascript:alert(1)' } })).toThrow(/Invalid color/)
    expect(() => resolveStyle({ frame: { text: 'Scan me', textColor: 'red;</style>' } })).toThrow(/Invalid color/)
  })

  it('accepts valid hex, rgb, and rgba colors', () => {
    expect(() => resolveStyle({ foregroundColor: '#fff' })).not.toThrow()
    expect(() => resolveStyle({ foregroundColor: '#ffffff' })).not.toThrow()
    expect(() => resolveStyle({ foregroundColor: '#ffffffaa' })).not.toThrow()
    expect(() => resolveStyle({ foregroundColor: 'rgb(0, 0, 0)' })).not.toThrow()
    expect(() => resolveStyle({ foregroundColor: 'rgba(0, 0, 0, 0.5)' })).not.toThrow()
  })

  it('throws when logo.dataUrl does not start with data:image/', () => {
    expect(() => resolveStyle({ logo: { dataUrl: 'https://evil.example/x.png' } })).toThrow(/logo\.dataUrl/)
  })

  it('throws when imageBlend.dataUrl does not start with data:image/', () => {
    expect(() => resolveStyle({ imageBlend: { dataUrl: 'http://evil.example/x.png' } })).toThrow(/imageBlend\.dataUrl/)
  })

  it('forces error correction to H when a patternImage is present', () => {
    const resolved = resolveStyle({ patternImage: { dataUrl: 'data:image/png;base64,x' }, errorCorrectionLevel: 'L' })
    expect(resolved.errorCorrectionLevel).toBe('H')
  })

  it('throws when patternImage.dataUrl does not start with data:image/', () => {
    expect(() => resolveStyle({ patternImage: { dataUrl: 'http://evil.example/x.png' } })).toThrow(/patternImage\.dataUrl/)
  })

  it('accepts eyeShape "ring" without throwing', () => {
    expect(() => resolveStyle({ eyeShape: 'ring' })).not.toThrow()
    expect(resolveStyle({ eyeShape: 'ring' }).eyeShape).toBe('ring')
  })

  it('clamps a negative sizeRatio/opacity to 0 instead of passing it through', () => {
    const resolved = resolveStyle({
      logo: { dataUrl: 'data:image/png;base64,x', sizeRatio: -3 },
      imageBlend: { dataUrl: 'data:image/png;base64,x', opacity: -3 }
    })
    expect(resolved.logo?.sizeRatio).toBe(0)
    expect(resolved.imageBlend?.opacity).toBe(0)
  })

  it('falls back to the default for NaN or Infinity sizeRatio/opacity', () => {
    const resolved = resolveStyle({
      logo: { dataUrl: 'data:image/png;base64,x', sizeRatio: NaN },
      imageBlend: { dataUrl: 'data:image/png;base64,x', opacity: Infinity }
    })
    expect(resolved.logo?.sizeRatio).toBe(0.2)
    expect(resolved.imageBlend?.opacity).toBe(0.15)
  })
})
