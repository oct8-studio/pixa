import { describe, it, expect } from 'vitest'
import { encodeVCard } from './vcard'

describe('encodeVCard', () => {
  it('encodes a full contact card', () => {
    const result = encodeVCard({
      type: 'vcard',
      firstName: 'Ada',
      lastName: 'Lovelace',
      org: 'Analytical Engines Inc',
      phone: '+1234567890',
      email: 'ada@example.com',
      url: 'https://example.com'
    })
    expect(result).toBe(
      'BEGIN:VCARD\nVERSION:3.0\nN:Lovelace;Ada;;;\nFN:Ada Lovelace\nORG:Analytical Engines Inc\nTEL:+1234567890\nEMAIL:ada@example.com\nURL:https://example.com\nEND:VCARD'
    )
  })

  it('omits optional fields when absent', () => {
    const result = encodeVCard({ type: 'vcard', firstName: 'Ada' })
    expect(result).toBe('BEGIN:VCARD\nVERSION:3.0\nN:;Ada;;;\nFN:Ada\nEND:VCARD')
  })
})
