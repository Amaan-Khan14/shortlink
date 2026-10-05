import { useCallback, useEffect, useRef, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import LinkForm from '@/components/LinkForm'
import LinkTable from '@/components/LinkTable'
import { Toaster } from '@/components/ui/sonner'
import { listLinks } from '@/api'

const REFRESH_INTERVAL = 10_000

export default function App() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true) // first load only
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current
    if (!silent) setLoading(true)
    try {
      const rows = await listLinks()
      if (id !== requestId.current) return // a newer request superseded this one
      setLinks(rows)
      setError(null)
    } catch (err) {
      if (id !== requestId.current) return
      setError(err)
    } finally {
      if (id === requestId.current && !silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => refresh({ silent: true }), REFRESH_INTERVAL)
    return () => {
      clearInterval(interval)
      requestId.current++ // ignore results of in-flight requests after unmount
    }
  }, [refresh])

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight">ShortLink</p>
            <p className="text-sm text-muted-foreground">
              A small URL shortener with click counts.
            </p>
          </div>
          <StatusBadge />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <LinkForm onCreated={() => refresh({ silent: true })} />
        <LinkTable
          links={links}
          loading={loading}
          error={error}
          onRetry={() => refresh()}
          onRefresh={() => refresh()}
        />
      </main>

      <Toaster position="bottom-right" />
    </div>
  )
}
