"use client"
import { useState } from 'react'
import { DataTable } from '../../../components/ui/datatable'
import { Drawer } from '../../../components/ui/drawer'
import { DarkCard } from '../../../components/ui/card'

type Row = { id: string; from: string; to: string; duration: string; outcome: string }

const rows: Row[] = [
  { id: '1', from: '+14165550000', to: '+14165550001', duration: '2:31', outcome: 'Booked' },
  { id: '2', from: '+14165550002', to: '+14165550003', duration: '0:45', outcome: 'No answer' }
]

export default function CallsPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  return (
    <div className="space-y-4">
      <h1 className="font-sora text-2xl">Calls</h1>
      <DarkCard className="p-4">
        <DataTable<Row>
          columns={[
            { key: 'id', header: 'ID' },
            { key: 'from', header: 'From' },
            { key: 'to', header: 'To' },
            { key: 'duration', header: 'Duration' },
            { key: 'outcome', header: 'Outcome' }
          ]}
          rows={rows}
          onRowClick={(r) => { setSelected(r); setOpen(true) }}
        />
      </DarkCard>
      <Drawer open={open} onOpenChange={setOpen}>
        <h2 className="text-xl font-sora mb-2">Call {selected?.id}</h2>
        <pre className="text-xs bg-slate-50 p-4 rounded-xl text-slate-900 overflow-auto">{JSON.stringify({ transcript: 'Hello…', summary: { intent: 'book' } }, null, 2)}</pre>
      </Drawer>
    </div>
  )
}

