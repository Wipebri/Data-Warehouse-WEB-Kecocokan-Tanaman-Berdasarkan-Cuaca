import { useState, useEffect } from 'react'
import { BarChart2, Leaf, Droplets, Thermometer, AlertTriangle } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [history, setHistory] = useState<Array<any>>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(history.length / perPage));
  const pageData = history.slice((page - 1) * perPage, page * perPage);

  const [kpiLocation, setKpiLocation] = useState('');
  const [kpiDetecting, setKpiDetecting] = useState(true);
  const [kpiWeather, setKpiWeather] = useState<any>(null);

  const refresh = () => {
    try {
      const data = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      setHistory(data); setPage(1);
    } catch { setHistory([]); }
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/reports', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.reports && d.reports.length > 0) setHistory(d.reports); })
        .catch(() => {})
    }
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!navigator.geolocation) throw new Error();
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        const res = await fetch(`/api/weather/nearest?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
        const nearest = await res.json();
        if (!mounted) return;
        setKpiLocation(nearest.city || 'Jakarta');
      } catch {
        if (!mounted) return;
        setKpiLocation('Jakarta');
      } finally {
        if (mounted) setKpiDetecting(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!kpiLocation) return;
    fetch(`/api/weather?city=${kpiLocation}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setKpiWeather(d); })
      .catch(() => {});
  }, [kpiLocation]);

  const hourlyData: Array<any> = kpiWeather?.hourly ?? [];
  const dayMap: Record<string, any[]> = {};
  hourlyData.forEach((h: any) => {
    if (!dayMap[h.date]) dayMap[h.date] = [];
    dayMap[h.date].push(h);
  });
  const dailySpark = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, entries]) => ({
    date,
    label: new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    suhu: Math.round(entries.reduce((s, h: any) => s + (h.temperature ?? 0), 0) / entries.length * 10) / 10,
    hujan: Math.round(entries.reduce((s, h: any) => s + (h.rainfall ?? 0), 0) * 10) / 10,
  }));
  const latestTemp = hourlyData.length > 0 ? hourlyData[hourlyData.length - 1].temperature ?? 0 : 0;
  const totalRainKpi = Math.round(dailySpark.reduce((s, d) => s + d.hujan, 0) * 10) / 10;
  const bestAnalysis = history.length > 0 ? history.reduce((best: any, curr: any) => (curr.score > best.score ? curr : best), history[0]) : null;
  const analysisCount = history.length;
  const sparkDates = dailySpark.length > 1
    ? `${dailySpark[0].label} – ${dailySpark[dailySpark.length - 1].label}`
    : dailySpark.length === 1 ? dailySpark[0].label : '';

  const mid = Math.max(1, Math.floor(dailySpark.length / 2));
  const recentSlice = dailySpark.slice(mid);
  const prevSlice = dailySpark.slice(0, mid);
  const recentAvg = recentSlice.length ? recentSlice.reduce((s, d) => s + d.suhu, 0) / recentSlice.length : 0;
  const prevAvg = prevSlice.length ? prevSlice.reduce((s, d) => s + d.suhu, 0) / prevSlice.length : 0;
  const tempDiff = Math.round((recentAvg - prevAvg) * 10) / 10;

  const avgHum = hourlyData.length ? Math.round(hourlyData.reduce((s: number, h: any) => s + (h.humidity ?? 0), 0) / hourlyData.length) : 0;

  const insights: string[] = [];
  if (dailySpark.length >= 4) {
    if (tempDiff > 1) insights.push(`Suhu ${tempDiff}°C lebih panas dari periode sebelumnya.`);
    else if (tempDiff < -1) insights.push(`Suhu ${Math.abs(tempDiff)}°C lebih dingin dari periode sebelumnya.`);
    else insights.push(`Suhu relatif stabil dalam beberapa hari terakhir.`);
  }
  if (avgHum >= 60 && avgHum <= 80) {
    insights.push(`Kelembapan rata-rata ${avgHum}% berada dalam rentang optimal untuk sebagian besar tanaman.`);
  } else if (avgHum > 80) {
    insights.push(`Kelembapan rata-rata ${avgHum}% cukup tinggi — waspada risiko penyakit jamur.`);
  } else if (avgHum > 0) {
    insights.push(`Kelembapan rata-rata ${avgHum}% cukup rendah — perhatikan kebutuhan irigasi.`);
  }
  if (totalRainKpi < 10 && dailySpark.length > 0) {
    insights.push(`Curah hujan total ${totalRainKpi} mm rendah — tanaman mungkin memerlukan irigasi tambahan.`);
  } else if (totalRainKpi > 50 && dailySpark.length > 0) {
    insights.push(`Curah hujan total ${totalRainKpi} mm cukup tinggi — pastikan drainase lahan baik.`);
  }
  if (bestAnalysis) {
    insights.push(`Tanaman terbaik: ${bestAnalysis.cropLabel} dengan skor ${bestAnalysis.score}%.`);
  }

  const [showClearModal, setShowClearModal] = useState(false);

  const confirmClear = () => {
    localStorage.removeItem('analysisHistory');
    setHistory([]);
    setPage(1);
    setShowClearModal(false);
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/reports', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {})
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analisis-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportCsv = () => {
    const header = 'Tanggal,Tanaman,Lokasi,Skor,Label,Suhu,Kelembapan,StresPanas,RisikoPenyakit,KetersediaanAir';
    const rows = history.map((e: any) =>
      `"${new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}","${e.cropLabel}","${e.location}",${e.score},"${e.label}",${e.temp},${e.hum}","${e.heatStress || ''}","${e.diseaseRisk || ''}","${e.water || ''}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analisis-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1240px]">
        {(!kpiDetecting || kpiWeather) && (
          <section className="mb-8 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
            <h2 className="mb-4 text-3xl font-black sm:text-4xl">Dashboard Ringkasan</h2>
            <p className="mb-4 text-xs font-bold text-neutral-500">{kpiLocation}{sparkDates ? ` · ${sparkDates}` : ''}</p>
            <div className="mb-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Thermometer size={18} className="text-orange-500" />
                  <p className="text-[11px] font-black text-neutral-500">Suhu Rata-rata</p>
                </div>
                <p className="text-3xl font-black text-orange-600">{latestTemp}°C</p>
                {dailySpark.length > 1 && (
                  <div className="mt-2 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySpark}>
                        <Line type="monotone" dataKey="suhu" stroke="#ff6b35" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Droplets size={18} className="text-blue-500" />
                  <p className="text-[11px] font-black text-neutral-500">Curah Hujan (7 Hari)</p>
                </div>
                <p className="text-3xl font-black text-blue-600">{totalRainKpi} mm</p>
                {dailySpark.length > 1 && (
                  <div className="mt-2 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySpark}>
                        <Line type="monotone" dataKey="hujan" stroke="#34daff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Leaf size={18} className="text-green-500" />
                  <p className="text-[11px] font-black text-neutral-500">Tanaman Terbaik</p>
                </div>
                <p className="text-2xl font-black text-green-700">{bestAnalysis?.cropLabel || '-'}</p>
                <p className="text-xs text-neutral-500">Skor {bestAnalysis?.score ?? 0}%</p>
              </div>
              <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <BarChart2 size={18} className="text-purple-500" />
                  <p className="text-[11px] font-black text-neutral-500">Analisis Tersimpan</p>
                </div>
                <p className="text-3xl font-black text-purple-600">{analysisCount}</p>
                <p className="text-xs text-neutral-500">Riwayat analisis</p>
              </div>
            </div>
            {insights.length > 0 && (
              <div className="rounded-lg border-[2px] border-black bg-[#f8f8f3] p-3">
                <p className="mb-1 text-[10px] font-black text-neutral-500">INSIGHT</p>
                <ul className="space-y-1">
                  {insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bold">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                      {ins}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="mb-8 rounded-2xl border-[4px] border-black bg-white shadow-[8px_8px_0_#000]">
          <div className="flex flex-wrap items-end justify-between gap-4 p-6">
            <div>
              <h1 className="text-xl font-black">Riwayat Analisis</h1>
              <p className="mt-1 text-sm text-neutral-700">Semua hasil analisis tanaman yang telah dilakukan tersimpan di sini.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={refresh} className="rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Segarkan
              </button>
              <button onClick={exportJson} disabled={history.length === 0} className="rounded-lg border-[3px] border-black bg-[#d6ff24] px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40">
                JSON
              </button>
              <button onClick={exportCsv} disabled={history.length === 0} className="rounded-lg border-[3px] border-black bg-[#4de4ff] px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40">
                CSV
              </button>
              <button onClick={() => setShowClearModal(true)} disabled={history.length === 0} className="rounded-lg border-[3px] border-black bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40">
                Hapus Semua
              </button>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="border-t-[3px] border-black p-12 text-center">
              <BarChart2 className="mx-auto mb-4 text-neutral-300" size={48} />
              <h2 className="text-xl font-black text-neutral-400">Belum Ada Analisis</h2>
              <p className="mt-2 text-sm text-neutral-500">Lakukan analisis tanaman di halaman Analisis Tanaman, hasilnya akan muncul di sini.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-t-[3px] border-black">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-[3px] border-black">
                      <th className="whitespace-nowrap px-2 py-3 text-left font-black text-neutral-500">#</th>
                      <th className="whitespace-nowrap px-2 py-3 text-left font-black text-neutral-500">Tanggal</th>
                      <th className="whitespace-nowrap px-2 py-3 text-left font-black text-neutral-500">Tanaman</th>
                      <th className="whitespace-nowrap px-2 py-3 text-left font-black text-neutral-500">Lokasi</th>
                      <th className="whitespace-nowrap px-2 py-3 text-center font-black text-neutral-500">Skor</th>
                      <th className="whitespace-nowrap px-2 py-3 text-center font-black text-neutral-500">Kesesuaian</th>
                      <th className="whitespace-nowrap px-2 py-3 text-center font-black text-neutral-500">Stres Panas</th>
                      <th className="whitespace-nowrap px-2 py-3 text-center font-black text-neutral-500">Risiko Penyakit</th>
                      <th className="whitespace-nowrap px-2 py-3 text-center font-black text-neutral-500">Ketersediaan Air</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.length === 0 ? (
                      <tr><td colSpan={9} className="py-8 text-center text-sm font-black text-neutral-400">Tidak ada data</td></tr>
                    ) : pageData.map((entry: any, idx: number) => {
                      const scoreBadge = entry.score >= 60 ? 'bg-green-200 text-green-800' : entry.score >= 35 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800';
                      const labelCls = entry.score >= 60 ? 'text-green-700' : entry.score >= 35 ? 'text-yellow-600' : 'text-red-600';
                      return (
                        <tr key={entry.id} className="border-b-[2px] border-black/20 hover:bg-[#f8f8f3]">
                          <td className="px-2 py-3 font-black text-neutral-400">{(page - 1) * perPage + idx + 1}</td>
                          <td className="whitespace-nowrap px-2 py-3">{new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="whitespace-nowrap px-2 py-3 font-black">{entry.cropLabel}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-neutral-600">{entry.location}</td>
                          <td className="px-2 py-3 text-center">
                            <span className={`inline-block rounded-md border-[2px] border-black px-2 py-0.5 text-xs font-black ${scoreBadge}`}>{entry.score}%</span>
                          </td>
                          <td className={`whitespace-nowrap px-2 py-3 text-center font-black ${labelCls}`}>{entry.label}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-center">{entry.heatStress || '-'}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-center">{entry.diseaseRisk || '-'}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-center">{entry.water || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t-[3px] border-black px-4 py-3">
                <p className="text-xs text-neutral-500">Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, history.length)} dari {history.length}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#000]">
                    Sebelumnya
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-30 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_#000]">
                    Selanjutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowClearModal(false)}>
          <div className="w-full max-w-[360px] rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-red-500 shadow-[3px_3px_0_#000]">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <h2 className="text-center text-xl font-black">Hapus Semua Riwayat?</h2>
            <p className="mt-1 text-center text-xs text-neutral-500">Data yang sudah dihapus tidak dapat dikembalikan.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowClearModal(false)} className="flex-1 rounded-xl border-[3px] border-black bg-white py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Batal
              </button>
              <button onClick={confirmClear} className="flex-1 rounded-xl border-[3px] border-black bg-red-500 py-2 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
