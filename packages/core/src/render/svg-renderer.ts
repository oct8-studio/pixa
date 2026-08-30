import type { ResolvedStyle, ModuleShape } from '../style/types'
import { isInFinderPattern } from './finder-pattern'

const MODULE_SIZE = 10
const QUIET_ZONE_MODULES = 4

function renderModule(x: number, y: number, size: number, shape: ModuleShape, color: string): string {
  if (shape === 'circle') {
    const cx = x + size / 2
    const cy = y + size / 2
    const r = size * 0.52
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" />`
  }
  if (shape === 'rounded') {
    const radius = size * 0.3
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${color}" />`
  }
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" />`
}

export function renderSVG(matrix: boolean[][], style: ResolvedStyle): string {
  const gridSize = matrix.length
  const quietZone = QUIET_ZONE_MODULES * MODULE_SIZE
  const dimension = gridSize * MODULE_SIZE + quietZone * 2

  let blendLayer = ''
  if (style.imageBlend) {
    const contentSize = gridSize * MODULE_SIZE
    blendLayer = `<image href="${style.imageBlend.dataUrl}" x="${quietZone}" y="${quietZone}" width="${contentSize}" height="${contentSize}" opacity="${style.imageBlend.opacity}" preserveAspectRatio="xMidYMid slice" />`
  }

  let modules = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!matrix[row][col]) continue
      const x = quietZone + col * MODULE_SIZE
      const y = quietZone + row * MODULE_SIZE
      const shape = isInFinderPattern(row, col, gridSize) ? style.eyeShape : style.dotShape
      modules += renderModule(x, y, MODULE_SIZE, shape, style.foregroundColor)
    }
  }

  let logoLayer = ''
  if (style.logo) {
    const logoSize = gridSize * MODULE_SIZE * style.logo.sizeRatio
    const logoX = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const logoY = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const padding = 4
    logoLayer =
      `<rect x="${logoX - padding}" y="${logoY - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="${style.backgroundColor}" />` +
      `<image href="${style.logo.dataUrl}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" />`
  }

  const frameHeight = 40
  let frameLayer = ''
  if (style.frame) {
    frameLayer =
      `<rect x="0" y="${dimension}" width="${dimension}" height="${frameHeight}" fill="${style.frame.color}" />` +
      `<text x="${dimension / 2}" y="${dimension + frameHeight / 2 + 6}" text-anchor="middle" font-size="20" fill="${style.frame.textColor}">${style.frame.text}</text>`
  }

  const totalHeight = dimension + (style.frame ? frameHeight : 0)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${totalHeight}" viewBox="0 0 ${dimension} ${totalHeight}">` +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${style.backgroundColor}" />` +
    blendLayer +
    modules +
    logoLayer +
    frameLayer +
    `</svg>`
  )
}
