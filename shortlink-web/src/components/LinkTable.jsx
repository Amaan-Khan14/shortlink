import { BarChart3, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { relativeTime } from '@/lib/time'
import { linkStatus, STATUS_LABELS } from '@/lib/status'

const ICON_PROPS = { size: 16, strokeWidth: 1.75 }

function safeHref(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? url
      : undefined
  } catch {
    return undefined
  }
}

function StatusCell({ link }) {
  const status = linkStatus(link)
  const dotColor =
    status === 'active'
      ? 'bg-status-online'
      : status === 'expired'
        ? 'bg-destructive'
        : 'bg-muted-foreground/50'
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
      <span aria-hidden="true" className={`size-2 rounded-full ${dotColor}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}

export default function LinkTable({
  links,
  loading,
  error,
  collections,
  collectionFilter,
  onFilterChange,
  onRetry,
  onRefresh,
  onOpenAnalytics,
  onDelete,
}) {
  let body
  if (loading) {
    body = (
      <TableRow>
        <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
          Loading links…
        </TableCell>
      </TableRow>
    )
  } else if (error) {
    body = (
      <TableRow>
        <TableCell colSpan={7} className="py-6 text-center">
          <p className="text-destructive">Could not reach the API.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Retry
          </Button>
        </TableCell>
      </TableRow>
    )
  } else if (links.length === 0) {
    body = (
      <TableRow>
        <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
          {collectionFilter
            ? 'No links in this collection.'
            : 'No links yet. Create your first one above.'}
        </TableCell>
      </TableRow>
    )
  } else {
    body = links.map((link) => {
      const shortHref = safeHref(link.shortUrl)
      const created = new Date(link.createdAt)
      return (
        <TableRow key={link.code}>
          <TableCell className="pl-4 font-medium">
            {shortHref ? (
              <a
                href={shortHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-ink hover:underline"
              >
                {link.shortUrl}
              </a>
            ) : (
              link.shortUrl
            )}
          </TableCell>
          <TableCell>
            <a
              href={safeHref(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              title={link.url}
              className="block max-w-[36rem] truncate text-muted-foreground hover:text-brand-ink hover:underline"
            >
              {link.url}
            </a>
          </TableCell>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {link.collection?.name ?? '—'}
          </TableCell>
          <TableCell className="text-right tabular-nums">{link.clicks}</TableCell>
          <TableCell>
            <StatusCell link={link} />
          </TableCell>
          <TableCell
            className="text-right whitespace-nowrap text-muted-foreground"
            title={created.toLocaleString()}
          >
            {relativeTime(link.createdAt)}
          </TableCell>
          <TableCell className="pr-4">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAnalytics(link.code)}
                aria-label={`Analytics for ${link.code}`}
              >
                <BarChart3 {...ICON_PROPS} aria-hidden="true" />
                Analytics
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(link.code)}
                aria-label={`Delete ${link.code}`}
              >
                <Trash2 {...ICON_PROPS} aria-hidden="true" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <section aria-labelledby="links-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-t-2 border-t-foreground pt-4">
        <h2 id="links-heading" className="font-heading text-lg tracking-tight">
          Recent links
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="collection-filter" className="text-sm text-muted-foreground">
            Collection
          </label>
          <select
            id="collection-filter"
            value={collectionFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All</option>
            {collections.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.linkCount})
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="h-9" onClick={onRefresh}>
            <RefreshCw {...ICON_PROPS} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="pl-4 text-[11px] uppercase tracking-[0.12em]">Short link</TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.12em]">Original URL</TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.12em]">Collection</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-[0.12em]">Clicks</TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.12em]">Status</TableHead>
              <TableHead className="text-right text-[11px] uppercase tracking-[0.12em]">Created</TableHead>
              <TableHead className="pr-4 text-right text-[11px] uppercase tracking-[0.12em]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
    </section>
  )
}
