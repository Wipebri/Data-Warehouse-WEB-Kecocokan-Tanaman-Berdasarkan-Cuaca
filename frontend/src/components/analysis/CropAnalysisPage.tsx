import { useState, useEffect, useRef } from 'react'
import { Leaf, Search, MapPin, Thermometer, ShieldCheck, Droplets } from 'lucide-react'
import { CROP_LABELS, CROP_OPTIMAL, calcScore } from '../../data/constants'

export default function CropAnalysisPage() {
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
    return () => { mounted = false; };
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
            <p className="mt-2 text-sm text-neutral-600">Pilih tanaman, lalu analisis akan otomatis menggunakan lokasi kamu saat ini.</p>

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
                <div className="rounded-xl border-[3px] border-black bg-red-100 p-3 text-xs font-bold text-red-700">{error}</div>
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
          <p className="mt-2 max-w-[80ch] text-sm text-neutral-700">Analisis kesesuaian tanaman {selectedCropLabel} untuk lokasi {selectedLocation} berdasarkan kondisi cuaca terkini.</p>
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
                  <p>Suhu {Math.round(dailyScores[0].dTemp)}&deg;C dan kelembapan {Math.round(dailyScores[0].dHum)}% {dailyScores[0].composite >= 60 ? 'dalam rentang optimal' : dailyScores[0].composite >= 35 ? 'perlu diwaspadai' : 'kurang mendukung'}.</p>
                  <p>Risiko iklim 3 hari ke depan: {climateRiskLevel}</p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Data tidak tersedia</p>
            )}
          </article>

          <article className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
            <h3 className="text-lg font-black">Kondisi Cuaca</h3>
            <p className="mt-3 text-4xl font-black">{temp}&deg;C</p>
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
          <p className="mt-1 text-xs text-neutral-500">Analisis berdasarkan prakiraan 3 hari ke depan (suhu, kelembapan, curah hujan) vs kebutuhan optimal tanaman.</p>
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
          <p className="mt-1 text-xs text-neutral-500">Seberapa cocok kondisi cuaca 3 hari ke depan untuk {selectedCropLabel.toLowerCase()}.</p>
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
                    <span className="font-black">{Math.round(day.dTemp)}&deg;C ({Math.round(day.dTempMin)}-{Math.round(day.dTempMax)})</span>
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
