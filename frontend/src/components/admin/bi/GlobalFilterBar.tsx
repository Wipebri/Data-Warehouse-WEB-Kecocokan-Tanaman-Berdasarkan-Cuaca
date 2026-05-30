import type { BIFilter } from '../../../types'

interface Props {
  filter: BIFilter
  onChange: (f: BIFilter) => void
  cropOptions: string[]
  locationOptions: string[]
}

const DAY_OPTIONS = [
  { value: 7, label: '7 Hari' },
  { value: 14, label: '14 Hari' },
  { value: 30, label: '30 Hari' },
  { value: 90, label: '90 Hari' },
]

export default function GlobalFilterBar({ filter, onChange, cropOptions, locationOptions }: Props) {
  const toggleCrop = (crop: string) => {
    const next = filter.crops.includes(crop)
      ? filter.crops.filter(c => c !== crop)
      : [...filter.crops, crop]
    onChange({ ...filter, crops: next })
  }

  return (
    <section className="rounded-2xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#000]">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-black text-neutral-500">Rentang Waktu</label>
          <div className="flex gap-1">
            {DAY_OPTIONS.map(d => (
              <button
                key={d.value}
                onClick={() => onChange({ ...filter, days: d.value })}
                className={`rounded-md border-[2px] border-black px-2.5 py-1 text-[10px] font-bold transition-all ${
                  filter.days === d.value ? 'bg-[#d6ff24] shadow-[2px_2px_0_#000]' : 'bg-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black text-neutral-500">Tanaman</label>
          <details className="relative inline-block">
            <summary className="cursor-pointer list-none rounded-md border-[2px] border-black bg-white px-2.5 py-1 text-[10px] font-bold shadow-[2px_2px_0_#000]">
              {filter.crops.length ? `${filter.crops.length} dipilih` : 'Semua Tanaman'}
            </summary>
            <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-xl border-[3px] border-black bg-white p-2 shadow-[4px_4px_0_#000]">
              {cropOptions.map(c => (
                <label key={c} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-[10px] font-bold hover:bg-neutral-100">
                  <input type="checkbox" checked={filter.crops.includes(c)} onChange={() => toggleCrop(c)} className="h-3 w-3 accent-black" />
                  {c}
                </label>
              ))}
              {cropOptions.length === 0 && <p className="px-2 text-[10px] text-neutral-400">Tidak ada data</p>}
            </div>
          </details>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-black text-neutral-500">Lokasi</label>
          <select
            value={filter.location}
            onChange={e => onChange({ ...filter, location: e.target.value })}
            className="rounded-md border-[2px] border-black bg-white px-2.5 py-1 text-[10px] font-bold shadow-[2px_2px_0_#000]"
          >
            <option value="">Semua Lokasi</option>
            {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {(filter.crops.length > 0 || filter.location) && (
          <button
            onClick={() => onChange({ days: filter.days, crops: [], location: '' })}
            className="rounded-md border-[2px] border-black bg-red-100 px-2.5 py-1 text-[10px] font-bold hover:bg-red-200"
          >
            Reset Filter
          </button>
        )}
      </div>
    </section>
  )
}
