import type { QRContent } from './types'

export function encodeUrlOrText(content: Extract<QRContent, { type: 'url' | 'text' }>): string {
  return content.value
}
