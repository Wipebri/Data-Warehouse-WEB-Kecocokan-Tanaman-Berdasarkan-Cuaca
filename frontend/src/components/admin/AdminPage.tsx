import { useState, useEffect, useCallback } from 'react'
import { LogOut } from 'lucide-react'
import { CROP_LABELS, PIE_COLORS } from '../../data/constants'
import type { PageKey, BIFilter } from '../../types'
import GlobalFilterBar from './bi/GlobalFilterBar'
import KpiCardWithSparkline from './bi/KpiCardWithSparkline'
import BIChart from './bi/BIChart'
import DrillDownModal from './bi/DrillDownModal'
import ExportBar from './bi/ExportBar'
import UserManagement from './UserManagement'
import DwScatterChart from './bi/DwScatterChart'
import DwOptimalZones from './bi/DwOptimalZones'

type Tab = 'bi' | 'dw' | 'users'

export default function AdminPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) as { name: string; email: string; role?: string } : null
  const isSuper = user?.role === 'superadmin'
  const token = localStorage.getItem('token')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const [tab, setTab] = useState<Tab>('bi')
  const [filter, setFilter] = useState<BIFilter>({ days: 30, crops: [], location: '' })
  const [cropOptions] = useState<string[]>(Object.values(CROP_LABELS))
  const [locationOptions, setLocationOptions] = useState<string[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [scoreDist, setScoreDist] = useState<any[]>([])
  const [compare, setCompare] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [drill, setDrill] = useState({ open: false, title: '', url: '' })
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const cropParam = filter.crops.join(',')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const q = new URLSearchParams()
    q.set('days', String(filter.days))
    if (cropParam) q.set('crop', cropParam)
    if (filter.location) q.set('location', filter.location)
    const qs = q.toString()

    try {
      const [ovRes, tlRes, sdRes, cpRes] = await Promise.all([
        fetch(`/api/admin/bi/overview?${qs}`, { headers: authHeaders }),
        fetch(`/api/admin/bi/timeline?${qs}`, { headers: authHeaders }),
        fetch(`/api/admin/bi/score-distribution?${qs}`, { headers: authHeaders }),
        fetch(`/api/admin/bi/compare?period=month${cropParam ? '&crop=' + cropParam : ''}${filter.location ? '&location=' + filter.location : ''}`, { headers: authHeaders }),
      ])
      const ov = await ovRes.json()
      const tl = await tlRes.json()
      const sd = await sdRes.json()
      const cp = await cpRes.json()
      setOverview(ov)
      setTimeline(tl.data || [])
      setScoreDist(sd.data || [])
      setCompare(cp)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [filter.days, cropParam, filter.location])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    fetch('/api/admin/stats', { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        const locs = (d.topLocations || []).map((l: any) => l.location).filter(Boolean)
        if (locs.length) setLocationOptions(locs)
      })
      .catch(() => {})
  }, [])

  const sparklineData = (overview?.trend || []).map((t: any) => ({ v: t.count }))
  const compareDelta = compare
    ? {
        value: `${compare.current.avgScore || 0}% vs ${compare.previous.avgScore || 0}%`,
        positive: (compare.current.avgScore || 0) >= (compare.previous.avgScore || 0),
      }
    : null

  const openDrill = (title: string, extraParams = '') => {
    const q = new URLSearchParams()
    q.set('days', String(filter.days))
    if (cropParam) q.set('crop', cropParam)
    if (filter.location) q.set('location', filter.location)
    const url = `/api/admin/bi/drill-down?${q.toString()}${extraParams}`
    setDrill({ open: true, title, url })
  }

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} className={`rounded-lg border-[3px] border-black px-4 py-1.5 text-xs font-black transition-all ${tab === t ? 'bg-[#d6ff24] shadow-[3px_3px_0_#000]' : 'bg-white'}`}>
      {label}
    </button>
  )

  return (
    <main className="min-h-screen bg-[#f6f6ee] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <section className="mb-5 rounded-2xl border-[4px] border-black bg-white p-5 shadow-[8px_8px_0_#000]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">Executive Dashboard</h1>
              <p className="mt-1 text-xs text-neutral-500">{user?.name} &middot; {user?.email}</p>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#000] transition-all hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabBtn('bi', 'Performance Overview')}
            {tabBtn('dw', 'Data Explorer')}
            {isSuper && tabBtn('users', 'User Management')}
          </div>
        </section>

        {tab === 'dw' && (
          <div className="space-y-5">
            <DwScatterChart />
            <DwOptimalZones />
          </div>
        )}

        {tab === 'users' && isSuper && <UserManagement />}

        {tab === 'bi' && (
          <>
            <div className="mb-5">
              <GlobalFilterBar filter={filter} onChange={setFilter} cropOptions={cropOptions} locationOptions={locationOptions} />
            </div>

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
              </div>
            )}

            {!loading && overview && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCardWithSparkline title="Total Analisis" value={overview.totalReports} sparklineData={sparklineData} />
                  <KpiCardWithSparkline title="Rata-rata Skor" value={`${overview.avgScore || 0}%`} subtitle="dari semua prediksi" delta={compareDelta} sparklineData={sparklineData} sparklineColor="#ffb703" />
                  <KpiCardWithSparkline title="Tanaman Teratas" value={overview.topCrops} subtitle="paling sering dianalisis" sparklineData={sparklineData} sparklineColor="#4de4ff" />
                  <KpiCardWithSparkline title="Lokasi Aktif" value={overview.activeLocations} subtitle="lokasi berbeda" sparklineData={sparklineData} sparklineColor="#ef4444" />
                </div>

                <BIChart
                  title="Analisis per Hari"
                  type="bar"
                  data={timeline}
                  xKey="date"
                  bars={[{ dataKey: 'count', color: '#2ca63d', name: 'Jumlah Analisis' }]}
                  syncId="agro-bi"
                  height={280}
                  onSegmentClick={(entry) => openDrill(`Detail — ${entry.date}`, `&dateFrom=${entry.date}&dateTo=${entry.date}`)}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <BIChart
                    title="Distribusi Skor Kesesuaian"
                    type="pie"
                    data={scoreDist}
                    pieDataKey="count"
                    pieNameKey="range"
                    pieColors={PIE_COLORS}
                    height={300}
                    onSegmentClick={(entry) => openDrill(`Detail — Skor ${entry.range}`, `&dateFrom=${new Date(Date.now() - filter.days * 86400000).toISOString().split('T')[0]}`)}
                  />

                  <BIChart
                    title="Perbandingan Periode"
                    type="bar"
                    data={compare ? [
                      { name: compare.previous?.period || 'Periode Lalu', count: compare.previous?.count || 0, avg: compare.previous?.avgScore || 0 },
                      { name: compare.current?.period || 'Periode Ini', count: compare.current?.count || 0, avg: compare.current?.avgScore || 0 },
                    ] : []}
                    xKey="name"
                    bars={[
                      { dataKey: 'count', color: '#2ca63d', name: 'Jumlah' },
                      { dataKey: 'avg', color: '#ffb703', name: 'Rata-rata' },
                    ]}
                    syncId="agro-bi"
                    height={280}
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#000]">
                  <p className="text-xs font-black">Ekspor Data</p>
                  <ExportBar filter={filter} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <DrillDownModal open={drill.open} onClose={() => setDrill({ open: false, title: '', url: '' })} title={drill.title} fetchUrl={drill.url} />

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
          <div className="w-full max-w-[360px] rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-red-500 shadow-[3px_3px_0_#000]">
              <LogOut size={20} className="text-white" />
            </div>
            <h2 className="text-center text-xl font-black">Yakin ingin keluar?</h2>
            <p className="mt-1 text-center text-xs text-neutral-500">Anda akan kembali ke beranda</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 rounded-xl border-[3px] border-black bg-white py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Tidak
              </button>
              <button onClick={() => { setShowLogoutModal(false); localStorage.clear(); onNavigate('beranda') }} className="flex-1 rounded-xl border-[3px] border-black bg-red-500 py-2 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
