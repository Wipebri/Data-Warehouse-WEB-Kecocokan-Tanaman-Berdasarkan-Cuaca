import { insightCards } from '../../data/constants'

export default function AgroInsights() {
  return (
    <section className="px-4 py-12 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="text-3xl font-black leading-none sm:text-4xl lg:text-[44px]">Wawasan Agro</h2>
        <p className="mt-2 text-xs text-neutral-500">Insight otomatis berdasarkan tren cuaca, kondisi tanah, dan performa panen terbaru.</p>
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
