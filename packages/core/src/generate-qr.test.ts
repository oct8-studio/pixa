import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { generateQR } from './generate-qr'

async function decode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  return result?.data ?? null
}

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
})
