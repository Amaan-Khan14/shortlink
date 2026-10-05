import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Dense breakdown table with an inline proportion bar (devices, browsers, OS,
// referrers all share it).
export default function BreakdownTable({ title, rows }) {
  const max = Math.max(...rows.map((r) => r.clicks), 1)
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="pl-3 text-xs uppercase tracking-wide">{title}</TableHead>
            <TableHead className="pr-3 text-right text-xs uppercase tracking-wide">
              Clicks
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="py-3 text-center text-muted-foreground">
                No data yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="pl-3">
                  <div className="flex items-center gap-2">
                    <span className="w-24 truncate capitalize" title={row.name}>
                      {row.name}
                    </span>
                    <span className="h-1.5 w-full min-w-8 max-w-24 rounded-full bg-muted" aria-hidden="true">
                      <span
                        className="block h-1.5 rounded-full bg-foreground/70"
                        style={{ width: `${(row.clicks / max) * 100}%` }}
                      />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pr-3 text-right tabular-nums">{row.clicks}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
