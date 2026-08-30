export const metadata = {
  title: 'QR Generator',
  description: 'Build customized, brandable QR codes.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
