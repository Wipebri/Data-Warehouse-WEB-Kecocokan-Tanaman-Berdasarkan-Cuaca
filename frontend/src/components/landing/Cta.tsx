import type { PageKey } from '../../types'

export default function Cta({ onNavigate }: { onNavigate?: (page: PageKey) => void }) {
  return (
    <section className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px] rounded-2xl border-[4px] border-black bg-[#d6ff24] px-5 py-10 text-center shadow-[8px_8px_0_#000] sm:px-8 sm:py-12">
        <h2 className="text-4xl font-black leading-none sm:text-5xl lg:text-[58px]">Siap Memulai?</h2>
        <p className="mx-auto mt-3 max-w-[65ch] text-sm leading-6 text-neutral-700">
          Dapatkan rekomendasi tanaman terbaik berdasarkan kondisi cuaca di lokasi Anda &mdash; gratis dan real-time.
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
