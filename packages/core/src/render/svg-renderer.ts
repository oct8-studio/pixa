import type { ResolvedStyle, ModuleShape } from '../style/types'
import { isInFinderPattern } from './finder-pattern'

const MODULE_SIZE = 10
const QUIET_ZONE_MODULES = 4
const FINDER_BLOCK_MODULES = 7
// patternImage is layered over an opaque foregroundColor base at this opacity, never
// replacing it outright — a fully white/light region in the uploaded image would
// otherwise wash a module out to near-invisibility against the background and break
// scanning. This guarantees a contrast floor regardless of the uploaded image's colors.
const PATTERN_IMAGE_OVERLAY_OPACITY = 0.35
// Ring eyes get a much lower overlay opacity than body dots: the finder patterns are
// what a scanner uses just to locate the code, with zero Reed-Solomon error-correction
// tolerance for low contrast (unlike data modules, which have plenty). A ring landing on
// a light/white region of the uploaded image at PATTERN_IMAGE_OVERLAY_OPACITY was
// verified (real jsQR decode) to be too washed-out to detect reliably.
const RING_EYE_PATTERN_OVERLAY_OPACITY = 0.15

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function renderModule(x: number, y: number, size: number, shape: ModuleShape, fill: string, opacity?: number): string {
  const opacityAttr = opacity !== undefined ? ` opacity="${opacity}"` : ''
  if (shape === 'circle') {
    const cx = x + size / 2
    const cy = y + size / 2
    const r = size * 0.52
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${opacityAttr} />`
  }
  if (shape === 'rounded') {
    const radius = size * 0.3
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${fill}"${opacityAttr} />`
  }
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"${opacityAttr} />`
}

function renderRingEye(
  originRow: number,
  originCol: number,
  quietZone: number,
  moduleSize: number,
  ringFill: string,
  gapFill: string,
  overlayFill?: string
): string {
  const blockSize = FINDER_BLOCK_MODULES * moduleSize
  const cx = quietZone + originCol * moduleSize + blockSize / 2
  const cy = quietZone + originRow * moduleSize + blockSize / 2
  const outerRadius = blockSize / 2
  const gapRadius = outerRadius - moduleSize
  const innerRadius = outerRadius - moduleSize * 2

  // Each circle below is a filled disk, not a ring stroke — the visible "ring" shape
  // only emerges from later, smaller disks painting over earlier, larger ones. Any
  // extra disk drawn after this base sequence (e.g. an overlay tint) must never redraw
  // the gap circle, or it will silently erase the inner dot painted just before it.
  let svg =
    `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${ringFill}" />` +
    `<circle cx="${cx}" cy="${cy}" r="${gapRadius}" fill="${gapFill}" />` +
    `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${ringFill}" />`

  if (overlayFill) {
    // Both tint disks land on top of the fully-formed base ring above; the outer one's
    // radius is bigger than the gap, so it also lightly tints the gap band, which is
    // fine — a light gap stays visibly light even after a low-opacity tint.
    svg +=
      `<circle cx="${cx}" cy="${cy}" r="${outerRadius}" fill="${overlayFill}" opacity="${RING_EYE_PATTERN_OVERLAY_OPACITY}" />` +
      `<circle cx="${cx}" cy="${cy}" r="${innerRadius}" fill="${overlayFill}" opacity="${RING_EYE_PATTERN_OVERLAY_OPACITY}" />`
  }

  return svg
}

export function renderSVG(matrix: boolean[][], style: ResolvedStyle): string {
  const gridSize = matrix.length
  const quietZone = QUIET_ZONE_MODULES * MODULE_SIZE
  const dimension = gridSize * MODULE_SIZE + quietZone * 2
  const contentSize = gridSize * MODULE_SIZE

  const baseFill = escapeXml(style.foregroundColor)
  let patternDefs = ''
  let patternOverlayFill: string | undefined
  if (style.patternImage) {
    patternOverlayFill = 'url(#patternImage)'
    patternDefs =
      `<defs><pattern id="patternImage" patternUnits="userSpaceOnUse" x="${quietZone}" y="${quietZone}" width="${contentSize}" height="${contentSize}">` +
      `<image href="${escapeXml(style.patternImage.dataUrl)}" width="${contentSize}" height="${contentSize}" preserveAspectRatio="xMidYMid slice" />` +
      `</pattern></defs>`
  }

  let blendLayer = ''
  if (style.imageBlend) {
    blendLayer = `<image href="${escapeXml(style.imageBlend.dataUrl)}" x="${quietZone}" y="${quietZone}" width="${contentSize}" height="${contentSize}" opacity="${style.imageBlend.opacity}" preserveAspectRatio="xMidYMid slice" />`
  }

  const useRingEyes = style.eyeShape === 'ring'

  let modules = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!matrix[row][col]) continue
      const inFinder = isInFinderPattern(row, col, gridSize)
      if (inFinder && useRingEyes) continue
      const x = quietZone + col * MODULE_SIZE
      const y = quietZone + row * MODULE_SIZE
      const shape = inFinder ? (style.eyeShape as ModuleShape) : style.dotShape
      modules += renderModule(x, y, MODULE_SIZE, shape, baseFill)
      if (patternOverlayFill) {
        modules += renderModule(x, y, MODULE_SIZE, shape, patternOverlayFill, PATTERN_IMAGE_OVERLAY_OPACITY)
      }
    }
  }

  let ringEyeLayer = ''
  if (useRingEyes) {
    const origins: Array<[number, number]> = [
      [0, 0],
      [0, gridSize - FINDER_BLOCK_MODULES],
      [gridSize - FINDER_BLOCK_MODULES, 0]
    ]
    for (const [originRow, originCol] of origins) {
      ringEyeLayer += renderRingEye(
        originRow,
        originCol,
        quietZone,
        MODULE_SIZE,
        baseFill,
        escapeXml(style.backgroundColor),
        patternOverlayFill
      )
    }
  }

  let logoLayer = ''
  if (style.logo) {
    const logoSize = gridSize * MODULE_SIZE * style.logo.sizeRatio
    const logoX = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const logoY = quietZone + (gridSize * MODULE_SIZE - logoSize) / 2
    const padding = 4
    logoLayer =
      `<rect x="${logoX - padding}" y="${logoY - padding}" width="${logoSize + padding * 2}" height="${logoSize + padding * 2}" fill="${escapeXml(style.backgroundColor)}" />` +
      `<image href="${escapeXml(style.logo.dataUrl)}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" />`
  }

  const frameHeight = 40
  let frameLayer = ''
  if (style.frame) {
    frameLayer =
      `<rect x="0" y="${dimension}" width="${dimension}" height="${frameHeight}" fill="${escapeXml(style.frame.color)}" />` +
      `<text x="${dimension / 2}" y="${dimension + frameHeight / 2 + 6}" text-anchor="middle" font-size="20" fill="${escapeXml(style.frame.textColor)}">${escapeXml(style.frame.text)}</text>`
  }

  const totalHeight = dimension + (style.frame ? frameHeight : 0)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${totalHeight}" viewBox="0 0 ${dimension} ${totalHeight}">` +
    patternDefs +
    `<rect x="0" y="0" width="${dimension}" height="${dimension}" fill="${escapeXml(style.backgroundColor)}" />` +
    blendLayer +
    modules +
    ringEyeLayer +
    logoLayer +
    frameLayer +
    `</svg>`
  )
}
