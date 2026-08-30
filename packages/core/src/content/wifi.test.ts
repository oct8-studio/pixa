import { describe, it, expect } from 'vitest'
import { encodeWifi } from './wifi'

describe('encodeWifi', () => {
  it('encodes a basic WPA network', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'HomeNet', password: 'secret123', security: 'WPA' })
    expect(result).toBe('WIFI:T:WPA;S:HomeNet;P:secret123;H:false;;')
  })

  it('escapes special characters in ssid and password', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'Home;Net', password: 'p:a\\ss', security: 'WPA' })
    expect(result).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:a\\\\ss;H:false;;')
  })

  it('defaults security to WPA and marks hidden networks', () => {
    const result = encodeWifi({ type: 'wifi', ssid: 'Guest', hidden: true })
    expect(result).toBe('WIFI:T:WPA;S:Guest;P:;H:true;;')
  })
})
