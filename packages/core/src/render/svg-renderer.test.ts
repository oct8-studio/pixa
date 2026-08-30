import { describe, it, expect } from 'vitest'
import { renderSVG } from './svg-renderer'
import { resolveStyle } from '../style/validate'

const matrix = [
  [true, false, true],
  [false, true, false],
  [true, false, true]
]

describe('renderSVG', () => {
  it('produces a valid svg root element', () => {
    const svg = renderSVG(matrix, resolveStyle())
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
  })

  it('draws a background rect using the resolved background color', () => {
    const svg = renderSVG(matrix, resolveStyle({ backgroundColor: '#ff00ff' }))
    expect(svg).toContain('fill="#ff00ff"')
  })

  it('draws one rect per dark module using the resolved foreground color', () => {
    const svg = renderSVG(matrix, resolveStyle({ foregroundColor: '#123456' }))
    const darkModuleCount = matrix.flat().filter(Boolean).length
    const matches = svg.match(/fill="#123456"/g) ?? []
    expect(matches.length).toBe(darkModuleCount)
  })
})
