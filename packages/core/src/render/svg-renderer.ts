import type { ResolvedStyle } from '../style/types'
import { isInFinderPattern } from './finder-pattern'

const MODULE_SIZE = 10
const QUIET_ZONE_MODULES = 4

function renderModuleRect(x: number, y: number, size: number, color: string): string {
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" />`
}

export function renderSVG(matrix: boolean[][], style: ResolvedStyle): string {
  const gridSize = matrix.length
  const quietZone = QUIET_ZONE_MODULES * MODULE_SIZE
  const dimension = gridSize * MODULE_SIZE + quietZone * 2

  let modules = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!matrix[row][col]) continue
      const x = quietZone + col * MODULE_SIZE
      const y = quietZone + row * MODULE_SIZE
      modules += renderModuleRect(x, y, MODULE_SIZE, style.foregroundColor)
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 ${dimension} ${dimension}">` +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${style.backgroundColor}" />` +
    modules +
    `</svg>`
  )
}
