// app/tag/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export default function TagPage() {
    const params = useSearchParams()
    const raw = params.get('d') || ''

    const payload = useMemo(() => {
        try {
            return raw ? JSON.parse(decodeURIComponent(raw)) : null
        } catch {
            return null
        }
    }, [raw])

    if (!payload) {
        return <main style={{ padding: 20 }}>Invalid or missing data.</main>
    }

    const { page, data } = payload as { page?: number; data?: Record<string, any> }

    return (
        <main style={{ padding: 20, fontFamily: 'Inter, Arial, sans-serif' }}>
            <h1>PALLET TAG — Page {page ?? '-'}</h1>
            <section style={{ marginTop: 16 }}>
                {data && typeof data === 'object' ? (
                    Object.entries(data).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 8 }}>
                            <strong>{k}:</strong> <span>{String(v ?? '')}</span>
                        </div>
                    ))
                ) : (
                    <pre>{String(data)}</pre>
                )}
            </section>
        </main>
    )
}
