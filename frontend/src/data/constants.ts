import { ShieldCheck, Droplets, TrendingUp } from 'lucide-react';

export const insightCards = [
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
]

export const CROP_LABELS: Record<string, string> = {
  banana: 'Pisang',
  maize: 'Jagung',
  mungbean: 'Kacang Hijau',
  orange: 'Jeruk',
  papaya: 'Pepaya',
  potato: 'Kentang',
  tomato: 'Tomat',
  watermelon: 'Semangka',
}

export const CROP_OPTIMAL: Record<string, {
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

export const calcScore = (cropKey: string, dTemp: number, dHum: number) => {
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

export const PIE_COLORS = ['#2ca63d', '#86e58f', '#ffb703', '#ef4444']
