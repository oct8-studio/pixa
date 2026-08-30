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

describe('renderSVG shapes', () => {
  it('renders circle modules as <circle> when dotShape is circle', () => {
    // Create a 25x25 matrix with a module outside finder patterns to test dotShape
    const largeMatrix: boolean[][] = Array.from({ length: 25 }, (_, row) =>
      Array.from({ length: 25 }, (_, col) => row === 12 && col === 12)
    )
    const svg = renderSVG(largeMatrix, resolveStyle({ dotShape: 'circle' }))
    expect(svg).toContain('<circle')
    // Sanity: still has a background rect
    const rectCount = (svg.match(/<rect/g) ?? []).length
    expect(rectCount).toBeGreaterThanOrEqual(1)
  })

  it('renders rounded modules with rx/ry when dotShape is rounded', () => {
    // Create a 25x25 matrix with a module outside finder patterns to test dotShape
    const largeMatrix: boolean[][] = Array.from({ length: 25 }, (_, row) =>
      Array.from({ length: 25 }, (_, col) => row === 12 && col === 12)
    )
    const svg = renderSVG(largeMatrix, resolveStyle({ dotShape: 'rounded' }))
    expect(svg).toContain('rx=')
  })

  it('applies eyeShape only to finder-pattern modules, dotShape elsewhere', () => {
    const bigMatrix: boolean[][] = Array.from({ length: 25 }, (_, row) =>
      Array.from({ length: 25 }, (_, col) => row === 12 && col === 12)
    )
    // force the single dark module (12,12) to be inside neither finder pattern for a 25x25 grid,
    // and mark one finder-pattern cell dark too
    bigMatrix[0][0] = true
    const svg = renderSVG(bigMatrix, resolveStyle({ dotShape: 'circle', eyeShape: 'square' }))
    // The center dark module (dotShape) should render as a circle, and we should also see at least one rect module (the eye).
    expect(svg).toContain('<circle')
    const rectModuleCount = (svg.match(/<rect/g) ?? []).length
    expect(rectModuleCount).toBeGreaterThanOrEqual(2) // background rect + at least one square eye module
  })
})

describe('renderSVG logo and frame', () => {
  it('overlays a logo image centered on the code', () => {
    const svg = renderSVG(matrix, resolveStyle({ logo: { dataUrl: 'data:image/png;base64,abc' } }))
    expect(svg).toContain('<image href="data:image/png;base64,abc"')
  })

  it('adds a frame band with CTA text below the code', () => {
    const svg = renderSVG(matrix, resolveStyle({ frame: { text: 'Scan me' } }))
    expect(svg).toContain('Scan me')
    expect(svg).toContain('<text')
  })

  it('increases total svg height by 40 when a frame is present', () => {
    const withoutFrame = renderSVG(matrix, resolveStyle())
    const withFrame = renderSVG(matrix, resolveStyle({ frame: { text: 'Scan me' } }))
    const heightOf = (svg: string) => Number(svg.match(/height="(\d+)"/)?.[1])
    expect(heightOf(withFrame)).toBe(heightOf(withoutFrame) + 40)
  })
})

describe('renderSVG image blend', () => {
  it('renders the blend image behind the modules at the resolved opacity', () => {
    const svg = renderSVG(matrix, resolveStyle({ imageBlend: { dataUrl: 'data:image/png;base64,xyz', opacity: 0.15 } }))
    expect(svg).toContain('<image href="data:image/png;base64,xyz"')
    expect(svg).toContain('opacity="0.15"')
    const blendIndex = svg.indexOf('data:image/png;base64,xyz')
    const firstModuleIndex = svg.indexOf('fill="#000000"', blendIndex)
    expect(blendIndex).toBeLessThan(firstModuleIndex)
  })
})
