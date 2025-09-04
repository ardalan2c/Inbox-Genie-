import * as React from 'react'

export function DataTable<T>({ columns, rows, onRowClick }: { columns: { key: keyof T; header: string }[]; rows: T[]; onRowClick?: (row: T) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full divide-y">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-3">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y bg-white">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 cursor-pointer" onClick={() => onRowClick?.(r)}>
              {columns.map((c) => (
                <td key={String(c.key)} className="px-4 py-3 text-sm">{String(r[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

