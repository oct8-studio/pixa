import type { QRContent } from './types'

export function encodeVCard(content: Extract<QRContent, { type: 'vcard' }>): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  lines.push(`N:${content.lastName ?? ''};${content.firstName};;;`)
  lines.push(`FN:${content.firstName}${content.lastName ? ' ' + content.lastName : ''}`)
  if (content.org) lines.push(`ORG:${content.org}`)
  if (content.phone) lines.push(`TEL:${content.phone}`)
  if (content.email) lines.push(`EMAIL:${content.email}`)
  if (content.url) lines.push(`URL:${content.url}`)
  lines.push('END:VCARD')
  return lines.join('\n')
}
