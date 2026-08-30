'use client'

import { useState } from 'react'
import type { StyleOptions, ModuleShape } from '@pixa/core'
import { ImageDropzone } from './ImageDropzone'

const SHAPES: ModuleShape[] = ['square', 'rounded', 'circle']

interface StyleState {
  foregroundColor: string
  backgroundColor: string
  dotShape: ModuleShape
  eyeShape: ModuleShape
  logoDataUrl: string | null
  logoSizeRatio: number
  frameEnabled: boolean
  frameText: string
  frameColor: string
  frameTextColor: string
  blendDataUrl: string | null
  blendOpacity: number
}

const INITIAL_STATE: StyleState = {
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  dotShape: 'square',
  eyeShape: 'square',
  logoDataUrl: null,
  logoSizeRatio: 0.2,
  frameEnabled: false,
  frameText: 'Scan me',
  frameColor: '#000000',
  frameTextColor: '#ffffff',
  blendDataUrl: null,
  blendOpacity: 0.15
}

function buildStyle(s: StyleState): StyleOptions {
  return {
    foregroundColor: s.foregroundColor,
    backgroundColor: s.backgroundColor,
    dotShape: s.dotShape,
    eyeShape: s.eyeShape,
    logo: s.logoDataUrl ? { dataUrl: s.logoDataUrl, sizeRatio: s.logoSizeRatio } : undefined,
    frame: s.frameEnabled
      ? { text: s.frameText, color: s.frameColor, textColor: s.frameTextColor }
      : undefined,
    imageBlend: s.blendDataUrl ? { dataUrl: s.blendDataUrl, opacity: s.blendOpacity } : undefined
  }
}

function ShapePicker({
  label,
  value,
  onChange
}: {
  label: string
  value: ModuleShape
  onChange: (shape: ModuleShape) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="shape-options" role="group" aria-label={label}>
        {SHAPES.map((shape) => (
          <button
            key={shape}
            type="button"
            className="shape-option"
            aria-pressed={value === shape}
            onClick={() => onChange(shape)}
          >
            <span className={`shape-swatch ${shape}`} aria-hidden="true" />
            {shape}
          </button>
        ))}
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="color-field">
        <span className="color-swatch">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        </span>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <div
        className="toggle-section-header"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(!open)
        }}
      >
        <p className="card-title">{title}</p>
        <span className={`toggle-chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          ▶
        </span>
      </div>
      {open && <div className="toggle-section-body">{children}</div>}
    </div>
  )
}

export function StylePanel({ onChange }: { onChange: (style: StyleOptions) => void }) {
  const [state, setState] = useState<StyleState>(INITIAL_STATE)

  function update(patch: Partial<StyleState>) {
    const merged = { ...state, ...patch }
    setState(merged)
    onChange(buildStyle(merged))
  }

  return (
    <>
      <div className="card">
        <p className="card-title">Colors &amp; shape</p>
        <div className="field-group">
          <div className="field-row">
            <ColorField label="Foreground" value={state.foregroundColor} onChange={(v) => update({ foregroundColor: v })} />
            <ColorField label="Background" value={state.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
          </div>
          <ShapePicker label="Dot style" value={state.dotShape} onChange={(v) => update({ dotShape: v })} />
          <ShapePicker label="Eye style" value={state.eyeShape} onChange={(v) => update({ eyeShape: v })} />
        </div>
      </div>

      <CollapsibleSection title="Logo">
        <div className="field-group">
          <ImageDropzone
            label="Upload logo"
            hint="PNG, JPG or SVG — placed in the center"
            value={state.logoDataUrl}
            onChange={(dataUrl) => update({ logoDataUrl: dataUrl })}
          />
          {state.logoDataUrl && (
            <div className="field">
              <label htmlFor="logo-size">Logo size</label>
              <div className="slider-field">
                <input
                  id="logo-size"
                  type="range"
                  min={0.1}
                  max={0.25}
                  step={0.01}
                  value={state.logoSizeRatio}
                  onChange={(e) => update({ logoSizeRatio: Number(e.target.value) })}
                />
                <output>{Math.round(state.logoSizeRatio * 100)}%</output>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Background image">
        <div className="field-group">
          <ImageDropzone
            label="Upload image"
            hint="Blended subtly behind the code"
            value={state.blendDataUrl}
            onChange={(dataUrl) => update({ blendDataUrl: dataUrl })}
          />
          {state.blendDataUrl && (
            <div className="field">
              <label htmlFor="blend-opacity">Blend opacity</label>
              <div className="slider-field">
                <input
                  id="blend-opacity"
                  type="range"
                  min={0.05}
                  max={0.25}
                  step={0.01}
                  value={state.blendOpacity}
                  onChange={(e) => update({ blendOpacity: Number(e.target.value) })}
                />
                <output>{Math.round(state.blendOpacity * 100)}%</output>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Frame &amp; CTA">
        <div className="field-group">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.frameEnabled}
              onChange={(e) => update({ frameEnabled: e.target.checked })}
            />
            Add a frame with call-to-action text
          </label>
          {state.frameEnabled && (
            <>
              <div className="field">
                <label htmlFor="frame-text">Frame text</label>
                <input id="frame-text" value={state.frameText} onChange={(e) => update({ frameText: e.target.value })} />
              </div>
              <div className="field-row">
                <ColorField label="Frame color" value={state.frameColor} onChange={(v) => update({ frameColor: v })} />
                <ColorField
                  label="Text color"
                  value={state.frameTextColor}
                  onChange={(v) => update({ frameTextColor: v })}
                />
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>
    </>
  )
}
