import type { QRContent } from './types'

export function encodeEmail(content: Extract<QRContent, { type: 'email' }>): string {
  const params = new URLSearchParams()
  if (content.subject) params.set('subject', content.subject)
  if (content.body) params.set('body', content.body)
  const query = params.toString()
  return `mailto:${content.address}${query ? '?' + query : ''}`
}

export function encodeSms(content: Extract<QRContent, { type: 'sms' }>): string {
  return `sms:${content.phone}${content.message ? '?body=' + encodeURIComponent(content.message) : ''}`
}

export function encodeTel(content: Extract<QRContent, { type: 'tel' }>): string {
  return `tel:${content.phone}`
}
