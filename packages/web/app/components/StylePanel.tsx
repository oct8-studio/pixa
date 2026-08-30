'use client'

import { useState } from 'react'
import type { StyleOptions, ModuleShape } from '@pixa/core'

const SHAPES: ModuleShape[] = ['square', 'rounded', 'circle']

export function StylePanel({ onChange }: { onChange: (style: StyleOptions) => void }) {
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [dotShape, setDotShape] = useState<ModuleShape>('square')

  function emit(next: Partial<{ foregroundColor: string; backgroundColor: string; dotShape: ModuleShape }>) {
    const merged = { foregroundColor, backgroundColor, dotShape, ...next }
    setForegroundColor(merged.foregroundColor)
    setBackgroundColor(merged.backgroundColor)
    setDotShape(merged.dotShape)
    onChange({ foregroundColor: merged.foregroundColor, backgroundColor: merged.backgroundColor, dotShape: merged.dotShape })
  }

  return (
    <div>
      <label>
        Foreground
        <input type="color" value={foregroundColor} onChange={(e) => emit({ foregroundColor: e.target.value })} />
      </label>
      <label>
        Background
        <input type="color" value={backgroundColor} onChange={(e) => emit({ backgroundColor: e.target.value })} />
      </label>
      <select value={dotShape} onChange={(e) => emit({ dotShape: e.target.value as ModuleShape })}>
        {SHAPES.map((shape) => (
          <option key={shape} value={shape}>
            {shape}
          </option>
        ))}
      </select>
    </div>
  )
}
