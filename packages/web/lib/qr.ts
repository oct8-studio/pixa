import { generateQR, type QRContent, type StyleOptions } from '@pixa/core'

export function generatePreview(content: QRContent, style: StyleOptions = {}): { svg: string } {
  const { svg } = generateQR(content, style)
  return { svg }
}
