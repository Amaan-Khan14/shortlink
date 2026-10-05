import { useCallback, useEffect, useRef, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import LinkForm from '@/components/LinkForm'
import LinkTable from '@/components/LinkTable'
import LinkDashboard from '@/components/LinkDashboard'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { listLinks, listCollections, deleteLink } from '@/api'

const REFRESH_INTERVAL = 10_000

export default function App() {
  const [view, setView] = useState({ name: 'list' }) // {name:'list'} | {name:'dashboard', code}
  const [links, setLinks] = useState([])
  const [collections, setCollections] = useState([])
  const [collectionFilter, setCollectionFilter] = useState('')
  const [loading, setLoading] = useState(true) // first load only
  const [error, setError] = useState(null)
  const requestId = useRef(0)

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current
    if (!silent) setLoading(true)
    try {
      const [rows, cols] = await Promise.all([listLinks(), listCollections()])
      if (id !== requestId.current) return // a newer request superseded this one
      setLinks(rows)
      setCollections(cols)
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

  async function handleDelete(code) {
    if (!window.confirm(`Delete ${code}? This cannot be undone.`)) return
    try {
      await deleteLink(code)
      toast.success('Deleted')
      refresh({ silent: true })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filteredLinks = collectionFilter
    ? links.filter((l) => l.collection?.name === collectionFilter)
    : links

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="flex w-full items-center justify-between gap-3 px-5 py-5 sm:px-8 lg:px-12">
          <div>
            <p className="font-heading text-xl font-semibold tracking-tight">
              ShortLink<span className="text-primary">.</span>
            </p>
            <p className="text-sm text-body-text">
              URL management and click analytics.
            </p>
          </div>
          <StatusBadge />
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-10 px-5 py-8 sm:px-8 lg:px-12">
        {view.name === 'list' ? (
          <>
            <LinkForm
              collections={collections}
              onCreated={() => refresh({ silent: true })}
            />
            <LinkTable
              links={filteredLinks}
              loading={loading}
              error={error}
              collections={collections}
              collectionFilter={collectionFilter}
              onFilterChange={setCollectionFilter}
              onRetry={() => refresh()}
              onRefresh={() => refresh()}
              onOpenAnalytics={(code) => setView({ name: 'dashboard', code })}
              onDelete={handleDelete}
            />
          </>
        ) : (
          <LinkDashboard
            key={view.code}
            code={view.code}
            collections={collections}
            onBack={() => {
              setView({ name: 'list' })
              refresh({ silent: true })
            }}
            onChanged={() => refresh({ silent: true })}
          />
        )}
      </main>

      <footer className="bg-panel-dark">
        <div className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-6 sm:px-8 lg:px-12">
          <p className="text-sm text-on-dark-muted">
            ShortLink — a DevOps with AWS workshop project.
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand-soft">
            Brainfloss
          </p>
        </div>
      </footer>

      <Toaster position="bottom-right" />
    </div>
  )
}
