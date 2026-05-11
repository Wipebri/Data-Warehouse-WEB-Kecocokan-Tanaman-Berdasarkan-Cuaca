import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  CloudSun,
  Droplets,
  FileText,
  Gauge,
  Leaf,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Thermometer,
  TrendingUp,
  UserRound,
  Wifi,
  Wind,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Weather from './components/Weather';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

type PageKey = 'beranda' | 'analisis-tanaman' | 'cuaca' | 'historis' | 'laporan' | 'login' | 'register' | 'admin' | 'admin-dw';

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: 'beranda', label: 'Beranda' },
  { key: 'cuaca', label: 'Cuaca' },
  { key: 'analisis-tanaman', label: 'Analisis Tanaman' },
  { key: 'historis', label: 'Data Historis' },
  { key: 'laporan', label: 'Laporan' },
];

const insightCards = [
  {
    title: 'Risiko Penyakit Rendah',
    value: '18%',
    detail: 'Kelembapan stabil dan sirkulasi udara cukup untuk 7 hari ke depan.',
    accent: 'bg-[#d6ff24]',
    icon: ShieldCheck,
  },
  {
    title: 'Efisiensi Irigasi',
    value: '+21%',
    detail: 'Penjadwalan irigasi malam hari menekan penguapan secara signifikan.',
    accent: 'bg-[#4de4ff]',
    icon: Droplets,
  },
  {
    title: 'Prediksi Panen',
    value: '8.9 t/ha',
    detail: 'Naik 0.6 t/ha dibanding pola tanam sebelumnya pada blok selatan.',
    accent: 'bg-[#ffb703]',
    icon: TrendingUp,
  },
];

const CROP_LABELS: Record<string, string> = {
  banana: 'Pisang',
  maize: 'Jagung',
  mungbean: 'Kacang Hijau',
  orange: 'Jeruk',
  papaya: 'Pepaya',
  potato: 'Kentang',
  tomato: 'Tomat',
  watermelon: 'Semangka',
}

const CROP_OPTIMAL: Record<string, {
  tempMin: number; tempMax: number; tempAvg: number;
  humMin: number; humMax: number; humAvg: number;
  rainMin: number; rainMax: number; rainAvg: number;
  phMin: number; phMax: number; phAvg: number;
}> = {
  banana:  { tempMin:25,  tempMax:29.9, tempAvg:27.4, humMin:75, humMax:85,   humAvg:80.4, rainMin:90.1, rainMax:119.8, rainAvg:104.6, phMin:5.5, phMax:6.5, phAvg:6.0 },
  maize:   { tempMin:18,  tempMax:26.5, tempAvg:22.4, humMin:55.3,humMax:74.8, humAvg:65.1, rainMin:60.7, rainMax:109.8, rainAvg:84.8,  phMin:5.5, phMax:7.0, phAvg:6.2 },
  mungbean:{ tempMin:27,  tempMax:29.9, tempAvg:28.5, humMin:80, humMax:90,   humAvg:85.5, rainMin:36.1, rainMax:59.9,  rainAvg:48.4,  phMin:6.2, phMax:7.2, phAvg:6.7 },
  orange:  { tempMin:10,  tempMax:34.9, tempAvg:22.8, humMin:90, humMax:95,   humAvg:92.2, rainMin:100.2,rainMax:119.7, rainAvg:110.5, phMin:6.0, phMax:8.0, phAvg:7.0 },
  papaya:  { tempMin:23,  tempMax:43.7, tempAvg:33.7, humMin:90, humMax:94.9, humAvg:92.4, rainMin:40.4, rainMax:248.9, rainAvg:142.6, phMin:6.5, phMax:7.0, phAvg:6.7 },
  watermelon:{tempMin:24, tempMax:27,   tempAvg:25.6, humMin:80, humMax:90,   humAvg:85.2, rainMin:40.1, rainMax:59.8,  rainAvg:50.8,  phMin:6.0, phMax:7.0, phAvg:6.5 },
  tomato:  { tempMin:18,  tempMax:30,   tempAvg:24,   humMin:65, humMax:80,   humAvg:72,   rainMin:50,   rainMax:100,   rainAvg:75,    phMin:5.5, phMax:7.5, phAvg:6.5 },
  potato:  { tempMin:15,  tempMax:25,   tempAvg:20,   humMin:65, humMax:80,   humAvg:72,   rainMin:50,   rainMax:120,   rainAvg:85,    phMin:5.5, phMax:7.0, phAvg:6.2 },
}

const calcScore = (cropKey: string, dTemp: number, dHum: number) => {
  const o = CROP_OPTIMAL[cropKey];
  if (!o) return 0;
  const tDist = Math.abs(dTemp - o.tempAvg);
  const tRng = (o.tempMax - o.tempMin) * 1.5 || 1;
  const tS = Math.max(0, Math.min(100, 100 - (tDist / tRng) * 100));
  const hDist = Math.abs(dHum - o.humAvg);
  const hRng = (o.humMax - o.humMin) * 1.5 || 1;
  const hS = Math.max(0, Math.min(100, 100 - (hDist / hRng) * 100));
  return Math.round(tS * 0.5 + hS * 0.5);
};

function Navbar({
  activePage,
  onNavigate,
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  const navButtonClass =
    'rounded-md border-[3px] border-black px-3 py-1 shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none';

  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) as { name: string; email: string; role?: string } : null
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const adminItems: Array<{ key: PageKey; label: string }> = isAdmin ? [
    { key: 'admin', label: 'Admin' },
  ] : []
  const visibleItems = user ? [...navItems.filter(i => i.key !== 'beranda'), ...adminItems] : navItems

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b-[3px] border-black bg-[#f6f6ee]/95 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4">
          <p className="text-xl font-black leading-none sm:text-2xl">AgroSense</p>
          <nav className="hidden items-center gap-3 text-xs font-bold lg:flex">
            {visibleItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`${navButtonClass} ${activePage === item.key ? 'bg-[#d6ff24]' : 'bg-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-xs font-bold shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <UserRound size={14} />
              {user ? user.name : 'Akun'}
              <ChevronDown size={12} />
            </summary>
            <div className="absolute right-0 mt-2 w-44 rounded-xl border-[3px] border-black bg-white p-2 shadow-[4px_4px_0_#000]">
              {user ? (
                <>
                  <p className="mb-2 truncate px-2 text-[10px] text-neutral-500">{user.email}</p>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full rounded-md border-[3px] border-black bg-red-100 px-3 py-1.5 text-xs font-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('login')}
                    className="mb-2 w-full rounded-md border-[3px] border-black bg-[#d6ff24] px-3 py-1.5 text-xs font-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full rounded-md border-[3px] border-black bg-[#4de4ff] px-3 py-1.5 text-xs font-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Daftar
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
          <div className="w-full max-w-[360px] rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-red-200 shadow-[3px_3px_0_#000]">
              <LogOut size={20} />
            </div>
            <h2 className="text-center text-xl font-black">Yakin ingin keluar?</h2>
            <p className="mt-1 text-center text-xs text-neutral-500">Anda akan kembali ke halaman utama</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 rounded-xl border-[3px] border-black bg-white py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Tidak
              </button>
              <button onClick={() => { setShowLogoutModal(false); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.setItem('toast', 'logout'); onNavigate('beranda') }} className="flex-1 rounded-xl border-[3px] border-black bg-red-400 py-2 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Hero({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
  return (
    <section className="px-4 pb-10 pt-14 sm:px-8 sm:pb-12 sm:pt-16">
      <div className="mx-auto grid w-full max-w-[1240px] items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <div className="mb-5 inline-flex items-center gap-1 rounded-full border-[3px] border-black bg-[#d6ff24] px-3 py-1 text-[10px] font-black shadow-[2px_2px_0_#000]">
            <Leaf size={10} />
            AGROTECH INDONESIA
          </div>
          <h1 className="max-w-[16ch] text-4xl font-black leading-[1.02] sm:text-5xl lg:text-[62px]">
            Cari Tahu Kesesuaian
            <br />
            Tanaman & Cuaca.
          </h1>
          <p className="mt-4 max-w-[65ch] text-sm leading-6 text-neutral-700">
            AgroSense membantu Anda menganalisis kesesuaian tanaman berdasarkan cuaca terkini,
            melihat data historis, serta menyusun laporan untuk pengambilan keputusan yang lebih baik.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate?.('analisis-tanaman')}
              className="rounded-lg border-[3px] border-black bg-[#d6ff24] px-5 py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Mulai Analisis
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-lg border-[3px] border-black bg-[#42d9f9] px-5 py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Pelajari Lebih
            </button>
          </div>
        </div>
        <div className="h-[260px] overflow-hidden rounded-2xl border-[4px] border-black shadow-[7px_7px_0_#000] sm:h-[320px]">
          <img
            alt="Field pattern"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: '1. Pantau Cuaca',
      desc: 'Lihat suhu, kelembapan, curah hujan, dan kecepatan angin secara real-time dari lokasi Anda.',
      icon: <Wifi size={18} />,
    },
    {
      title: '2. Analisis Tanaman',
      desc: 'Hitung skor kesesuaian untuk 8 jenis tanaman berdasarkan data cuaca aktual. Temukan tanaman yang paling cocok.',
      icon: <BarChart2 size={18} />,
    },
    {
      title: '3. Hasil & Laporan',
      desc: 'Akses data historis dan hasil analisis dalam bentuk grafik interaktif serta laporan yang siap diekspor.',
      icon: <Leaf size={18} />,
    },
  ];

  return (
    <section className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="text-center text-3xl font-black leading-none sm:text-4xl lg:text-[46px]">Tiga Langkah Sederhana</h2>
        <p className="mt-2 text-center text-xs text-neutral-500">
          Dari pantau cuaca hingga laporan analisis — semua dalam satu platform.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border-[3px] border-black bg-white p-5 text-center shadow-[4px_4px_0_#000]">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border-[3px] border-black bg-[#47e4ff] shadow-[2px_2px_0_#000]">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black leading-none lg:text-[33px]">{step.title}</h3>
              <p className="mt-2 text-[12px] leading-5 text-neutral-700">{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
  return (
    <section id="features" className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="text-3xl font-black leading-none sm:text-4xl lg:text-[44px]">Fitur Andalan</h2>
        <p className="mt-2 text-xs text-neutral-500">Peralatan yang Anda butuhkan untuk analisis pertanian yang lebih cerdas.</p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="relative min-h-[230px] rounded-2xl border-[4px] border-black bg-[#e8ff00] p-6 shadow-[8px_8px_0_#000]">
            <CloudSun className="mb-3" size={22} />
            <h3 className="text-[34px] font-black leading-[1.04]">Pantauan Cuaca</h3>
            <p className="mt-2 max-w-[90%] text-xs leading-5 text-neutral-800">
              Lihat suhu, kelembapan, curah hujan, dan angin secara real-time dari lokasi Anda dalam tampilan grafik interaktif.
            </p>
            <button onClick={() => onNavigate?.('cuaca')} className="mt-4 text-xs font-black underline">Lihat Cuaca →</button>
          </article>

          <article className="min-h-[230px] rounded-2xl border-[4px] border-black bg-[#34daff] p-6 shadow-[8px_8px_0_#000]">
            <TrendingUp className="mb-3" size={22} />
            <h3 className="text-[42px] font-black leading-[1.02]">Analisis Tanaman</h3>
            <p className="mt-2 text-xs leading-5 text-neutral-800">
              Hitung skor kesesuaian untuk 8 jenis tanaman berdasarkan suhu dan kelembapan terkini. Temukan tanaman paling optimal.
            </p>
          </article>

          <article className="rounded-2xl border-[4px] border-black bg-[#34daff] p-5 shadow-[6px_6px_0_#000]">
            <BarChart2 className="mb-2" size={20} />
            <h3 className="text-[28px] font-black">Data Historis</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-800">
              Jelajahi data cuaca 7 hari terakhir dengan grafik per metrik, tren perubahan, dan klasifikasi curah hujan.
            </p>
          </article>

          <article className="rounded-2xl border-[4px] border-black bg-[#86e58f] p-5 shadow-[6px_6px_0_#000]">
            <FileText className="mb-2" size={20} />
            <h3 className="text-[28px] font-black">Laporan & Ekspor</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-800">
              Akses riwayat analisis melalui dashboard KPI yang informatif, tabel detail, dan ekspor data untuk dokumentasi lebih lanjut.
            </p>
          </article>

          <article className="rounded-2xl border-[4px] border-black bg-[#e8ff00] p-5 shadow-[6px_6px_0_#000] md:col-span-2">
            <MapPin className="mb-2" size={20} />
            <h3 className="text-[30px] font-black">Deteksi Lokasi Otomatis</h3>
            <p className="mt-1 text-xs leading-5 text-neutral-800">
              Gunakan lokasi Anda saat ini atau cari kecamatan lain di Indonesia — data cuaca akurat langsung tersedia.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function AgroInsights() {
  return (
    <section className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="text-3xl font-black leading-none sm:text-4xl lg:text-[44px]">Wawasan Agro</h2>
        <p className="mt-2 text-xs text-neutral-500">
          Insight otomatis berdasarkan tren cuaca, kondisi tanah, dan performa panen terbaru.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {insightCards.map((insight) => (
            <article key={insight.title} className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[7px_7px_0_#000]">
              <div className={`mb-4 inline-flex rounded-lg border-[3px] border-black p-2 ${insight.accent}`}>
                <insight.icon size={20} />
              </div>
              <p className="text-[32px] font-black leading-none">{insight.value}</p>
              <h3 className="mt-2 text-xl font-black">{insight.title}</h3>
              <p className="mt-2 text-xs leading-5 text-neutral-700">{insight.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
  return (
    <section className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px] rounded-2xl border-[4px] border-black bg-[#d6ff24] px-5 py-10 text-center shadow-[8px_8px_0_#000] sm:px-8 sm:py-12">
        <h2 className="text-4xl font-black leading-none sm:text-5xl lg:text-[58px]">Siap Memulai?</h2>
        <p className="mx-auto mt-3 max-w-[65ch] text-sm leading-6 text-neutral-700">
          Dapatkan rekomendasi tanaman terbaik berdasarkan kondisi cuaca di lokasi Anda — gratis dan real-time.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate?.('analisis-tanaman')}
            className="rounded-xl border-[3px] border-black bg-[#f3ff9f] px-6 py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Mulai Sekarang
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-xl border-[3px] border-black bg-[#34daff] px-6 py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Jelajahi Fitur
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-4 pb-8 pt-2 sm:px-8 sm:pb-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-4 border-t-[3px] border-black pt-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xl font-black leading-none">AgroSense</p>
          <p className="mt-1 text-[10px] text-neutral-600">© 2026 AgroSense. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Kebijakan Privasi', 'Ketentuan Layanan', 'Hubungi Kami', 'Aksesibilitas'].map((label) => (
            <a key={label} className="rounded-md border-2 border-black px-3 py-1 text-[10px] font-bold" href="#">
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function CropAnalysisPage() {
  const [crops, setCrops] = useState<string[]>([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const lastSavedKey = useRef('');

  useEffect(() => {
    if (!result || typeof dailyScores === 'undefined' || dailyScores.length === 0) return;
    const key = `${selectedCrop}-${selectedLocation}-${dailyScores[0]?.composite}`;
    if (lastSavedKey.current === key) return;
    lastSavedKey.current = key;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      crop: selectedCrop,
      cropLabel: selectedCropLabel,
      location: selectedLocation,
      score: dailyScores[0]?.composite ?? 0,
      label: dailyScores[0]?.label ?? '',
      temp: Math.round(dailyScores[0]?.dTemp ?? temp),
      hum: Math.round(dailyScores[0]?.dHum ?? hum),
      heatStress: heatStressLevel,
      diseaseRisk: diseaseLevel,
      water: waterLevel,
    };
    try {
      const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
      history.unshift(entry);
      if (history.length > 50) history.length = 50;
      localStorage.setItem('analysisHistory', JSON.stringify(history));
      const token = localStorage.getItem('token')
      if (token) {
        fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(entry),
        }).catch((e) => console.error('Save report failed:', e))
      }
    } catch {}
  }, [result, selectedCrop, selectedLocation]);

  useEffect(() => {
    let mounted = true;

    const detectCurrentLocation = async () => {
      try {
        const [cropData, locData] = await Promise.all([
          fetch('/api/crops').then(r => r.json()),
          fetch('/api/locations').then(r => r.json()),
        ]);
        if (!mounted) return;
        setCrops(cropData.crops ?? []);

        if (!navigator.geolocation) {
          throw new Error('Browser tidak mendukung geolocation');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          }),
        );

        const { latitude, longitude } = position.coords;
        const nearestRes = await fetch(`/api/weather/nearest?lat=${latitude}&lng=${longitude}`);
        const nearest = await nearestRes.json();
        if (!nearestRes.ok || !nearest?.city) {
          throw new Error('Tidak dapat menentukan kota terdekat dari lokasi Anda');
        }

        if (!mounted) return;
        setSelectedLocation(nearest.city);
        const selectedLoc = (locData.locations ?? []).find((l: any) => l.city === nearest.city);
        setSelectedSubdistrict(selectedLoc?.subdistricts?.[0] || 'Area terdekat');
        setLocationReady(true);
        setError('');
      } catch {
        if (!mounted) return;
        setLocationReady(false);
        setError('Lokasi otomatis gagal dideteksi. Izinkan akses lokasi browser lalu muat ulang halaman.');
      } finally {
        if (mounted) setDetectingLocation(false);
      }
    };

    detectCurrentLocation();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAnalyze = async () => {
    if (!selectedCrop || !selectedLocation || !locationReady) return;
    setLoading(true);
    setError('');
    setResult(null);
    setWeather(null);
    try {
      const predRes = await fetch('/api/predict/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: selectedCrop, location: selectedLocation }),
      }).then(r => r.json());
      if (predRes.error) { setError(predRes.error); return }
      setResult(predRes);
      setWeather(predRes.weather);
    } catch {
      setError('Gagal memuat data analisis. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!result || !weather) {
    return (
      <main className="px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[620px]">
          <div className="rounded-2xl border-[4px] border-black bg-white p-8 shadow-[8px_8px_0_#000]">
            <Leaf className="mx-auto mb-4" size={48} />
            <h1 className="text-3xl font-black sm:text-4xl">Analisis Tanaman</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Pilih tanaman, lalu analisis akan otomatis menggunakan lokasi kamu saat ini.
            </p>

            <div className="mt-8 space-y-4">
              <div className="text-left">
                <label className="text-xs font-black mb-1 block">Tanaman</label>
                <select
                  value={selectedCrop}
                  onChange={e => setSelectedCrop(e.target.value)}
                  className="w-full rounded-xl border-[3px] border-black bg-[#f8f8f3] px-4 py-3 text-sm font-bold shadow-[3px_3px_0_#000] outline-none"
                >
                  <option value="">-- Pilih Tanaman --</option>
                  {crops.map(c => (
                    <option key={c} value={c}>{CROP_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] px-4 py-3 text-left shadow-[3px_3px_0_#000]">
                <p className="text-[11px] font-black uppercase text-neutral-500">Lokasi Saat Ini</p>
                <div className="mt-1 flex items-center gap-2">
                  <MapPin size={16} />
                  <p className="text-sm font-bold">
                    {detectingLocation
                      ? 'Mendeteksi lokasi...'
                      : selectedLocation
                        ? `${selectedLocation}${selectedSubdistrict ? ` - ${selectedSubdistrict}` : ''}`
                        : 'Lokasi belum tersedia'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedCrop || !selectedLocation || !locationReady || loading || detectingLocation}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-[4px] border-black bg-[#2ca63d] px-8 py-3 text-sm font-black text-white shadow-[5px_5px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                {loading ? 'Menganalisis...' : detectingLocation ? 'Menunggu Lokasi...' : 'Mulai Analisis'}
              </button>

              {error && (
                <div className="rounded-xl border-[3px] border-black bg-red-100 p-3 text-xs font-bold text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const fc = weather?.forecast ?? [];
  const current = weather?.current ?? {};
  const temp = current?.temperature ?? weather?.temperature ?? 27;
  const hum = current?.humidity ?? weather?.humidity ?? 75;
  const rain = current?.rainfall ?? weather?.rainfall ?? 0;
  const windSpd = current?.windSpeed ?? 0;
  const windDir = current?.windDirection ?? '';
  const confidence = result?.confidence ?? 0;
  const selectedCropConfidence = result?.selected_crop_confidence ?? confidence;
  const suitable = result?.suitable ?? false;
  const alternatives = result?.alternatives ?? [];
  const cond = current?.condition || (rain > 100 ? 'Hujan' : rain > 50 ? 'Berawan' : 'Cerah');
  const soilPh = result?.soil?.ph ?? 6.5;
  const selectedCropLabel = CROP_LABELS[selectedCrop] || selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1);
  const opt = CROP_OPTIMAL[selectedCrop];
  const next3 = fc.slice(0, 3);

  const maxTemp3 = next3.length ? Math.max(...next3.map((d: any) => d.temperatureMax ?? d.temperature ?? 0)) : temp;
  const heatStressLevel: string = maxTemp3 <= opt.tempMax + 1 ? 'Rendah' : maxTemp3 <= opt.tempMax + 4 ? 'Sedang' : 'Tinggi';
  const heatStressPct = maxTemp3 <= opt.tempMax ? 20 : maxTemp3 <= opt.tempMax + 4 ? 55 : 90;

  const avgHum3 = next3.length ? next3.reduce((s: number, d: any) => s + (d.humidity ?? 0), 0) / next3.length : hum;
  const diseaseLevel: string = avgHum3 <= opt.humMax ? 'Rendah' : avgHum3 <= opt.humMax + 6 ? 'Sedang' : 'Tinggi';
  const diseasePct = avgHum3 <= opt.humMax ? 20 : avgHum3 <= opt.humMax + 6 ? 55 : 90;

  const totalRain3 = next3.length ? next3.reduce((s: number, d: any) => s + (d.rainfall ?? 0), 0) : rain;
  const waterLevel: string = totalRain3 >= opt.rainMin ? 'Cukup' : totalRain3 >= opt.rainMin * 0.5 ? 'Sedang' : 'Kurang';
  const waterPct = totalRain3 >= opt.rainMin ? 15 : totalRain3 >= opt.rainMin * 0.5 ? 50 : 85;

  const climateRiskLevel: string = heatStressLevel === 'Tinggi' || diseaseLevel === 'Tinggi' ? 'tinggi' : heatStressLevel === 'Sedang' || diseaseLevel === 'Sedang' ? 'sedang' : 'rendah';

  const day1 = next3[0];
  const day1Temp = day1?.temperature ?? temp;
  const day1Hum = day1?.humidity ?? hum;

  const dailyScores = next3.map((d: any) => {
    const dTemp = d.temperature ?? 0;
    const dHum = d.humidity ?? 0;
    const dTempMin = d.temperatureMin ?? dTemp;
    const dTempMax = d.temperatureMax ?? dTemp;
    const composite = calcScore(selectedCrop, dTemp, dHum);
    const isGood = composite >= 60;
    const isWarn = composite >= 35;
    const label: string = isGood ? 'Optimal' : isWarn ? 'Waspada' : 'Kurang Sesuai';
    const color: string = isGood ? 'text-green-700' : isWarn ? 'text-yellow-600' : 'text-red-600';
    const bgColor: string = isGood ? 'bg-green-100 border-green-300' : isWarn ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300';

    const tDist = Math.abs(dTemp - opt.tempAvg);
    const tRng = (opt.tempMax - opt.tempMin) * 1.5 || 1;
    const tempScore = Math.round(Math.max(0, Math.min(100, 100 - (tDist / tRng) * 100)));
    const hDist = Math.abs(dHum - opt.humAvg);
    const hRng = (opt.humMax - opt.humMin) * 1.5 || 1;
    const humScore = Math.round(Math.max(0, Math.min(100, 100 - (hDist / hRng) * 100)));

    return { tempScore, humScore, composite, label, color, bgColor, dTemp, dHum, dTempMin, dTempMax, date: d.date, conditionCode: d.conditionCode, condition: d.condition };
  });

  const scoredAlternatives = alternatives
    .filter((a: any) => CROP_OPTIMAL[a.crop])
    .map((a: any) => ({ crop: a.crop, score: calcScore(a.crop, day1Temp, day1Hum) }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <section className="rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Hasil Analisis Kesesuaian</h1>
          <p className="mt-2 max-w-[80ch] text-sm text-neutral-700">
            Analisis kesesuaian tanaman {selectedCropLabel} untuk lokasi {selectedLocation} berdasarkan kondisi cuaca terkini.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-3">
              <p className="text-[11px] text-neutral-500">Lokasi</p>
              <p className="mt-1 text-sm font-black">{selectedLocation}{selectedSubdistrict ? ` - ${selectedSubdistrict}` : ''}</p>
            </div>
            <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-3">
              <p className="text-[11px] text-neutral-500">Tanaman</p>
              <p className="mt-1 text-sm font-black">{selectedCropLabel}</p>
            </div>
            <div className="rounded-xl border-[3px] border-black bg-[#f8f8f3] p-3">
              <p className="text-[11px] text-neutral-500">Waktu Analisis</p>
              <p className="mt-1 text-sm font-black">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button
              onClick={() => { setResult(null); setWeather(null); }}
              className="rounded-xl border-[3px] border-black bg-[#2ca63d] p-3 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Analisis Ulang
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <h3 className="text-lg font-black">Tingkat Kesesuaian</h3>
            {dailyScores[0] ? (
              <>
                <p className={`mt-3 text-5xl font-black ${dailyScores[0].color}`}>{dailyScores[0].composite}%</p>
                <p className={`mt-1 text-sm font-black ${dailyScores[0].color}`}>{dailyScores[0].label}</p>
                <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                  <p>Kesesuaian cuaca hari ini untuk {selectedCropLabel}.</p>
                  <p>Suhu {Math.round(dailyScores[0].dTemp)}°C dan kelembapan {Math.round(dailyScores[0].dHum)}% {dailyScores[0].composite >= 60 ? 'dalam rentang optimal' : dailyScores[0].composite >= 35 ? 'perlu diwaspadai' : 'kurang mendukung'}.</p>
                  <p>Risiko iklim 3 hari ke depan: {climateRiskLevel}</p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Data tidak tersedia</p>
            )}
          </article>
          
          <article className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <h3 className="text-lg font-black">Kondisi Cuaca</h3>
            <p className="mt-3 text-4xl font-black">{temp}°C</p>
            <p className="mt-1 text-sm font-black">{cond}</p>
            <div className="mt-3 space-y-2 text-xs">
              <p>Kelembapan: <span className="font-black">{hum}%</span></p>
              <p>Curah Hujan: <span className="font-black">{rain} mm</span></p>
              <p>Angin: <span className="font-black">{windDir} {windSpd} km/h</span></p>
              <p>pH Tanah: <span className="font-black">{soilPh}</span></p>
            </div>
          </article>
          
          <article className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <h3 className="text-lg font-black">Rekomendasi Alternatif</h3>
            <p className="mt-1 text-xs text-neutral-500">Kesesuaian hari ini untuk tanaman lain</p>
            <div className="mt-3 space-y-2">
              {scoredAlternatives.length > 0 ? (
                scoredAlternatives.map((alt: any, idx: number) => (
                  <div key={alt.crop} className="flex items-center justify-between rounded-lg border-[3px] border-black bg-[#f8f8f3] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-neutral-400">{idx + 1}.</span>
                      <span className="text-sm font-black">{CROP_LABELS[alt.crop] || alt.crop.charAt(0).toUpperCase() + alt.crop.slice(1)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full border-[2px] border-black bg-gray-100">
                        <div className={`h-full rounded-full ${alt.score >= 60 ? 'bg-green-500' : alt.score >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${alt.score}%` }} />
                      </div>
                      <span className="text-xs font-black">{alt.score}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">Tidak ada alternatif yang tersedia</p>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
          <h3 className="text-xl font-black">Insight untuk {selectedCropLabel}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Analisis berdasarkan prakiraan 3 hari ke depan (suhu, kelembapan, curah hujan) vs kebutuhan optimal tanaman.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border-[3px] border-black bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`rounded-lg border-[3px] border-black p-1.5 ${heatStressLevel === 'Rendah' ? 'bg-green-200' : heatStressLevel === 'Sedang' ? 'bg-yellow-200' : 'bg-red-200'}`}>
                  <Thermometer size={16} />
                </div>
                <p className="text-sm font-black">Stres Panas</p>
              </div>
              <p className="text-2xl font-black">{heatStressLevel}</p>
              <div className="mt-2 h-2 rounded-full border-[2px] border-black bg-gray-100">
                <div className={`h-full rounded-full transition-all ${heatStressLevel === 'Rendah' ? 'bg-green-500' : heatStressLevel === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${heatStressPct}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-4 text-neutral-600">
                {heatStressLevel === 'Rendah'
                  ? `Suhu max ${maxTemp3}°C dalam batas ideal ${opt.tempMin}-${opt.tempMax}°C. Kondisi aman.`
                  : heatStressLevel === 'Sedang'
                    ? `Suhu max ${maxTemp3}°C mendekati batas optimal (${opt.tempMax}°C). Pantau terus.`
                    : `Suhu max ${maxTemp3}°C di atas batas ideal ${opt.tempMax}°C. Berisiko layu.`}
              </p>
            </div>
            <div className="rounded-xl border-[3px] border-black bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`rounded-lg border-[3px] border-black p-1.5 ${diseaseLevel === 'Rendah' ? 'bg-green-200' : diseaseLevel === 'Sedang' ? 'bg-yellow-200' : 'bg-red-200'}`}>
                  <ShieldCheck size={16} />
                </div>
                <p className="text-sm font-black">Risiko Penyakit</p>
              </div>
              <p className="text-2xl font-black">{diseaseLevel}</p>
              <div className="mt-2 h-2 rounded-full border-[2px] border-black bg-gray-100">
                <div className={`h-full rounded-full transition-all ${diseaseLevel === 'Rendah' ? 'bg-green-500' : diseaseLevel === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${diseasePct}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-4 text-neutral-600">
                {diseaseLevel === 'Rendah'
                  ? `RH ${Math.round(avgHum3)}% dalam batas ideal (${opt.humMin}-${opt.humMax}%). Risiko jamur rendah.`
                  : diseaseLevel === 'Sedang'
                    ? `RH ${Math.round(avgHum3)}% sedikit di atas ideal. Waspada embun dan jamur daun.`
                    : `RH ${Math.round(avgHum3)}% jauh di atas ideal ${opt.humMax}%. Risiko tinggi penyakit jamur.`}
              </p>
            </div>
            <div className="rounded-xl border-[3px] border-black bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`rounded-lg border-[3px] border-black p-1.5 ${waterLevel === 'Cukup' ? 'bg-green-200' : waterLevel === 'Sedang' ? 'bg-yellow-200' : 'bg-red-200'}`}>
                  <Droplets size={16} />
                </div>
                <p className="text-sm font-black">Ketersediaan Air</p>
              </div>
              <p className="text-2xl font-black">{waterLevel}</p>
              <div className="mt-2 h-2 rounded-full border-[2px] border-black bg-gray-100">
                <div className={`h-full rounded-full transition-all ${waterLevel === 'Cukup' ? 'bg-green-500' : waterLevel === 'Sedang' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${waterPct}%` }} />
              </div>
              <p className="mt-2 text-[11px] leading-4 text-neutral-600">
                {waterLevel === 'Cukup'
                  ? `Curah hujan ${Math.round(totalRain3 * 10) / 10}mm dalam 3 hari cukup (ideal ${opt.rainMin}-${opt.rainMax}mm).`
                  : waterLevel === 'Sedang'
                    ? `Curah hujan ${Math.round(totalRain3 * 10) / 10}mm/3hari. Perlu tambahan irigasi jika diperlukan.`
                    : `Curah hujan ${Math.round(totalRain3 * 10) / 10}mm/3hari di bawah ideal. Irigasi tambahan dianjurkan.`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
          <h3 className="text-xl font-black">Skor Kesesuaian Harian</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Seberapa cocok kondisi cuaca 3 hari ke depan untuk {selectedCropLabel.toLowerCase()}.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {dailyScores.map((day: any, i: number) => (
              <div key={day.date} className={`rounded-xl border-[3px] border-black p-4 ${day.bgColor}`}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-black text-neutral-500">Hari ke-{i + 1}</p>
                  <p className={`text-lg font-black ${day.color}`}>{day.composite}%</p>
                </div>
                <p className={`text-base font-black ${day.color}`}>{day.label}</p>
                <p className="mt-2 text-xs text-neutral-600">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                <div className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>Suhu</span>
                    <span className="font-black">{Math.round(day.dTemp)}°C ({Math.round(day.dTempMin)}-{Math.round(day.dTempMax)})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kelembapan</span>
                    <span className="font-black">{Math.round(day.dHum)}%</span>
                  </div>
                  <div className="h-2 rounded-full border-[2px] border-black bg-gray-100">
                    <div className={`h-full rounded-full ${day.composite >= 60 ? 'bg-green-500' : day.composite >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${day.composite}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-neutral-500">
                    <span>Suhu: {day.tempScore}%</span>
                    <span>Kelembapan: {day.humScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HistoricalDataPage() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSubdistrict, setSelectedSubdistrict] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
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

  // --- Insights ---
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
  // ---

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <section className="mb-8 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Data Historis Cuaca</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Data cuaca detail dari BMKG dengan resolusi 3 jam.
          </p>
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
            {/* Insights Row */}
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
                              <span className="text-xs text-neutral-400">—</span>
                            )
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
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
                  const rains = dayEntries.map((h: any) => h.rainfall ?? 0);
                  const winds = dayEntries.map((h: any) => h.windSpeed ?? 0);
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
                          {Math.round(Math.min(...temps))}° - {Math.round(Math.max(...temps))}°
                        </span>
                      </summary>
                      <div className="border-t-[3px] border-black px-4 py-3">
                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          {dayEntries.map((h: any) => (
                            <div key={h.datetime} className="rounded-lg border-[2px] border-black bg-white p-2 text-center">
                              <p className="font-black">{h.hour}:00</p>
                              <div className="mt-1 space-y-0.5">
                                <p><span className="font-black">{h.temperature}°C</span></p>
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

function ReportsPage() {
  const [history, setHistory] = useState<Array<any>>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(history.length / perPage));
  const pageData = history.slice((page - 1) * perPage, page * perPage);

  // KPI: Weather data
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

  // KPI calculations
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

  // Auto insights
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
      `"${new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}","${e.cropLabel}","${e.location}",${e.score},"${e.label}",${e.temp},${e.hum},"${e.heatStress || ''}","${e.diseaseRisk || ''}","${e.water || ''}"`
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
        {/* KPI Dashboard */}
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
              <p className="mt-1 text-sm text-neutral-700">
                Semua hasil analisis tanaman yang telah dilakukan tersimpan di sini.
              </p>
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
              <button onClick={() => setShowClearModal(true)} disabled={history.length === 0} className="rounded-lg border-[3px] border-black bg-red-200 px-3 py-1.5 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40">
                Hapus Semua
              </button>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="border-t-[3px] border-black p-12 text-center">
              <BarChart2 className="mx-auto mb-4 text-neutral-300" size={48} />
              <h2 className="text-xl font-black text-neutral-400">Belum Ada Analisis</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Lakukan analisis tanaman di halaman Analisis Tanaman, hasilnya akan muncul di sini.
              </p>
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
                <p className="text-xs text-neutral-500">
                  Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, history.length)} dari {history.length}
                </p>
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-red-200 shadow-[3px_3px_0_#000]">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-center text-xl font-black">Hapus Semua Riwayat?</h2>
            <p className="mt-1 text-center text-xs text-neutral-500">Data yang sudah dihapus tidak dapat dikembalikan.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowClearModal(false)} className="flex-1 rounded-xl border-[3px] border-black bg-white py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Batal
              </button>
              <button onClick={confirmClear} className="flex-1 rounded-xl border-[3px] border-black bg-red-400 py-2 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProtectedPage({ onNavigate, children }: { onNavigate: (page: PageKey) => void; children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(true)
  const isLoggedIn = !!localStorage.getItem('user')

  if (isLoggedIn) return <>{children}</>

  return (
    <div className="relative">
      {children}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => onNavigate('beranda')}>
          <div className="relative w-full max-w-[380px] rounded-2xl border-[4px] border-black bg-white p-8 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onNavigate('beranda')} className="absolute right-4 top-4 rounded-md border-[2px] border-black p-1 shadow-[2px_2px_0_#000] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <X size={16} />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffb703] shadow-[3px_3px_0_#000]">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-center text-2xl font-black">Akses Terbatas</h2>
            <p className="mt-2 text-center text-xs leading-5 text-neutral-600">
              Silakan <span className="font-black text-black">Masuk</span> atau{' '}
              <span className="font-black text-black">Daftar</span> terlebih dahulu
              <br />untuk mengakses halaman ini.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => onNavigate('login')} className="flex-1 rounded-xl border-[3px] border-black bg-[#d6ff24] py-2.5 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Masuk
              </button>
              <button onClick={() => onNavigate('register')} className="flex-1 rounded-xl border-[3px] border-black bg-[#4de4ff] py-2.5 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Daftar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PIE_COLORS = ['#2ca63d', '#86e58f', '#ffb703', '#ef4444']

function AdminPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const [stats, setStats] = useState<any>(null)
  const [reportsByDate, setReportsByDate] = useState<any[]>([])
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([])
  const [avgScorePerCrop, setAvgScorePerCrop] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) as { name: string; email: string; role?: string } : null

  const token = localStorage.getItem('token')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const h = authHeaders
      const [statsRes, dateRes, scoreRes, cropRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: h }),
        fetch('/api/admin/stats/reports-by-date?days=30', { headers: h }),
        fetch('/api/admin/stats/score-distribution', { headers: h }),
        fetch('/api/admin/stats/avg-score-per-crop', { headers: h }),
      ])
      const statsData = await statsRes.json()
      const dateData = await dateRes.json()
      const scoreData = await scoreRes.json()
      const cropData = await cropRes.json()
      if (statsData.error) throw new Error(statsData.error)
      setStats(statsData)
      setReportsByDate(dateData.data || [])
      setScoreDistribution(scoreData.data || [])
      setAvgScorePerCrop(cropData.data || [])
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const totalScoreCount = scoreDistribution.reduce((s, d) => s + d.count, 0)

  return (
    <main className="min-h-screen bg-[#f6f6ee] px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[1240px]">
        <section className="mb-6 rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dashboard Admin</h1>
              <p className="mt-1 text-sm text-neutral-700">{user?.name || ''} &mdash; <button onClick={() => onNavigate('beranda')} className="underline">Ke Beranda</button></p>
            </div>
            <button onClick={fetchStats} className="rounded-lg border-[3px] border-black bg-white px-4 py-2 text-xs font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              Segarkan
            </button>
          </div>
        </section>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border-[3px] border-black bg-red-100 p-4 text-xs font-bold text-red-700">{error}</div>
        )}

        {!loading && stats && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <p className="text-[11px] font-black text-neutral-500">Total User</p>
                <p className="mt-1 text-4xl font-black">{stats.totalUsers}</p>
              </div>
              <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <p className="text-[11px] font-black text-neutral-500">Admin</p>
                <p className="mt-1 text-4xl font-black">{stats.roleCounts?.admin || 0}</p>
              </div>
              <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <p className="text-[11px] font-black text-neutral-500">Superadmin</p>
                <p className="mt-1 text-4xl font-black">{stats.roleCounts?.superadmin || 0}</p>
              </div>
            </div>

            <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
              <h3 className="mb-4 text-sm font-black">Analisis per Hari (30 hari terakhir)</h3>
              {reportsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reportsByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2ca63d" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-neutral-500">Belum ada data analisis</p>
              )}
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <h3 className="mb-3 text-sm font-black">Distribusi Skor Kesesuaian</h3>
                {scoreDistribution.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={scoreDistribution} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} stroke="#000" strokeWidth={2}>
                          {scoreDistribution.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Belum ada data</p>
                )}
              </section>

              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <h3 className="mb-3 text-sm font-black">Skor Rata-rata per Tanaman</h3>
                {avgScorePerCrop.length > 0 ? (
                  <div className="space-y-3">
                    {avgScorePerCrop.map((c: any, i: number) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-black">{c.crop}</span>
                          <span className="font-black text-neutral-500">{c.avgScore}% ({c.count} analisis)</span>
                        </div>
                        <div className="h-4 rounded-full border-[2px] border-black bg-gray-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${c.avgScore}%`, backgroundColor: c.avgScore >= 60 ? '#2ca63d' : c.avgScore >= 35 ? '#ffb703' : '#ef4444' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">Belum ada data</p>
                )}
              </section>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <h3 className="mb-3 text-sm font-black">Tanaman Terpopuler</h3>
                <div className="space-y-2">
                  {(stats.topCrops || []).slice(0, 4).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border-[2px] border-black bg-[#f8f8f3] px-3 py-2">
                      <span className="text-xs font-black">{c.cropLabel || '(tanpa label)'}</span>
                      <span className="text-xs font-black text-neutral-500">{c.count} analisis</span>
                    </div>
                  ))}
                  {(!stats.topCrops || stats.topCrops.length === 0) && (
                    <p className="text-xs text-neutral-500">Belum ada data</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
                <h3 className="mb-3 text-sm font-black">Lokasi Terpopuler</h3>
                <div className="space-y-2">
                  {(stats.topLocations || []).map((l: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border-[2px] border-black bg-[#f8f8f3] px-3 py-2">
                      <span className="text-xs font-black">{l.location}</span>
                      <span className="text-xs font-black text-neutral-500">{l.count} analisis</span>
                    </div>
                  ))}
                  {(!stats.topLocations || stats.topLocations.length === 0) && (
                    <p className="text-xs text-neutral-500">Belum ada data</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('beranda');

  const renderPage = () => {
    switch (activePage) {
      case 'beranda':
        return (
          <>
            <Hero onNavigate={setActivePage} />
            <HowItWorks />
            <Features onNavigate={setActivePage} />
            <AgroInsights />
            <Cta onNavigate={setActivePage} />
          </>
        );
      case 'analisis-tanaman':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <CropAnalysisPage />
          </ProtectedPage>
        );
      case 'cuaca':
        return <Weather />;
      case 'historis':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <HistoricalDataPage />
          </ProtectedPage>
        );
      case 'laporan':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <ReportsPage />
          </ProtectedPage>
        );
      case 'admin':
      case 'admin-dw':
        return (
          <ProtectedPage onNavigate={setActivePage}>
            <AdminPage onNavigate={setActivePage} />
          </ProtectedPage>
        );
      case 'login':
        return <LoginPage onNavigate={(p) => setActivePage(p)} />;
      case 'register':
        return <RegisterPage onNavigate={(p) => setActivePage(p)} />;
      default:
        return (
          <>
            <Hero onNavigate={setActivePage} />
            <HowItWorks />
            <Features onNavigate={setActivePage} />
            <AgroInsights />
            <Cta onNavigate={setActivePage} />
          </>
        );
    }
  };

  const hideShell = activePage === 'login' || activePage === 'register' || activePage === 'admin' || activePage === 'admin-dw'
  const userJson = localStorage.getItem('user')
  const authKey = userJson ? 'auth-y' : 'auth-n'
  const toastKey = localStorage.getItem('toast') || ''

  return (
    <div className="min-h-screen font-sans bg-[#f6f6ee]">
      {toastKey && <Toast key={toastKey} />}
      {!hideShell && <Navbar key={authKey} activePage={activePage} onNavigate={setActivePage} />}
      {renderPage()}
      {!hideShell && <Footer />}
    </div>
  );
}

function Toast() {
  const [color, setColor] = useState('bg-[#d6ff24]')
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const type = localStorage.getItem('toast')
    if (type === 'login') { setMsg('Berhasil masuk!'); setColor('bg-[#d6ff24]') }
    else if (type === 'logout') { setMsg('Berhasil keluar.'); setColor('bg-red-400 text-white') }
    localStorage.removeItem('toast')
    const t1 = setTimeout(() => { const d = document.getElementById('toast-el'); if (d) d.style.transform = 'translateY(-120%)'; d?.classList.add('opacity-0') }, 1400)
    const t2 = setTimeout(() => setVisible(false), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div id="toast-el" className={`fixed left-1/2 top-4 z-[200] -translate-x-1/2 rounded-xl border-[3px] border-black ${color} px-5 py-3 text-sm font-black shadow-[4px_4px_0_#000] transition-all duration-[400ms]`}>
      {msg}
    </div>
  )
}