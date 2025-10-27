// app/tag/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function TagContent() {
  const params = useSearchParams()
  const raw = params.get('d') || ''

  let payload: { page?: number; data?: Record<string, any> } | null = null
  try {
    if (raw) payload = JSON.parse(decodeURIComponent(raw))
  } catch {
    payload = null
  }

  if (!payload) {
    return <p style={{ padding: 20 }}>Invalid or missing data.</p>
  }

  const { page, data } = payload

  return (
    <main style={{ padding: 20, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1>PALLET TAG — Page {page}</h1>
      <section style={{ marginTop: 16 }}>
        {data && typeof data === 'object' ? (
          Object.entries(data).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <strong>{k}:</strong> {String(v ?? '')}
            </div>
          ))
        ) : (
          <pre>{String(data)}</pre>
        )}
      </section>
    </main>
  )
}

export default function TagPage() {
  return (
    <Suspense fallback={<p style={{ padding: 20 }}>Loading tag data...</p>}>
      <TagContent />
    </Suspense>
  )
}
