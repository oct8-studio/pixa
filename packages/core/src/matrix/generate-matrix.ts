import QRCode from 'qrcode'

export function generateMatrix(payload: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): boolean[][] {
  const qr = QRCode.create(payload, { errorCorrectionLevel })
  const { size, data } = qr.modules
  const matrix: boolean[][] = []
  for (let row = 0; row < size; row++) {
    const rowCells: boolean[] = []
    for (let col = 0; col < size; col++) {
      rowCells.push(!!data[row * size + col])
    }
    matrix.push(rowCells)
  }
  return matrix
}
