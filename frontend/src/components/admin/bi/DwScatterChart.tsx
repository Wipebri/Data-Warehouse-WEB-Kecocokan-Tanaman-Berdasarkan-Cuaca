import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

const CROP_COLORS: Record<string, string> = {
  tomato: '#ef4444', potato: '#d97706', maize: '#2ca63d',
  mungbean: '#86e58f', banana: '#ffb703', watermelon: '#4de4ff',
  orange: '#f97316', papaya: '#e879f9',
}

export default function DwScatterChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<'temp' | 'hum' | 'ph'>('temp')
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

  const unitMap = { temp: '°C', hum: '%', ph: '' }
  const labelMap = { temp: 'Suhu Rata-rata', hum: 'Kelembapan Rata-rata', ph: 'pH Rata-rata' }
  const unit = unitMap[metric]
  const key = `${metric}Avg`

  const chartData = data.map((c: any) => ({ crop: c.crop, value: c[key], count: c.count }))

  return (
    <section className="rounded-2xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#000]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black">Rata-rata Kondisi per Tanaman (dari dataset skenario)</h3>
        <select
          value={metric}
          onChange={e => setMetric(e.target.value as any)}
          className="rounded-md border-[2px] border-black bg-white px-2 py-1 text-[10px] font-bold"
        >
          <option value="temp">Suhu</option>
          <option value="hum">Kelembapan</option>
          <option value="ph">pH Tanah</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-500">Belum ada data</p>
      ) : (
        <>
          <p className="mb-2 text-[10px] text-neutral-500">Grafik batang {labelMap[metric].toLowerCase()} per tanaman — warna menunjukkan jumlah prediksi</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
              <XAxis dataKey="crop" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} unit={unit} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) + unit : v]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="value" name={labelMap[metric]} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={CROP_COLORS[entry.crop] || '#666'} stroke="#000" strokeWidth={1.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </section>
  )
}
