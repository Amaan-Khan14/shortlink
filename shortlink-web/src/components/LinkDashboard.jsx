import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { linkStatus, STATUS_LABELS } from '@/lib/status'
import BreakdownTable from '@/components/BreakdownTable'
import QrCard from '@/components/QrCard'
import { getLink, getAnalytics, updateLink, deleteLink } from '@/api'

const ICON_PROPS = { size: 16, strokeWidth: 1.75 }
const RANGES = [7, 14, 30]

const pad = (n) => String(n).padStart(2, '0')

function isoToLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(value) {
  return value ? new Date(value).toISOString() : null
}

function StatCard({ label, value }) {
  return (
    <div className="bg-muted px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  )
}

function SectionHeading({ title, aside }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-t-2 border-t-foreground pt-4">
      <h3 className="font-heading text-base tracking-tight">{title}</h3>
      {aside}
    </div>
  )
}

// The per-link analytics dashboard: stats, clicks over time, breakdowns, top
// referrers, QR code, and the link's configuration (URL, expiry, collection,
// enable/disable, delete). Polls analytics silently every 10 seconds.
export default function LinkDashboard({ code, collections, onBack, onChanged }) {
  const [link, setLink] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(14)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ url: '', expiresLocal: '', collection: '' })
  const requestId = useRef(0)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestId.current
      try {
        const [linkData, analyticsData] = await Promise.all([
          getLink(code),
          getAnalytics(code, days),
        ])
        if (id !== requestId.current) return
        setLink(linkData)
        setAnalytics(analyticsData)
        setError(null)
        if (!silent) {
          setForm({
            url: linkData.url,
            expiresLocal: isoToLocalInput(linkData.expiresAt),
            collection: linkData.collection?.name ?? '',
          })
        }
      } catch (err) {
        if (id !== requestId.current) return
        setError(err)
      }
    },
    [code, days]
  )

  useEffect(() => {
    load()
    const interval = setInterval(() => load({ silent: true }), 10_000)
    return () => {
      clearInterval(interval)
      requestId.current++
    }
  }, [load])

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await updateLink(code, {
        url: form.url,
        expiresAt: form.expiresLocal ? localInputToIso(form.expiresLocal) : null,
        collection: form.collection,
      })
      toast.success('Saved')
      onChanged?.()
      await load({ silent: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleEnabled() {
    try {
      await updateLink(code, { isEnabled: !link.isEnabled })
      await load({ silent: true })
      onChanged?.()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${code}? This cannot be undone.`)) return
    try {
      await deleteLink(code)
      toast.success('Deleted')
      onChanged?.()
      onBack()
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (error) {
    return (
      <section>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
          <ArrowLeft {...ICON_PROPS} aria-hidden="true" />
          Back to links
        </Button>
        <div className="rounded-md border px-4 py-8 text-center">
          <p className="text-destructive">Could not load this link.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => load()}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  if (!link || !analytics) {
    return (
      <section className="py-12 text-center text-muted-foreground">Loading…</section>
    )
  }

  const status = linkStatus(link)
  const chartConfig = {
    clicks: { label: 'Clicks', color: 'var(--chart-1)' },
  }

  return (
    <section aria-labelledby="dashboard-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
            <ArrowLeft {...ICON_PROPS} aria-hidden="true" />
            Back
          </Button>
          <h2 id="dashboard-heading" className="font-heading text-xl tracking-tight">
            {link.shortUrl}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              aria-hidden="true"
              className={
                status === 'active'
                  ? 'size-2 rounded-full bg-status-online'
                  : status === 'expired'
                    ? 'size-2 rounded-full bg-destructive'
                    : 'size-2 rounded-full bg-muted-foreground/50'
              }
            />
            {STATUS_LABELS[status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleToggleEnabled}>
            {link.isEnabled ? 'Disable' : 'Enable'}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} aria-label="Delete link">
            <Trash2 {...ICON_PROPS} aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" className="h-9" asChild>
            <a href={link.shortUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink {...ICON_PROPS} aria-hidden="true" />
              Open
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total clicks" value={analytics.totals.clicks} />
          <StatCard label="Clicks today" value={analytics.totals.today} />
          <StatCard label="This week" value={analytics.totals.week} />
        </div>

        <div>
          <SectionHeading
            title="Clicks over time"
            aside={
              <div className="flex gap-1" role="group" aria-label="Time range">
                {RANGES.map((r) => (
                  <Button
                    key={r}
                    variant="ghost"
                    size="sm"
                    onClick={() => setDays(r)}
                    className={
                      days === r
                        ? 'bg-foreground text-background hover:bg-foreground/90 hover:text-background'
                        : 'text-muted-foreground'
                    }
                  >
                    {r}d
                  </Button>
                ))}
              </div>
            }
          />
          <div className="border px-2 py-5 pr-5">
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={analytics.timeline} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(v) => v.slice(5)}
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => v} />} />
                <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <BreakdownTable title="Devices" rows={analytics.devices} />
          <BreakdownTable title="Browsers" rows={analytics.browsers} />
          <BreakdownTable title="Operating systems" rows={analytics.operatingSystems} />
        </div>

        <BreakdownTable title="Top referrers" rows={analytics.referrers} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <SectionHeading title="QR code" />
            <QrCard shortUrl={link.shortUrl} code={link.code} />
          </div>

          <div>
            <SectionHeading title="Link settings" />
            <form onSubmit={handleSave} className="flex flex-col gap-3 bg-muted p-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings-url">Destination URL</Label>
                <Input
                  id="settings-url"
                  className="h-9 bg-background"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-expires">Expires at</Label>
                  <Input
                    id="settings-expires"
                    type="datetime-local"
                    className="h-9 bg-background"
                    value={form.expiresLocal}
                    onChange={(e) => setForm((f) => ({ ...f, expiresLocal: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-collection">Collection</Label>
                  <select
                    id="settings-collection"
                    value={form.collection}
                    onChange={(e) => setForm((f) => ({ ...f, collection: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">None</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {form.collection &&
                      !collections.some((c) => c.name === form.collection) && (
                        <option value={form.collection}>{form.collection}</option>
                      )}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Leave expiry empty for a link that never expires.
                </p>
                <Button type="submit" size="sm" disabled={saving} className="h-9 px-4 text-[15px] font-semibold">
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
