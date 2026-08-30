'use client'

import { useState } from 'react'
import type { StyleOptions, ModuleShape, EyeShape } from '@pixa/core'
import { ImageDropzone } from './ImageDropzone'

const DOT_SHAPES: ModuleShape[] = ['square', 'rounded', 'circle']
const EYE_SHAPES: EyeShape[] = ['square', 'rounded', 'circle', 'ring']

interface StyleState {
  foregroundColor: string
  backgroundColor: string
  dotShape: ModuleShape
  eyeShape: EyeShape
  logoEnabled: boolean
  logoDataUrl: string | null
  logoSizeRatio: number
  patternEnabled: boolean
  patternDataUrl: string | null
  blendEnabled: boolean
  blendDataUrl: string | null
  blendOpacity: number
  frameEnabled: boolean
  frameText: string
  frameColor: string
  frameTextColor: string
}

const INITIAL_STATE: StyleState = {
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  dotShape: 'square',
  eyeShape: 'square',
  logoEnabled: false,
  logoDataUrl: null,
  logoSizeRatio: 0.2,
  patternEnabled: false,
  patternDataUrl: null,
  blendEnabled: false,
  blendDataUrl: null,
  blendOpacity: 0.15,
  frameEnabled: false,
  frameText: 'Scan me',
  frameColor: '#000000',
  frameTextColor: '#ffffff'
}

function buildStyle(s: StyleState): StyleOptions {
  return {
    foregroundColor: s.foregroundColor,
    backgroundColor: s.backgroundColor,
    dotShape: s.dotShape,
    eyeShape: s.eyeShape,
    logo: s.logoEnabled && s.logoDataUrl ? { dataUrl: s.logoDataUrl, sizeRatio: s.logoSizeRatio } : undefined,
    patternImage: s.patternEnabled && s.patternDataUrl ? { dataUrl: s.patternDataUrl } : undefined,
    imageBlend: s.blendEnabled && s.blendDataUrl ? { dataUrl: s.blendDataUrl, opacity: s.blendOpacity } : undefined,
    frame: s.frameEnabled ? { text: s.frameText, color: s.frameColor, textColor: s.frameTextColor } : undefined
  }
}

function ShapePicker<T extends string>({
  label,
  shapes,
  value,
  onChange
}: {
  label: string
  shapes: T[]
  value: T
  onChange: (shape: T) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="shape-options" role="group" aria-label={label}>
        {shapes.map((shape) => (
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

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const id = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="slider-field">
        <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <output>{Math.round(value * 100)}%</output>
      </div>
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
        <p className="card-title">Style</p>
        <div className="field-group">
          <div className="field-row">
            <ColorField label="Foreground" value={state.foregroundColor} onChange={(v) => update({ foregroundColor: v })} />
            <ColorField label="Background" value={state.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
          </div>
          <ShapePicker label="Dot style" shapes={DOT_SHAPES} value={state.dotShape} onChange={(v) => update({ dotShape: v })} />
          <ShapePicker label="Eye style" shapes={EYE_SHAPES} value={state.eyeShape} onChange={(v) => update({ eyeShape: v })} />
        </div>
      </div>

      <div className="card">
        <p className="card-title">Branding</p>
        <div className="field-group">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.logoEnabled}
              onChange={(e) => update({ logoEnabled: e.target.checked })}
            />
            Add a logo
          </label>
          {state.logoEnabled && (
            <>
              <ImageDropzone
                label="Upload logo"
                hint="PNG, JPG or SVG — placed in the center"
                value={state.logoDataUrl}
                onChange={(dataUrl) => update({ logoDataUrl: dataUrl })}
              />
              {state.logoDataUrl && (
                <SliderField
                  label="Logo size"
                  value={state.logoSizeRatio}
                  min={0.1}
                  max={0.25}
                  step={0.01}
                  onChange={(v) => update({ logoSizeRatio: v })}
                />
              )}
            </>
          )}

          <div className="divider" />

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.patternEnabled}
              onChange={(e) => update({ patternEnabled: e.target.checked })}
            />
            Color the pattern from a brand image
          </label>
          {state.patternEnabled && (
            <ImageDropzone
              label="Upload brand image"
              hint="Colors the whole QR pattern like a logo — try pairing with ring eyes"
              value={state.patternDataUrl}
              onChange={(dataUrl) => update({ patternDataUrl: dataUrl })}
            />
          )}

          <div className="divider" />

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.blendEnabled}
              onChange={(e) => update({ blendEnabled: e.target.checked })}
            />
            Blend an image behind the code
          </label>
          {state.blendEnabled && (
            <>
              <ImageDropzone
                label="Upload image"
                hint="Blended subtly behind the code"
                value={state.blendDataUrl}
                onChange={(dataUrl) => update({ blendDataUrl: dataUrl })}
              />
              {state.blendDataUrl && (
                <SliderField
                  label="Blend opacity"
                  value={state.blendOpacity}
                  min={0.05}
                  max={0.25}
                  step={0.01}
                  onChange={(v) => update({ blendOpacity: v })}
                />
              )}
            </>
          )}

          <div className="divider" />

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
      </div>
    </>
  )
}
