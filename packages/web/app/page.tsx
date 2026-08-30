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
    <div className="app-shell">
      <header className="app-header">
        <h1>pixa</h1>
        <p>Build customized, brandable QR codes — free, open source, no account needed.</p>
      </header>
      <main className="app-body">
        <div className="editor-column">
          <ContentForm onChange={setContent} />
          <StylePanel onChange={setStyle} />
        </div>
        <div className="preview-column">
          {svg ? (
            <>
              <QrPreview svg={svg} />
              <DownloadButtons svg={svg} />
            </>
          ) : (
            <div className="preview-frame">
              <p className={`preview-status${error ? ' is-error' : ''}`} role="status">
                {error ? `Unable to generate a QR code: ${error}` : 'Enter some content to generate a QR code'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
