import { describe, it, expect } from 'vitest'
import { encodeContent } from './index'

describe('encodeContent', () => {
  it('dispatches url content to the raw value', () => {
    expect(encodeContent({ type: 'url', value: 'https://example.com' })).toBe('https://example.com')
  })

  it('dispatches wifi content to WIFI: format', () => {
    expect(encodeContent({ type: 'wifi', ssid: 'Net' })).toContain('WIFI:T:WPA;S:Net;')
  })

  it('dispatches tel content to tel: format', () => {
    expect(encodeContent({ type: 'tel', phone: '+1' })).toBe('tel:+1')
  })
})
