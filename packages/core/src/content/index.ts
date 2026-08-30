import type { QRContent } from './types'
import { encodeUrlOrText } from './url'
import { encodeWifi } from './wifi'
import { encodeVCard } from './vcard'
import { encodeEmail, encodeSms, encodeTel } from './contact-actions'

export type { QRContent } from './types'

export function encodeContent(content: QRContent): string {
  switch (content.type) {
    case 'url':
    case 'text':
      return encodeUrlOrText(content)
    case 'wifi':
      return encodeWifi(content)
    case 'vcard':
      return encodeVCard(content)
    case 'email':
      return encodeEmail(content)
    case 'sms':
      return encodeSms(content)
    case 'tel':
      return encodeTel(content)
  }
}
