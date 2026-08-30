import type { QRContent } from './types'

function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function encodeWifi(content: Extract<QRContent, { type: 'wifi' }>): string {
  const security = content.security ?? 'WPA'
  const hidden = content.hidden ? 'true' : 'false'
  const password = content.password ? escapeWifiField(content.password) : ''
  return `WIFI:T:${security};S:${escapeWifiField(content.ssid)};P:${password};H:${hidden};;`
}
