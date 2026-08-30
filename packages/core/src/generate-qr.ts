import { encodeContent, type QRContent } from './content'
import { generateMatrix } from './matrix/generate-matrix'
import { resolveStyle } from './style/validate'
import type { StyleOptions } from './style/types'
import { renderSVG } from './render/svg-renderer'

export function generateQR(content: QRContent, style: StyleOptions = {}) {
  const payload = encodeContent(content)
  const resolvedStyle = resolveStyle(style)
  const matrix = generateMatrix(payload, resolvedStyle.errorCorrectionLevel)
  const svg = renderSVG(matrix, resolvedStyle)

  return {
    svg,
    toPng: async (): Promise<Buffer> => {
      const sharp = await import('sharp').then(m => m.default)
      return sharp(Buffer.from(svg)).png().toBuffer()
    }
  }
}
