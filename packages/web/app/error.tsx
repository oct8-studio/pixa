'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main>
      <p role="alert">Something went wrong while generating the QR code.</p>
      <button onClick={reset}>Try again</button>
    </main>
  )
}
