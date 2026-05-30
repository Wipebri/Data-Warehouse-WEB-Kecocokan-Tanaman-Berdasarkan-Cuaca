import { Wifi, BarChart2, Leaf } from 'lucide-react'

export default function HowItWorks() {
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
        <p className="mt-2 text-center text-xs text-neutral-500">Dari pantau cuaca hingga laporan analisis &mdash; semua dalam satu platform.</p>
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
