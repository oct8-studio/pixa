'use client'

import { useMemo, useState } from 'react'
import type { QRContent, StyleOptions } from '@pixa/core'
import { ContentForm } from './components/ContentForm'
import { StylePanel } from './components/StylePanel'
import { QrPreview } from './components/QrPreview'
import { DownloadButtons } from './components/DownloadButtons'
import { generatePreview } from '../lib/qr'

export default function Page() {
  const [content, setContent] = useState<QRContent>({ type: 'url', value: 'https://example.com' })
  const [style, setStyle] = useState<StyleOptions>({})

  const { svg, error } = useMemo(() => {
    try {
      return { ...generatePreview(content, style), error: null as string | null }
    } catch (err) {
      return { svg: '', error: err instanceof Error ? err.message : 'Failed to generate QR code' }
    }
  }, [content, style])

  return (
    <main>
      <ContentForm onChange={setContent} />
      <StylePanel onChange={setStyle} />
      {svg ? (
        <>
          <QrPreview svg={svg} />
          <DownloadButtons svg={svg} />
        </>
      ) : (
        <p role="status">{error ? `Unable to generate a QR code: ${error}` : 'Enter some content to generate a QR code'}</p>
      )}
    </main>
  )
}
