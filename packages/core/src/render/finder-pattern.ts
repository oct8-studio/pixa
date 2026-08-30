export function isInFinderPattern(row: number, col: number, size: number): boolean {
  const inTopLeft = row < 8 && col < 8
  const inTopRight = row < 8 && col >= size - 8
  const inBottomLeft = row >= size - 8 && col < 8
  return inTopLeft || inTopRight || inBottomLeft
}
