import { useState, useCallback } from 'react'
import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend,
} from 'recharts'

interface Props {
  title: string
  type: 'bar' | 'line' | 'pie'
  data: any[]
  bars?: { dataKey: string; color: string; name?: string }[]
  lines?: { dataKey: string; color: string; name?: string }[]
  pieDataKey?: string
  pieNameKey?: string
  xKey?: string
  syncId?: string
  showBrush?: boolean
  height?: number
  pieColors?: string[]
  onSegmentClick?: (entry: any) => void
  children?: React.ReactNode
}

const PIE_COLORS = ['#2ca63d', '#86e58f', '#ffb703', '#ef4444', '#4de4ff', '#d6ff24']

export default function BIChart({
  title, type, data,
  bars, lines, pieDataKey, pieNameKey, xKey = 'name',
  syncId, showBrush, height = 260, pieColors = PIE_COLORS,
  onSegmentClick, children,
}: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggleLegend = useCallback((key: string) => {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }, [])

  const filteredBars = bars?.filter(b => !hidden.has(b.dataKey))
  const filteredLines = lines?.filter(l => !hidden.has(l.dataKey))

  const renderLegend = (entries: { dataKey: string; color: string; name?: string }[]) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {entries.map(e => (
        <button
          key={e.dataKey}
          onClick={() => toggleLegend(e.dataKey)}
          className={`flex items-center gap-1 rounded-md border-[2px] border-black px-2 py-0.5 text-[9px] font-bold transition-all ${
            hidden.has(e.dataKey) ? 'opacity-30' : ''
          }`}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          {e.name || e.dataKey}
        </button>
      ))}
    </div>
  )

  return (
    <section className="rounded-2xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#000]">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-500">Belum ada data</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={height}>
            {type === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={pieDataKey!}
                  nameKey={pieNameKey!}
                  cx="50%" cy="50%" outerRadius={Math.min(height * 0.35, 100)}
                  stroke="#000" strokeWidth={2}
                  onClick={onSegmentClick ? (entry) => onSegmentClick(entry) : undefined}
                  style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                >
                  {data.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10, cursor: 'pointer' }} />
              </PieChart>
            ) : (
              <BarChart data={data} syncId={syncId} onClick={onSegmentClick ? (e: any) => e?.activePayload && onSegmentClick(e.activePayload[0].payload) : undefined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                {showBrush && <Brush dataKey={xKey} height={24} stroke="#2ca63d" fill="#f0f0f0" />}
                {filteredBars?.map(b => <Bar key={b.dataKey} dataKey={b.dataKey} fill={b.color} stroke="#000" strokeWidth={1.5} radius={[3, 3, 0, 0]} name={b.name || b.dataKey} />)}
                {filteredLines?.map(l => <Line key={l.dataKey} type="monotone" dataKey={l.dataKey} stroke={l.color} strokeWidth={2.5} dot={false} name={l.name || l.dataKey} />)}
                {bars && bars.length > 1 && renderLegend(bars)}
                {lines && lines.length > 1 && renderLegend(lines)}
              </BarChart>
            )}
          </ResponsiveContainer>
          {children}
        </>
      )}
    </section>
  )
}
