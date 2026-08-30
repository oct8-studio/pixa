'use client'

import { useState } from 'react'
import type { QRContent } from '@pixa/core'

const CONTENT_TYPES = ['url', 'wifi', 'vcard', 'email', 'sms', 'tel'] as const
type ContentType = (typeof CONTENT_TYPES)[number]

const TYPE_LABELS: Record<ContentType, string> = {
  url: 'URL',
  wifi: 'Wi-Fi',
  vcard: 'Contact',
  email: 'Email',
  sms: 'SMS',
  tel: 'Phone'
}

interface FormState {
  url: string
  wifiSsid: string
  wifiPassword: string
  wifiSecurity: 'WPA' | 'WEP' | 'nopass'
  wifiHidden: boolean
  vcardFirstName: string
  vcardLastName: string
  vcardOrg: string
  vcardPhone: string
  vcardEmail: string
  vcardUrl: string
  emailAddress: string
  emailSubject: string
  emailBody: string
  smsPhone: string
  smsMessage: string
  tel: string
}

const INITIAL_STATE: FormState = {
  url: 'https://example.com',
  wifiSsid: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  wifiHidden: false,
  vcardFirstName: '',
  vcardLastName: '',
  vcardOrg: '',
  vcardPhone: '',
  vcardEmail: '',
  vcardUrl: '',
  emailAddress: '',
  emailSubject: '',
  emailBody: '',
  smsPhone: '',
  smsMessage: '',
  tel: ''
}

function buildContent(type: ContentType, s: FormState): QRContent {
  switch (type) {
    case 'url':
      return { type: 'url', value: s.url }
    case 'wifi':
      return {
        type: 'wifi',
        ssid: s.wifiSsid,
        password: s.wifiPassword || undefined,
        security: s.wifiSecurity,
        hidden: s.wifiHidden
      }
    case 'vcard':
      return {
        type: 'vcard',
        firstName: s.vcardFirstName,
        lastName: s.vcardLastName || undefined,
        org: s.vcardOrg || undefined,
        phone: s.vcardPhone || undefined,
        email: s.vcardEmail || undefined,
        url: s.vcardUrl || undefined
      }
    case 'email':
      return {
        type: 'email',
        address: s.emailAddress,
        subject: s.emailSubject || undefined,
        body: s.emailBody || undefined
      }
    case 'sms':
      return { type: 'sms', phone: s.smsPhone, message: s.smsMessage || undefined }
    case 'tel':
      return { type: 'tel', phone: s.tel }
  }
}

export function ContentForm({ onChange }: { onChange: (content: QRContent) => void }) {
  const [type, setType] = useState<ContentType>('url')
  const [state, setState] = useState<FormState>(INITIAL_STATE)

  function update(patch: Partial<FormState>, nextType: ContentType = type) {
    const merged = { ...state, ...patch }
    setState(merged)
    setType(nextType)
    onChange(buildContent(nextType, merged))
  }

  return (
    <div className="card">
      <p className="card-title">Content</p>
      <div className="tabs" role="tablist">
        {CONTENT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            className="tab"
            aria-pressed={type === t}
            onClick={() => update({}, t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === 'url' && (
        <div className="field-group">
          <div className="field">
            <label htmlFor="qr-url">Website URL</label>
            <input
              id="qr-url"
              type="url"
              placeholder="Enter content"
              value={state.url}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
        </div>
      )}

      {type === 'wifi' && (
        <div className="field-group">
          <div className="field">
            <label htmlFor="wifi-ssid">Network name (SSID)</label>
            <input id="wifi-ssid" value={state.wifiSsid} onChange={(e) => update({ wifiSsid: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="wifi-password">Password</label>
              <input
                id="wifi-password"
                type="text"
                value={state.wifiPassword}
                onChange={(e) => update({ wifiPassword: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="wifi-security">Security</label>
              <select
                id="wifi-security"
                value={state.wifiSecurity}
                onChange={(e) => update({ wifiSecurity: e.target.value as FormState['wifiSecurity'] })}
              >
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={state.wifiHidden}
              onChange={(e) => update({ wifiHidden: e.target.checked })}
            />
            Hidden network
          </label>
        </div>
      )}

      {type === 'vcard' && (
        <div className="field-group">
          <div className="field-row">
            <div className="field">
              <label htmlFor="vcard-first">First name</label>
              <input
                id="vcard-first"
                value={state.vcardFirstName}
                onChange={(e) => update({ vcardFirstName: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="vcard-last">Last name</label>
              <input
                id="vcard-last"
                value={state.vcardLastName}
                onChange={(e) => update({ vcardLastName: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="vcard-org">Organization</label>
            <input id="vcard-org" value={state.vcardOrg} onChange={(e) => update({ vcardOrg: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="vcard-phone">Phone</label>
              <input
                id="vcard-phone"
                type="tel"
                value={state.vcardPhone}
                onChange={(e) => update({ vcardPhone: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="vcard-email">Email</label>
              <input
                id="vcard-email"
                type="email"
                value={state.vcardEmail}
                onChange={(e) => update({ vcardEmail: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="vcard-url">Website</label>
            <input id="vcard-url" type="url" value={state.vcardUrl} onChange={(e) => update({ vcardUrl: e.target.value })} />
          </div>
        </div>
      )}

      {type === 'email' && (
        <div className="field-group">
          <div className="field">
            <label htmlFor="email-address">To</label>
            <input
              id="email-address"
              type="email"
              value={state.emailAddress}
              onChange={(e) => update({ emailAddress: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="email-subject">Subject</label>
            <input
              id="email-subject"
              value={state.emailSubject}
              onChange={(e) => update({ emailSubject: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="email-body">Message</label>
            <textarea id="email-body" value={state.emailBody} onChange={(e) => update({ emailBody: e.target.value })} />
          </div>
        </div>
      )}

      {type === 'sms' && (
        <div className="field-group">
          <div className="field">
            <label htmlFor="sms-phone">Phone number</label>
            <input
              id="sms-phone"
              type="tel"
              value={state.smsPhone}
              onChange={(e) => update({ smsPhone: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="sms-message">Message</label>
            <textarea id="sms-message" value={state.smsMessage} onChange={(e) => update({ smsMessage: e.target.value })} />
          </div>
        </div>
      )}

      {type === 'tel' && (
        <div className="field-group">
          <div className="field">
            <label htmlFor="tel-phone">Phone number</label>
            <input id="tel-phone" type="tel" value={state.tel} onChange={(e) => update({ tel: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  )
}
