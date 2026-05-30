import { useEffect, useState } from 'react'
import type { DrillDownRow } from '../../../types'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  fetchUrl: string
}

export default function DrillDownModal({ open, onClose, title, fetchUrl }: Props) {
  const [rows, setRows] = useState<DrillDownRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !fetchUrl) return
    setLoading(true)
    const token = localStorage.getItem('token')
    fetch(fetchUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setRows(d.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [open, fetchUrl])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-4xl max-h-[80vh] overflow-auto rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{title}</h2>
          <button onClick={onClose} className="rounded-lg border-[3px] border-black bg-red-100 px-3 py-1 text-xs font-black hover:bg-red-200">
            Tutup
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-neutral-500">Tidak ada data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b-[3px] border-black">
                  <th className="p-2 font-black">Tanggal</th>
                  <th className="p-2 font-black">Tanaman</th>
                  <th className="p-2 font-black">Lokasi</th>
                  <th className="p-2 font-black">Skor</th>
                  <th className="p-2 font-black">Label</th>
                  <th className="p-2 font-black">Suhu</th>
                  <th className="p-2 font-black">Kelembapan</th>
                  <th className="p-2 font-black">User</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-black/10">
                    <td className="p-2 font-medium">{r.date}</td>
                    <td className="p-2">{r.cropLabel}</td>
                    <td className="p-2">{r.location}</td>
                    <td className="p-2">
                      <span className={`rounded-md px-1.5 py-0.5 font-black ${
                        r.score >= 80 ? 'bg-green-200' : r.score >= 60 ? 'bg-green-100' : r.score >= 35 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>{r.score}</span>
                    </td>
                    <td className="p-2">{r.label}</td>
                    <td className="p-2">{r.temp}°C</td>
                    <td className="p-2">{r.hum}%</td>
                    <td className="p-2">{r.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
