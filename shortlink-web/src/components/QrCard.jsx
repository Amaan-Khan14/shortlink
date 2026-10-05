import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ICON_PROPS = { size: 16, strokeWidth: 1.75 }

// Client-side QR generation: the short URL is encoded locally, nothing is
// sent to any third party.
export default function QrCard({ shortUrl, code }) {
  const [dataUrl, setDataUrl] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(shortUrl, { margin: 1, width: 240, color: {} })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [shortUrl])

  async function handleCopyImage() {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ])
      toast.success('Copied QR image')
    } catch {
      // Clipboard image support is uneven; fall back to copying the URL text.
      try {
        await navigator.clipboard.writeText(shortUrl)
        toast.success('Copied link (image copy unsupported here)')
      } catch {
        toast.error('Could not copy. Download the QR instead.')
      }
    }
  }

  if (failed) {
    return (
      <div className="bg-muted p-4 text-sm text-muted-foreground">
        QR code could not be generated.
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 bg-muted p-4">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR code for ${shortUrl}`}
          width={128}
          height={128}
          className="size-32 border border-divider bg-white p-2"
        />
      ) : (
        <div
          className="size-32 animate-pulse border border-divider bg-white/60 p-2"
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-body-text">Scan to open this link.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9" asChild>
            <a href={dataUrl ?? '#'} download={`shortlink-${code}.png`}>
              <Download {...ICON_PROPS} aria-hidden="true" />
              Download PNG
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleCopyImage}
            disabled={!dataUrl}
          >
            <Copy {...ICON_PROPS} aria-hidden="true" />
            Copy image
          </Button>
        </div>
      </div>
    </div>
  )
}
