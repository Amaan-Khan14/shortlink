// Header lockup: the red slash mark + ShortLink wordmark with red period.
export default function Logo({ size = 30, withWordmark = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="14" fill="var(--primary)" />
        <path
          d="M18 46 L46 18"
          stroke="var(--primary-foreground)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-heading text-xl font-semibold tracking-tight">
          ShortLink<span className="text-primary">.</span>
        </span>
      )}
    </span>
  )
}
