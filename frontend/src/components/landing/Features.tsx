import { CloudSun, TrendingUp, BarChart2, FileText, MapPin } from 'lucide-react'
import type { PageKey } from '../../types'

export default function Features({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
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
            <button onClick={() => onNavigate?.('cuaca')} className="mt-4 text-xs font-black underline">Lihat Cuaca &rarr;</button>
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
              Gunakan lokasi Anda saat ini atau cari kecamatan lain di Indonesia &mdash; data cuaca akurat langsung tersedia.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
