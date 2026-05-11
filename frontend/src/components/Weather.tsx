import { useEffect, useState } from 'react';
import {
  CloudSun, MapPin, Sun, Thermometer, Wind, Droplets, Eye, RefreshCw, AlertTriangle,
  Calendar,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, LineChart, Line,
} from 'recharts';

interface HourlyEntry {
  datetime: string;
  date: string;
  hour: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  conditionCode: number;
  condition: string;
}

interface CurrentWeather {
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
  conditionCode: number;
  windSpeed: number;
  windDirection: string;
  local_datetime?: string;
  temperatureMin?: number;
  temperatureMax?: number;
}

interface ForecastDay {
  date: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
  conditionCode: number;
  windSpeed: number;
  windDirection: string;
  temperatureMin: number;
  temperatureMax: number;
}

interface WeatherData {
  location: string;
  lat: number;
  lng: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  weather_desc: string;
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  hourly: HourlyEntry[];
  analysis_date: string;
}

function WeatherIcon({ code, size = 24 }: { code?: number; size?: number }) {
  const icons: Record<number, React.ReactNode> = {
    0: <Sun size={size} className="text-yellow-500" />,
    1: <Sun size={size} className="text-yellow-500" />,
    2: <CloudSun size={size} className="text-gray-500" />,
    3: <CloudSun size={size} className="text-gray-500" />,
    4: <CloudSun size={size} className="text-gray-600" />,
    10: <AlertTriangle size={size} className="text-gray-400" />,
    45: <Eye size={size} className="text-gray-400" />,
    60: <Droplets size={size} className="text-blue-500" />,
    61: <Droplets size={size} className="text-blue-600" />,
    62: <Droplets size={size} className="text-blue-700" />,
    80: <CloudSun size={size} className="text-purple-500" />,
    95: <CloudSun size={size} className="text-purple-600" />,
  };
  return icons[code ?? -1] || <Sun size={size} />;
}

function hourlyToChartData(hourly: HourlyEntry[]) {
  const now = new Date();
  const localOffset = 7;
  const localNow = new Date(now.getTime() + localOffset * 3600000);
  const cutoff = new Date(localNow.getTime() - 3 * 3600000);

  const filtered = hourly.filter(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const hh = h.hour;
    const dt = new Date(Date.UTC(y, m - 1, d, hh));
    return dt >= cutoff;
  });

  return filtered.slice(0, 24).map(h => ({
    label: `${h.date.slice(5)} ${String(h.hour).padStart(2, '0')}:00`,
    suhu: h.temperature,
    kelembapan: h.humidity,
    hujan: h.rainfall,
    angin: h.windSpeed,
    full: h,
  }));
}

function getNext24hStrip(hourly: HourlyEntry[]) {
  const now = new Date();
  const localOffset = 7;
  const localNow = new Date(now.getTime() + localOffset * 3600000);

  return hourly
    .filter(h => {
      const [y, m, d] = h.date.split('-').map(Number);
      const hh = h.hour;
      const dt = new Date(Date.UTC(y, m - 1, d, hh));
      return dt >= localNow;
    })
    .slice(0, 8)
    .map(h => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      code: h.conditionCode,
      temp: h.temperature,
      hujan: h.rainfall,
    }));
}

function computeHeatIndex(temp: number, hum: number): number {
  const t = temp;
  const r = hum;
  if (t < 27) return t;
  const hi = -8.784695 + 1.61139411 * t + 2.338549 * r - 0.14611605 * t * r - 0.012308094 * t * t - 0.016424828 * r * r + 0.002211732 * t * t * r + 0.00072546 * t * r * r - 0.000003582 * t * t * r * r;
  return Math.round(hi * 10) / 10;
}

function computeDewPoint(temp: number, hum: number): number {
  const a = 17.27;
  const b = 237.7;
  const gamma = (a * temp) / (b + temp) + Math.log(hum / 100);
  return Math.round((b * gamma) / (a - gamma) * 10) / 10;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detecting, setDetecting] = useState(true);
  const [satImg, setSatImg] = useState('');
  const [satLoading, setSatLoading] = useState(true);

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error('Gagal memuat data cuaca');
      const data = await res.json();
      setWeather(data);
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data cuaca');
    } finally {
      setLoading(false);
    }
  };

  const fetchSatellite = async () => {
    setSatLoading(true);
    setSatImg('');
    try {
      const res = await fetch('/api/satellite/himawari');
      if (res.ok) {
        const data = await res.json();
        if (data.url) setSatImg(data.url);
      }
    } catch {
    } finally {
      setSatLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setDetecting(true);
      try {
        if (!navigator.geolocation) throw new Error('Geolokasi tidak didukung');
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true }),
        );
        const nearestRes = await fetch(`/api/weather/nearest?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
        const nearest = await nearestRes.json();
        if (!nearestRes.ok || !nearest?.city) throw new Error('Lokasi tidak dikenal');
        if (!mounted) return;
        await Promise.all([fetchWeather(nearest.city), fetchSatellite()]);
      } catch {
        if (!mounted) return;
        await Promise.all([fetchWeather('Jakarta'), fetchSatellite()]);
      } finally {
        if (mounted) setDetecting(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    if (weather?.location) {
      setLoading(true);
      Promise.all([fetchWeather(weather.location), fetchSatellite()]);
    }
  };

  if (detecting) {
    return (
      <main className="flex items-center justify-center px-4 py-32">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-neutral-500" />
          <p className="text-sm font-bold text-neutral-600">Mendeteksi lokasi...</p>
        </div>
      </main>
    );
  }

  if (error && !weather) {
    return (
      <main className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[500px] rounded-2xl border-[4px] border-black bg-white p-8 text-center shadow-[8px_8px_0_#000]">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-black">Gagal Memuat Data</h2>
          <p className="mt-2 text-sm text-neutral-600">{error}</p>
          <button
            onClick={() => fetchWeather('Jakarta')}
            className="mt-6 w-full rounded-xl border-[3px] border-black bg-[#d6ff24] px-6 py-3 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  const current = weather?.current;
  const temp = current?.temperature ?? weather?.temperature ?? 0;
  const hum = current?.humidity ?? weather?.humidity ?? 0;
  const rain = current?.rainfall ?? weather?.rainfall ?? 0;
  const windSpd = current?.windSpeed ?? 0;
  const windDir = current?.windDirection ?? '';
  const cond = current?.condition || weather?.weather_desc || '-';
  const code = current?.conditionCode;
  const heatIndex = computeHeatIndex(temp, hum);
  const dewPoint = computeDewPoint(temp, hum);

  const hourlyChart = hourlyToChartData(weather?.hourly ?? []);
  const next24h = getNext24hStrip(weather?.hourly ?? []);
  const forecastDays = (weather?.forecast ?? []).slice(0, 3);

  const globalMin = Math.min(...forecastDays.map(d => d.temperatureMin ?? d.temperature));
  const globalMax = Math.max(...forecastDays.map(d => d.temperatureMax ?? d.temperature));
  const globalRange = globalMax - globalMin || 1;

  const chartEmpty = !hourlyChart.length;

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1240px] space-y-6">

        {/* Header */}
        <section className="flex flex-col gap-4 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Prakiraan Cuaca</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Data dari BMKG 
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-[#d6ff24] px-6 py-3 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </section>

        {/* Current Weather Hero */}
        <section className="rounded-2xl border-[4px] border-black bg-[#e8ff00] p-6 shadow-[8px_8px_0_#000]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <h2 className="text-2xl font-black">{weather?.location || '-'}</h2>
              </div>
              <p className="mt-1 text-xs text-neutral-700">
                {new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {weather?.analysis_date ? ` — Analisis: ${weather.analysis_date.slice(0, 10)}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WeatherIcon code={code} size={48} />
              <div>
                <p className="text-5xl font-black leading-none">{temp}°</p>
                <p className="mt-1 text-sm font-black">{cond}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Kelembapan', val: `${hum}%`, icon: Droplets, color: 'text-blue-600' },
              { label: 'Curah Hujan', val: `${rain} mm`, icon: Droplets, color: 'text-cyan-600' },
              { label: 'Angin', val: `${windSpd} km/h`, icon: Wind, color: 'text-green-600' },
              { label: 'Min / Max', val: `${current?.temperatureMin ?? '-'}° / ${current?.temperatureMax ?? '-'}°`, icon: Thermometer, color: 'text-red-600' },
              { label: 'Heat Index', val: `${heatIndex}°C`, icon: Sun, color: 'text-orange-500' },
              { label: 'Dew Point', val: `${dewPoint}°C`, icon: Droplets, color: 'text-indigo-500' },
              { label: 'Arah Angin', val: windDir || '-', icon: Wind, color: 'text-gray-600' },
              { label: 'Kondisi', val: cond, icon: CloudSun, color: 'text-gray-600' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border-[3px] border-black bg-white p-3 shadow-[4px_4px_0_#000]">
                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 uppercase">
                  <m.icon size={12} className={m.color} /> {m.label}
                </div>
                <p className="mt-1 text-lg font-black">{m.val}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Charts + Satellite Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: Charts Column */}
          <div className="space-y-6">
            {/* Chart 1: Temperature & Humidity */}
            <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
              <div className="mb-4 flex items-center justify-between border-b-4 border-black pb-4">
                <h2 className="text-lg font-black">Suhu & Kelembapan (3-Jam)</h2>
                <div className="flex items-center gap-4 text-[10px] font-black">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm border-2 border-black bg-[#ff6b35]" /> Suhu (°C)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm border-2 border-black bg-[#4de4ff]" /> Kelembapan (%)
                  </div>
                </div>
              </div>
              {chartEmpty ? (
                <div className="flex h-64 items-center justify-center rounded-xl border-[3px] border-black bg-[#f8f8f3]">
                  <p className="text-xs font-bold text-neutral-400">Data tidak tersedia</p>
                </div>
              ) : (
                  <div className="h-64 rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyChart}>
                      <defs>
                        <linearGradient id="suhuGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4de4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4de4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" interval={2} label={{ value: 'Waktu (3-Jam)', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold', fontSize: 9, fill: '#555' } }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" label={{ value: 'Nilai', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', fontSize: 10, fill: '#555' } }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white', border: '3px solid black', borderRadius: '8px',
                          boxShadow: '4px 4px 0 black', fontWeight: 'bold', fontSize: '10px',
                        }}
                      />
                      <Area type="monotone" dataKey="suhu" stroke="#ff6b35" strokeWidth={3} fill="url(#suhuGrad)" name="Suhu (°C)" dot={false} />
                      <Area type="monotone" dataKey="kelembapan" stroke="#4de4ff" strokeWidth={3} fill="url(#humGrad)" name="Kelembapan (%)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Chart 2: Rainfall */}
            <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
              <h2 className="mb-4 border-b-4 border-black pb-4 text-lg font-black">Curah Hujan (3-Jam)</h2>
              {chartEmpty ? (
                <div className="flex h-64 items-center justify-center rounded-xl border-[3px] border-black bg-[#f8f8f3]">
                  <p className="text-xs font-bold text-neutral-400">Data tidak tersedia</p>
                </div>
              ) : (
                <div className="h-64 rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" interval={2} label={{ value: 'Waktu (3-Jam)', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold', fontSize: 9, fill: '#555' } }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" label={{ value: 'Curah Hujan (mm)', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', fontSize: 10, fill: '#555' } }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white', border: '3px solid black', borderRadius: '8px',
                          boxShadow: '4px 4px 0 black', fontWeight: 'bold', fontSize: '10px',
                        }}
                      />
                      <Bar dataKey="hujan" fill="#34daff" stroke="#000" strokeWidth={2} name="Hujan (mm)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Chart 3: Wind Speed */}
            <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
              <h2 className="mb-4 border-b-4 border-black pb-4 text-lg font-black">Kecepatan Angin (3-Jam)</h2>
              {chartEmpty ? (
                <div className="flex h-64 items-center justify-center rounded-xl border-[3px] border-black bg-[#f8f8f3]">
                  <p className="text-xs font-bold text-neutral-400">Data tidak tersedia</p>
                </div>
              ) : (
                <div className="h-64 rounded-xl border-[3px] border-black bg-[#f8f8f3] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" interval={2} label={{ value: 'Waktu (3-Jam)', position: 'insideBottom', offset: -5, style: { fontWeight: 'bold', fontSize: 9, fill: '#555' } }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#333" label={{ value: 'Kecepatan (km/h)', angle: -90, position: 'insideLeft', style: { fontWeight: 'bold', fontSize: 10, fill: '#555' } }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white', border: '3px solid black', borderRadius: '8px',
                          boxShadow: '4px 4px 0 black', fontWeight: 'bold', fontSize: '10px',
                        }}
                      />
                      <Line type="monotone" dataKey="angin" stroke="#4ade80" strokeWidth={3} name="Angin (km/h)" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* Right: Satellite + 24h Strip + Forecast */}
          <div className="flex flex-col gap-6">
            {/* Satellite */}
            <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
              <h2 className="mb-4 border-b-4 border-black pb-4 text-xl font-black">Citra Satelit</h2>
              <div className="relative overflow-hidden rounded-xl border-[3px] border-black bg-neutral-100" style={{ minHeight: 220 }}>
                {satLoading ? (
                  <div className="flex h-52 items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : satImg ? (
                  <img
                    src={satImg}
                    alt="Himawari-9 Satellite"
                    className="h-full w-full object-cover"
                    onError={() => { setSatImg(''); setSatLoading(false); }}
                  />
                ) : (
                  <div className="flex h-52 flex-col items-center justify-center px-4 text-center">
                    <Eye size={32} className="mb-2 text-neutral-300" />
                    <p className="text-xs font-bold text-neutral-400">Citra satelit tidak tersedia</p>
                    <p className="mt-1 text-[10px] text-neutral-300">BMKG Himawari-9</p>
                  </div>
                )}
              </div>
              <p className="mt-2 text-[10px] text-neutral-500">
                Sumber: BMKG — Himawari-9 Enhanced Rainfall Potential
              </p>
            </section>

            {/* 24-Hour Weather Strip */}
            {next24h.length > 0 && (
              <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
                <h2 className="mb-4 border-b-4 border-black pb-4 text-xl font-black">24 Jam ke Depan</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {next24h.map((h, i) => (
                    <div
                      key={h.hour}
                      className={`flex min-w-[72px] flex-col items-center rounded-xl border-[3px] border-black p-3 shadow-[3px_3px_0_#000] ${i === 0 ? 'bg-[#e8ff00]' : 'bg-[#f8f8f3]'}`}
                    >
                      <WeatherIcon code={h.code} size={28} />
                      <p className="mt-1 text-sm font-black">{h.temp}°</p>
                      <p className="text-[10px] font-bold text-neutral-500">{h.hour}</p>
                      {h.hujan > 0 && (
                        <p className="text-[9px] font-bold text-blue-600">{h.hujan}mm</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3-Day Forecast */}
            <section className="flex flex-1 flex-col rounded-2xl border-[4px] border-black bg-white p-5 shadow-[8px_8px_0_#000]">
              <div className="mb-3 flex items-center justify-between border-b-4 border-black pb-3">
                <h2 className="text-sm font-black">Prakiraan 3 Hari</h2>
                <Calendar size={14} />
              </div>
              <div className="flex flex-1 gap-2">
                {forecastDays.map((day, idx) => (
                  <div
                    key={day.date}
                    className={`flex min-w-0 flex-1 flex-col rounded-xl border-[3px] border-black p-3 shadow-[3px_3px_0_#000] ${idx === 0 ? 'bg-[#e8ff00]' : 'bg-[#f8f8f3]'}`}
                  >
                    <p className="text-xs font-black text-center uppercase">
                      {idx === 0 ? 'Hari Ini' : new Date(day.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <WeatherIcon code={day.conditionCode} size={32} />
                      <div className="text-right">
                        <p className="text-lg font-black leading-none">{day.temperatureMax ?? '-'}°</p>
                        <p className="text-xs font-black text-neutral-500">{day.temperatureMin ?? '-'}°</p>
                      </div>
                    </div>
                    <p className="mt-1 text-xs font-bold text-neutral-600">{day.condition || '-'}</p>
                    <div className="mt-auto border-t-2 border-black pt-2 text-xs font-bold text-neutral-500">
                      <span>RH {day.humidity ?? '-'}% &nbsp;|&nbsp; {day.rainfall ?? 0}mm</span>
                      {day.windSpeed != null && (
                        <p className="mt-0.5 text-[10px]">{(day.windDirection ?? '').trim()} {day.windSpeed} km/h</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Sumber Data */}
        <section className="rounded-2xl border-[4px] border-black bg-[#f8f8f3] p-6 shadow-[8px_8px_0_#000]">
          <p className="text-xs font-black uppercase text-neutral-500">Sumber Data</p>
          <p className="mt-1 text-xs text-neutral-600">
            Data prakiraan cuaca bersumber dari Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) melalui API publik.
            Wajib mencantumkan BMKG sebagai sumber data. Data diperbarui 2 kali sehari.
          </p>
          {weather?.analysis_date && (
            <p className="mt-1 text-[10px] text-neutral-400">
              Waktu analisis: {weather.analysis_date}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
