import { useState, useEffect } from 'react'
import { MapPin, Thermometer, Droplets, CloudSun, Wind, TrendingUp, Gauge } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function HistoricalDataPage() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [_selectedSubdistrict] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [_locationReady, setLocationReady] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('semua');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!navigator.geolocation) throw new Error('Browser tidak mendukung geolocation');
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
        );
        const { latitude, longitude } = position.coords;
        const nearestRes = await fetch(`/api/weather/nearest?lat=${latitude}&lng=${longitude}`);
        const nearest = await nearestRes.json();
        if (!nearestRes.ok || !nearest?.city) throw new Error('Tidak dapat menentukan kota terdekat');
        if (!mounted) return;
        setSelectedLocation(nearest.city);
        setLocationReady(true);
      } catch {
        if (!mounted) return;
        setSelectedLocation('Jakarta');
        setLocationReady(true);
      } finally {
        if (mounted) setDetectingLocation(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    setLoading(true);
    setError('');
    fetch(`/api/weather?city=${selectedLocation}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setWeatherData(data);
      })
      .catch(() => setError('Gagal memuat data cuaca'))
      .finally(() => setLoading(false));
  }, [selectedLocation]);

  const hourlyData: Array<any> = weatherData?.hourly ?? [];

  const singleMetrics = [
    { key: 'temperature', label: 'Suhu (°C)', color: '#ff6b35', icon: Thermometer },
    { key: 'humidity', label: 'Kelembapan (%)', color: '#4de4ff', icon: Droplets },
    { key: 'rainfall', label: 'Curah Hujan (mm)', color: '#34daff', icon: CloudSun },
    { key: 'windSpeed', label: 'Kecepatan Angin (km/h)', color: '#86e58f', icon: Wind },
  ];

  const showSingle = selectedMetric !== 'semua';
  const currentMetric = singleMetrics.find(m => m.key === selectedMetric)!;

  const values = showSingle ? hourlyData.map((h: any) => h[selectedMetric] ?? 0) : [];
  const avgValue = values.length ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length * 10) / 10 : 0;
  const maxValue = values.length ? Math.round(Math.max(...values) * 10) / 10 : 0;
  const minValue = values.length ? Math.round(Math.min(...values) * 10) / 10 : 0;

  const chartData = hourlyData.map((h: any) => ({
    name: new Date(h.datetime.replace(' ', 'T')).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', hour: '2-digit' }),
    temperature: h.temperature ?? 0,
    humidity: h.humidity ?? 0,
    rainfall: h.rainfall ?? 0,
    windSpeed: h.windSpeed ?? 0,
  }));

  const dayGroups = hourlyData.reduce((groups: any, h: any) => {
    const d = h.date;
    if (!groups[d]) groups[d] = [];
    groups[d].push(h);
    return groups;
  }, {} as Record<string, any[]>);

  const rainClasses = [
    { label: 'Ringan', min: 0, max: 2.5, color: '#86e58f' },
    { label: 'Sedang', min: 2.5, max: 10, color: '#4de4ff' },
    { label: 'Lebat', min: 10, max: 20, color: '#f59e0b' },
    { label: 'Ekstrem', min: 20, max: Infinity, color: '#ef4444' },
  ];
  const rainCounts = rainClasses.map(c => ({
    ...c,
    count: hourlyData.filter((h: any) => {
      const r = h.rainfall ?? 0;
      if (c.max === Infinity) return r >= c.min;
      return r >= c.min && r < c.max;
    }).length,
  }));
  const totalRainfall = Math.round(hourlyData.reduce((s: number, h: any) => s + (h.rainfall ?? 0), 0) * 10) / 10;
  const rainDays = hourlyData.filter((h: any) => (h.rainfall ?? 0) > 0).length;

  const uniqueDates = [...new Set(hourlyData.map((h: any) => h.date))].sort();
  const dataRangeStr = uniqueDates.length > 1
    ? `${new Date(uniqueDates[0] + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(uniqueDates[uniqueDates.length - 1] + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : uniqueDates.length === 1
      ? new Date(uniqueDates[0] + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
  const hasTrendData = uniqueDates.length >= 4;
  const thirdLatest = uniqueDates[Math.max(0, uniqueDates.length - 3)];
  const latestDate = uniqueDates[uniqueDates.length - 1];
  const recentData = hourlyData.filter((h: any) => h.date >= thirdLatest && h.date <= latestDate);
  const prevData = hourlyData.filter((h: any) => h.date < thirdLatest);
  const trends = [
    { key: 'temperature', label: 'Suhu', unit: '°C', color: '#ff6b35' },
    { key: 'humidity', label: 'Kelembapan', unit: '%', color: '#4de4ff' },
    { key: 'rainfall', label: 'Curah Hujan', unit: 'mm', color: '#34daff' },
    { key: 'windSpeed', label: 'Angin', unit: 'km/h', color: '#86e58f' },
  ].map(m => {
    const prevAvg = prevData.length ? prevData.reduce((s: number, h: any) => s + (h[m.key] ?? 0), 0) / prevData.length : 0;
    const recentAvg = recentData.length ? recentData.reduce((s: number, h: any) => s + (h[m.key] ?? 0), 0) / recentData.length : 0;
    const diff = recentAvg - prevAvg;
    return { ...m, prevAvg: Math.round(prevAvg * 10) / 10, recentAvg: Math.round(recentAvg * 10) / 10, diff: Math.round(diff * 10) / 10 };
  });

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <section className="mb-8 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Data Historis Cuaca</h1>
          <p className="mt-2 text-sm text-neutral-700">Data cuaca detail dari BMKG dengan resolusi 3 jam.</p>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-black">Lokasi</label>
            <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-4 py-3 shadow-[3px_3px_0_#000]">
              <MapPin size={16} />
              <p className="text-sm font-bold">
                {detectingLocation ? 'Mendeteksi lokasi...' : selectedLocation || 'Lokasi tidak tersedia'}
              </p>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black">Metrik</label>
            <select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value)}
              className="w-full rounded-xl border-[3px] border-black bg-white px-4 py-3 text-sm font-bold shadow-[3px_3px_0_#000] outline-none"
            >
              <option value="semua">{showSingle ? '- Semua Metrik -' : 'Semua Metrik'}</option>
              {singleMetrics.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setLocationReady(false); setDetectingLocation(true); setSelectedLocation(''); window.location.reload(); }}
              className="w-full rounded-xl border-[3px] border-black bg-[#d6ff24] px-4 py-3 text-sm font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Deteksi Ulang Lokasi
            </button>
          </div>
        </div>

        {loading && (
          <div className="mb-6 rounded-2xl border-[4px] border-black bg-white p-8 text-center shadow-[8px_8px_0_#000]">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
            <p className="text-sm font-black">Memuat data...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border-[3px] border-black bg-red-100 p-3 text-xs font-bold text-red-700">{error}</div>
        )}

        {!loading && !error && hourlyData.length === 0 && (
          <div className="mb-6 rounded-2xl border-[4px] border-black bg-white p-8 text-center shadow-[8px_8px_0_#000]">
            <p className="text-sm font-black text-neutral-500">Mohon tunggu, mendeteksi lokasi...</p>
          </div>
        )}

        {!loading && !error && hourlyData.length > 0 && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <div className="mb-3 flex items-center gap-2">
                  <Droplets size={20} className="text-blue-500" />
                  <h3 className="text-sm font-black">Klasifikasi Curah Hujan</h3>
                </div>
                <p className="mb-3 text-[10px] font-bold text-neutral-500">{dataRangeStr}</p>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  {rainCounts.map(r => (
                    <div key={r.label} className="rounded-lg border-[2px] border-black bg-[#f8f8f3] p-2 text-center">
                      <p className="text-lg font-black" style={{ color: r.color }}>{r.count}</p>
                      <p className="text-[10px] font-black text-neutral-500">{r.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-neutral-500">
                  <span>{rainDays} kejadian hujan</span>
                  <span>Total: {totalRainfall} mm</span>
                </div>
              </section>

              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-purple-500" />
                  <h3 className="text-sm font-black">Kecenderungan (3 Hari Terakhir)</h3>
                </div>
                <div className="space-y-2">
                  {trends.map(t => {
                    const isUp = t.diff > 0;
                    const isDown = t.diff < 0;
                    return (
                      <div key={t.key} className="flex items-center justify-between rounded-lg border-[2px] border-black bg-[#f8f8f3] px-3 py-2">
                        <span className="text-xs font-black">{t.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-600">{t.recentAvg}{t.unit}</span>
                          {hasTrendData ? (
                            isUp ? (
                              <span className="flex items-center gap-0.5 text-xs font-black text-red-500">
                                <TrendingUp size={12} />+{Math.abs(t.diff)}{t.unit}
                              </span>
                            ) : isDown ? (
                              <span className="flex items-center gap-0.5 text-xs font-black text-blue-500">
                                <TrendingUp size={12} className="rotate-180" />-{Math.abs(t.diff)}{t.unit}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">&mdash;</span>
                            )
                          ) : (
                            <span className="text-xs text-neutral-400">&mdash;</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {showSingle ? (
              <>
                <div className="mb-6 grid gap-5 md:grid-cols-4">
                  <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                    <div className="mb-3 flex items-center gap-2">
                      <currentMetric.icon size={20} style={{ color: currentMetric.color }} />
                      <h3 className="text-sm font-black">Rata-rata</h3>
                    </div>
                    <p className="text-2xl font-black" style={{ color: currentMetric.color }}>{avgValue}</p>
                    <p className="text-xs text-neutral-600">{currentMetric.label.split('(')[1]}</p>
                  </div>
                  <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-600" />
                      <h3 className="text-sm font-black">Maksimum</h3>
                    </div>
                    <p className="text-2xl font-black text-green-600">{maxValue}</p>
                    <p className="text-xs text-neutral-600">{currentMetric.label.split('(')[1]}</p>
                  </div>
                  <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                    <div className="mb-3 flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600 rotate-180" />
                      <h3 className="text-sm font-black">Minimum</h3>
                    </div>
                    <p className="text-2xl font-black text-blue-600">{minValue}</p>
                    <p className="text-xs text-neutral-600">{currentMetric.label.split('(')[1]}</p>
                  </div>
                  <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                    <div className="mb-3 flex items-center gap-2">
                      <Gauge size={20} className="text-purple-600" />
                      <h3 className="text-sm font-black">Range</h3>
                    </div>
                    <p className="text-2xl font-black text-purple-600">{Math.round((maxValue - minValue) * 10) / 10}</p>
                    <p className="text-xs text-neutral-600">{currentMetric.label.split('(')[1]}</p>
                  </div>
                </div>

                <section className="mb-6 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
                  <h2 className="mb-4 text-xl font-black">Tren {currentMetric.label}</h2>
                  <div className="h-80 rounded-xl border-[3px] border-black bg-[#f8f8f3] p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" label={{ value: 'Waktu', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold', fontSize: 10, fill: '#555' } }} />
                        <YAxis tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="#333" label={{ value: currentMetric.label, angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', fontSize: 11, fill: '#555' } }} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: '3px solid black', borderRadius: '8px', boxShadow: '4px 4px 0 black', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey={selectedMetric} stroke={currentMetric.color} strokeWidth={3} dot={{ fill: currentMetric.color, strokeWidth: 2, r: 3 }} activeDot={{ r: 5, stroke: currentMetric.color, strokeWidth: 2 }} name={currentMetric.label} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </>
            ) : (
              <section className="mb-6 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
                <h2 className="mb-4 text-xl font-black">Semua Metrik</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {singleMetrics.map(m => {
                    const vals = hourlyData.map((h: any) => h[m.key] ?? 0);
                    const mChartData = hourlyData.map((h: any) => ({ name: new Date(h.datetime.replace(' ', 'T')).toLocaleDateString('id-ID', { day: 'numeric', hour: '2-digit' }), value: h[m.key] ?? 0 }));
                    return (
                      <div key={m.key} className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-black">{m.label}</p>
                          <p className="text-xs font-black" style={{ color: m.color }}>{Math.round(Math.max(...vals) * 10) / 10} max</p>
                        </div>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mChartData}>
                              <CartesianGrid strokeDasharray="2 2" stroke="#ddd" />
                              <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 'bold' }} stroke="#999" label={{ value: 'Waktu', position: 'insideBottom', offset: -2, style: { fontWeight: 'bold', fontSize: 7, fill: '#888' } }} />
                              <YAxis tick={{ fontSize: 8, fontWeight: 'bold' }} stroke="#999" label={{ value: m.label.split('(')[0].trim(), angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', fontSize: 7, fill: '#888' } }} />
                              <Line type="monotone" dataKey="value" stroke={m.color} strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
              <h2 className="mb-4 text-xl font-black">Rincian Per Hari</h2>
              <div className="space-y-4">
                {Object.keys(dayGroups).sort().map(date => {
                  const dayEntries = dayGroups[date];
                  const temps = dayEntries.map((h: any) => h.temperature ?? 0);
                  const hums = dayEntries.map((h: any) => h.humidity ?? 0);
                  dayEntries.map((h: any) => h.rainfall ?? 0);
                  dayEntries.map((h: any) => h.windSpeed ?? 0);
                  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
                  return (
                    <details key={date} className="group rounded-xl border-[3px] border-black bg-[#f8f8f3]">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black">{dateLabel}</span>
                          <span className="hidden text-xs text-neutral-400 sm:inline">
                            {Math.round(hums.reduce((a: number, b: number) => a + b, 0) / hums.length)}% RH
                          </span>
                        </div>
                        <span className="text-xs font-black text-neutral-500">
                          {Math.round(Math.min(...temps))}&deg; - {Math.round(Math.max(...temps))}&deg;
                        </span>
                      </summary>
                      <div className="border-t-[3px] border-black px-4 py-3">
                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          {dayEntries.map((h: any) => (
                            <div key={h.datetime} className="rounded-lg border-[2px] border-black bg-white p-2 text-center">
                              <p className="font-black">{h.hour}:00</p>
                              <div className="mt-1 space-y-0.5">
                                <p><span className="font-black">{h.temperature}&deg;C</span></p>
                                <p className="text-neutral-500">RH {h.humidity}%</p>
                                <p className="text-neutral-500">{h.rainfall > 0 ? `${h.rainfall}mm` : '-'}</p>
                                <p className="text-neutral-500">{h.windSpeed ? `${h.windSpeed} km/h` : '-'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
