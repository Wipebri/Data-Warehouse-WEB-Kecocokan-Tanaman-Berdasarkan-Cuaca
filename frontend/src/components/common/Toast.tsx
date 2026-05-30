import { useEffect, useState } from 'react'

export default function Toast() {
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
