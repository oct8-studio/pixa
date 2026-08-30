'use client'

import { useState } from 'react'
import type { QRContent } from '@pixa/core'

const CONTENT_TYPES = ['url', 'wifi', 'vcard', 'email', 'sms', 'tel'] as const

export function ContentForm({ onChange }: { onChange: (content: QRContent) => void }) {
  const [type, setType] = useState<(typeof CONTENT_TYPES)[number]>('url')
  const [value, setValue] = useState('https://example.com')

  function emit(nextType: (typeof CONTENT_TYPES)[number], nextValue: string) {
    setType(nextType)
    setValue(nextValue)
    if (nextType === 'url') onChange({ type: 'url', value: nextValue })
    if (nextType === 'tel') onChange({ type: 'tel', phone: nextValue })
    if (nextType === 'wifi') onChange({ type: 'wifi', ssid: nextValue })
  }

  return (
    <div>
      <select value={type} onChange={(e) => emit(e.target.value as (typeof CONTENT_TYPES)[number], value)}>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input value={value} onChange={(e) => emit(type, e.target.value)} placeholder="Enter content" />
    </div>
  )
}
