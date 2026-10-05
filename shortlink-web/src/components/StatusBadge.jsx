import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { getHealth } from '@/api'

// Polls GET /health on mount and every 15 seconds.
// Green "API online" on 200, red "API unreachable" otherwise.
export default function StatusBadge() {
  const [online, setOnline] = useState(null) // null = not checked yet

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        await getHealth()
        if (!cancelled) setOnline(true)
      } catch {
        if (!cancelled) setOnline(false)
      }
    }

    check()
    const id = setInterval(check, 15_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <Badge
      variant="outline"
      className="gap-2 font-normal text-muted-foreground"
      role="status"
    >
      <span
        aria-hidden="true"
        className={
          online === true
            ? 'size-2 rounded-full bg-status-online'
            : online === false
              ? 'size-2 rounded-full bg-destructive'
              : 'size-2 rounded-full bg-muted-foreground/40'
        }
      />
      {online === true
        ? 'API online'
        : online === false
          ? 'API unreachable'
          : 'Checking API…'}
    </Badge>
  )
}
