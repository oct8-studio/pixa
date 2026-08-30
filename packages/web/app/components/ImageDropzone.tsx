'use client'

import { useRef, useState } from 'react'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ImageDropzone({
  label,
  hint,
  value,
  onChange
}: {
  label: string
  hint: string
  value: string | null
  onChange: (dataUrl: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    const dataUrl = await readFileAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div>
      <div
        className={`dropzone${isDragging ? ' is-dragging' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          void handleFile(e.dataTransfer.files[0])
        }}
      >
        {value ? (
          <img src={value} alt="" className="dropzone-thumb" />
        ) : (
          <div className="dropzone-thumb-empty" aria-hidden="true">
            +
          </div>
        )}
        <div className="dropzone-text">
          <strong>{label}</strong>
          <span>{hint}</span>
        </div>
        {value && (
          <button
            type="button"
            className="dropzone-remove"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
