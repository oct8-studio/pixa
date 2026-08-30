import { describe, it, expect } from 'vitest'
import { encodeEmail, encodeSms, encodeTel } from './contact-actions'

describe('contact action encoders', () => {
  it('encodes a mailto link with subject and body', () => {
    const result = encodeEmail({ type: 'email', address: 'a@b.com', subject: 'Hi', body: 'Hello there' })
    expect(result).toBe('mailto:a@b.com?subject=Hi&body=Hello+there')
  })

  it('encodes a mailto link with no params', () => {
    expect(encodeEmail({ type: 'email', address: 'a@b.com' })).toBe('mailto:a@b.com')
  })

  it('encodes an sms link with a message', () => {
    expect(encodeSms({ type: 'sms', phone: '+1234567890', message: 'call me' })).toBe(
      'sms:+1234567890?body=call%20me'
    )
  })

  it('encodes a tel link', () => {
    expect(encodeTel({ type: 'tel', phone: '+1234567890' })).toBe('tel:+1234567890')
  })
})
