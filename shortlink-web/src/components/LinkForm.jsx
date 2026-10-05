import { useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createLink, NetworkError } from '@/api'
import { validateUrl, validateAlias } from '@/validation'

const ICON_PROPS = { size: 16, strokeWidth: 1.75 }

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  // Fallback for browsers without the async clipboard API.
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

export default function LinkForm({ collections = [], onCreated }) {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [collection, setCollection] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setApiError(null)

    const errors = {
      url: validateUrl(url),
      alias: alias.trim() !== '' ? validateAlias(alias.trim()) : null,
    }
    setFieldErrors(errors)
    if (errors.url || errors.alias) return

    setSubmitting(true)
    try {
      const link = await createLink({
        url: url.trim(),
        alias: alias.trim() || undefined,
        collection: collection.trim() || undefined,
      })
      setResult(link)
      setUrl('')
      setAlias('')
      setCollection('')
      if (onCreated) onCreated()
    } catch (err) {
      setApiError(
        err instanceof NetworkError
          ? 'Cannot reach the server. Is the API running?'
          : err.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    const ok = await copyText(result.shortUrl)
    if (ok) toast.success('Copied')
    else toast.error('Could not copy. Select the link and copy it manually.')
  }

  return (
    <section aria-labelledby="form-heading">
      <h2 id="form-heading" className="mb-3 text-base font-semibold tracking-tight">
        Shorten a link
      </h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="url">Long URL</Label>
          <Input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://example.com/a-very-long-path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={fieldErrors.url ? true : undefined}
            aria-describedby={fieldErrors.url ? 'url-error' : undefined}
          />
          {fieldErrors.url && (
            <p id="url-error" className="text-sm text-destructive">
              {fieldErrors.url}
            </p>
          )}
        </div>
        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="alias">Custom alias (optional)</Label>
          <Input
            id="alias"
            name="alias"
            type="text"
            autoComplete="off"
            placeholder="e.g. launch-2026"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            aria-invalid={fieldErrors.alias ? true : undefined}
            aria-describedby={fieldErrors.alias ? 'alias-error' : undefined}
          />
          {fieldErrors.alias && (
            <p id="alias-error" className="text-sm text-destructive">
              {fieldErrors.alias}
            </p>
          )}
        </div>
        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="collection">Collection (optional)</Label>
          <Input
            id="collection"
            name="collection"
            type="text"
            autoComplete="off"
            list="collection-suggestions"
            placeholder="e.g. AWS Workshop"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          />
          <datalist id="collection-suggestions">
            {collections.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="text-[15px] font-semibold sm:mt-[26px]"
        >
          {submitting ? 'Shortening…' : 'Shorten'}
        </Button>
      </form>

      <div aria-live="polite">
        {apiError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        {result && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted px-4 py-3">
            <span className="text-sm">
              Short link:{' '}
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-ink hover:underline"
              >
                {result.shortUrl}
              </a>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label={`Copy ${result.shortUrl}`}
            >
              <Copy {...ICON_PROPS} aria-hidden="true" />
              Copy
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
