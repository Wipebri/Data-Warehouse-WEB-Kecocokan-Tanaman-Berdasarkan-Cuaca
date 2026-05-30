import { Leaf } from 'lucide-react'
import type { PageKey } from '../../types'

export default function Hero({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
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
