import { describe, it, expect } from 'vitest'
import { generateMatrix } from './generate-matrix'

describe('generateMatrix', () => {
  it('produces a square boolean matrix', () => {
    const matrix = generateMatrix('https://example.com', 'M')
    expect(matrix.length).toBeGreaterThan(0)
    for (const row of matrix) {
      expect(row.length).toBe(matrix.length)
      for (const cell of row) expect(typeof cell).toBe('boolean')
    }
  })

  it('produces a larger matrix for level H than level L for the same payload class', () => {
    const low = generateMatrix('a'.repeat(100), 'L')
    const high = generateMatrix('a'.repeat(100), 'H')
    expect(high.length).toBeGreaterThanOrEqual(low.length)
  })
})
