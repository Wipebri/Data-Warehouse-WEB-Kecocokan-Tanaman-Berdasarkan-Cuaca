import type { BIFilter } from '../../../types'

interface Props {
  filter: BIFilter
}

function buildQuery(f: BIFilter): string {
  const p = new URLSearchParams()
  p.set('days', String(f.days))
  if (f.crops.length) p.set('crop', f.crops.join(','))
  if (f.location) p.set('location', f.location)
  return p.toString()
}

export default function ExportBar({ filter }: Props) {
  const token = localStorage.getItem('token')
  const authHeaders = { Authorization: `Bearer ${token}` }

  const exportCSV = async () => {
    const q = buildQuery(filter)
    const res = await fetch(`/api/admin/bi/drill-down?${q}`, { headers: authHeaders })
    const json = await res.json()
    const rows: any[] = json.data || []
    if (!rows.length) return
    const headers = ['Tanggal','Tanaman','Lokasi','Skor','Label','Suhu','Kelembapan','Air','Stres Panas','Risiko Penyakit','User']
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.date, r.cropLabel, r.location, r.score, r.label,
        r.temp, r.hum, r.water, r.heatStress, r.diseaseRisk, r.userName,
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `agrosense-export-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    window.print()
  }

  return (
    <div className="flex gap-2">
      <button onClick={exportCSV} className="rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-[10px] font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        Export CSV
      </button>
      <button onClick={exportPDF} className="rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-[10px] font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        Cetak / PDF
      </button>
    </div>
  )
}
