import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  delta?: { value: string; positive: boolean } | null
  sparklineData: { v: number }[]
  sparklineColor?: string
}

export default function KpiCardWithSparkline({ title, value, subtitle, delta, sparklineData, sparklineColor = '#2ca63d' }: Props) {
  return (
    <div className="rounded-2xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#000]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-black text-neutral-500">{title}</p>
          <p className="mt-0.5 text-3xl font-black">{value}</p>
          {subtitle && <p className="text-[10px] text-neutral-500">{subtitle}</p>}
          {delta && (
            <p className={`mt-1 text-[10px] font-black ${delta.positive ? 'text-green-600' : 'text-red-500'}`}>
              {delta.positive ? '▲' : '▼'} {delta.value}
            </p>
          )}
        </div>
        <div className="h-14 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparklineColor} strokeWidth={2} fill={`url(#grad-${title.replace(/\s/g, '')})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
