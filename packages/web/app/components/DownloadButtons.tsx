'use client'

export function DownloadButtons({ svg }: { svg: string }) {
  function downloadSvg() {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadPng() {
    const canvas = document.createElement('canvas')
    const img = new Image()
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)

    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = svgUrl
    })

    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    URL.revokeObjectURL(svgUrl)

    canvas.toBlob((blob) => {
      if (!blob) return
      const pngUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = 'qr-code.png'
      a.click()
      URL.revokeObjectURL(pngUrl)
    }, 'image/png')
  }

  return (
    <div>
      <button data-testid="download-svg" onClick={downloadSvg}>
        Download SVG
      </button>
      <button data-testid="download-png" onClick={downloadPng}>
        Download PNG
      </button>
    </div>
  )
}
