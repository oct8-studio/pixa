import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { generateQR } from './generate-qr'

async function decode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  return result?.data ?? null
}

// A tiny 1x1 solid-color PNG, used as a stand-in for a real logo/blend image.
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

// An 8x8 checkerboard PNG with real color variation, used to prove patternImage
// actually samples different colors per module rather than degenerating to a flat fill.
const CHECKERBOARD_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGElEQVR4nGNgYPj/n4EBC4ldFCw8CHUAAOkwP8EUI8zeAAAAAElFTkSuQmCC'

// An 8x8 quadrant PNG (blue / white / white / blue) — unlike CHECKERBOARD above, this
// one has genuine near-white regions. A prior bug let a ring eye landing on a light
// region get its whole finder-pattern center erased by an opaque redraw, breaking real
// decode; this fixture is what caught it.
const LIGHT_QUADRANT_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAGklEQVR4nGNgMJ4JR/+RAAMVJVA4SIqoKAEAQOl5IV4FNGQAAAAASUVORK5CYII='

describe('generateQR scan round-trip', () => {
  it('produces svg and a decodable png for a plain url', async () => {
    const { svg, toPng } = generateQR({ type: 'url', value: 'https://example.com' })
    expect(svg).toContain('<svg')
    const png = await toPng()
    const decoded = await decode(png)
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips wifi content', async () => {
    const { toPng } = generateQR({ type: 'wifi', ssid: 'HomeNet', password: 'secret123' })
    const decoded = await decode(await toPng())
    expect(decoded).toBe('WIFI:T:WPA;S:HomeNet;P:secret123;H:false;;')
  })

  it('round-trips styled QR codes (rounded/circle shapes, custom colors)', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { dotShape: 'rounded', eyeShape: 'circle', foregroundColor: '#003366', backgroundColor: '#eef2ff' }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips a QR code with a logo overlay at max size ratio (0.25)', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { logo: { dataUrl: TINY_PNG_DATA_URL, sizeRatio: 0.25 } }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips a QR code with an image blend at max opacity (0.25)', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { imageBlend: { dataUrl: TINY_PNG_DATA_URL, opacity: 0.25 } }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips a QR code with ring eyes', async () => {
    const { toPng } = generateQR({ type: 'url', value: 'https://example.com' }, { eyeShape: 'ring' })
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips a QR code with a patternImage', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { patternImage: { dataUrl: CHECKERBOARD_PNG_DATA_URL } }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips a QR code combining patternImage, ring eyes, and circle dots', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { patternImage: { dataUrl: CHECKERBOARD_PNG_DATA_URL }, eyeShape: 'ring', dotShape: 'circle' }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips ring eyes + patternImage when the image has near-white regions', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { patternImage: { dataUrl: LIGHT_QUADRANT_PNG_DATA_URL }, eyeShape: 'ring' }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips patternImage and imageBlend combined (independent layers, not mutually exclusive)', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      { patternImage: { dataUrl: TINY_PNG_DATA_URL }, imageBlend: { dataUrl: TINY_PNG_DATA_URL, opacity: 0.15 } }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })

  it('round-trips every background/branding feature combined at once', async () => {
    const { toPng } = generateQR(
      { type: 'url', value: 'https://example.com' },
      {
        patternImage: { dataUrl: TINY_PNG_DATA_URL },
        imageBlend: { dataUrl: TINY_PNG_DATA_URL, opacity: 0.15 },
        logo: { dataUrl: TINY_PNG_DATA_URL, sizeRatio: 0.2 },
        eyeShape: 'ring'
      }
    )
    const decoded = await decode(await toPng())
    expect(decoded).toBe('https://example.com')
  })
})
