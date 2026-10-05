import { ExternalLink, RefreshCw } from 'lucide-react'
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

const ICON_PROPS = { size: 16, strokeWidth: 1.75 }

// Only http(s) URLs become clickable hrefs; anything else renders as plain text.
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

function OriginalUrl({ url }) {
  const href = safeHref(url)
  if (!href) {
    return (
      <span className="block max-w-[24rem] truncate" title={url}>
        {url}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className="block max-w-[24rem] truncate text-muted-foreground hover:text-brand-ink hover:underline"
    >
      {url}
    </a>
  )
}

export default function LinkTable({
  links,
  loading,
  error,
  onRetry,
  onRefresh,
}) {
  let body
  if (loading) {
    body = (
      <TableRow>
        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
          Loading links…
        </TableCell>
      </TableRow>
    )
  } else if (error) {
    body = (
      <TableRow>
        <TableCell colSpan={4} className="py-6 text-center">
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
        <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
          No links yet. Create your first one above.
        </TableCell>
      </TableRow>
    )
  } else {
    body = links.map((link) => {
      const shortHref = safeHref(link.shortUrl)
      const created = new Date(link.createdAt)
      return (
        <TableRow key={link.code}>
          <TableCell className="font-medium">
            {shortHref ? (
              <a
                href={shortHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-ink hover:underline"
              >
                {link.shortUrl}
                <ExternalLink {...ICON_PROPS} className="text-muted-foreground" aria-hidden="true" />
              </a>
            ) : (
              link.shortUrl
            )}
          </TableCell>
          <TableCell>
            <OriginalUrl url={link.url} />
          </TableCell>
          <TableCell className="text-right tabular-nums">{link.clicks}</TableCell>
          <TableCell
            className="text-right text-muted-foreground"
            title={created.toLocaleString()}
          >
            {relativeTime(link.createdAt)}
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <section aria-labelledby="links-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="links-heading" className="text-base font-semibold tracking-tight">
          Recent links
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw {...ICON_PROPS} aria-hidden="true" />
          Refresh
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="pl-4 text-xs uppercase tracking-wide">Short link</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Original URL</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide">Clicks</TableHead>
              <TableHead className="pr-4 text-right text-xs uppercase tracking-wide">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
    </section>
  )
}
