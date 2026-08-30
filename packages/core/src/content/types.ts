export type QRContent =
  | { type: 'url'; value: string }
  | { type: 'text'; value: string }
  | { type: 'wifi'; ssid: string; password?: string; security?: 'WPA' | 'WEP' | 'nopass'; hidden?: boolean }
  | { type: 'vcard'; firstName: string; lastName?: string; org?: string; phone?: string; email?: string; url?: string }
  | { type: 'email'; address: string; subject?: string; body?: string }
  | { type: 'sms'; phone: string; message?: string }
  | { type: 'tel'; phone: string }
