import { useState, useEffect } from 'react'

export default function DwOptimalZones() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'count' | 'crop'>('count')
  const token = localStorage.getItem('token')
  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/dw/optimal-zones', { headers: h })
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...data].sort((a, b) =>
    sortBy === 'count' ? b.count - a.count : a.crop.localeCompare(b.crop)
  )

  return (
    <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black">Zona Kondisi Optimal per Tanaman</h3>
          <p className="text-[10px] text-neutral-500">Rentang suhu, kelembapan, dan pH dari seluruh skenario pertumbuhan di dataset</p>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="rounded-md border-[2px] border-black bg-white px-2 py-1 text-[10px] font-bold"
        >
          <option value="count">Terbanyak</option>
          <option value="crop">A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-500">Belum ada data</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((c: any) => (
            <div key={c.crop} className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-3 shadow-[4px_4px_0_#000]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-black capitalize">{c.crop}</p>
                <span className="rounded-md border-[2px] border-black bg-white px-2 py-0.5 text-[9px] font-bold">{c.count} skenario</span>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 py-1">
                  <span className="text-neutral-600">Suhu</span>
                  <span className="font-bold">{c.tempMin}–{c.tempMax}°C</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 py-1">
                  <span className="text-neutral-600">Kelembapan</span>
                  <span className="font-bold">{c.humMin}–{c.humMax}%</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-black/20 bg-white px-2 py-1">
                  <span className="text-neutral-600">pH Tanah</span>
                  <span className="font-bold">{c.phMin}–{c.phMax}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
