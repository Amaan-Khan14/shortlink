import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Dense breakdown panel (devices, browsers, OS, referrers) in the Brainfloss
// muted-square style with ink proportion bars.
export default function BreakdownTable({ title, rows }) {
  const max = Math.max(...rows.map((r) => r.clicks), 1)
  return (
    <div className="bg-muted">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {title}
            </TableHead>
            <TableHead className="pr-4 text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Clicks
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="border-border">
              <TableCell colSpan={2} className="py-3 text-center text-muted-foreground">
                No data yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.name} className="border-border">
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <span className="w-24 truncate capitalize" title={row.name}>
                      {row.name}
                    </span>
                    <span className="h-1.5 w-full min-w-8 max-w-24 bg-background" aria-hidden="true">
                      <span
                        className="block h-1.5 bg-foreground"
                        style={{ width: `${(row.clicks / max) * 100}%` }}
                      />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">{row.clicks}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
