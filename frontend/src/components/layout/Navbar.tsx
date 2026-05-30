import { useState } from 'react'
import { UserRound, ChevronDown, LogOut } from 'lucide-react'
import type { PageKey } from '../../types'

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: 'beranda', label: 'Beranda' },
  { key: 'cuaca', label: 'Cuaca' },
  { key: 'analisis-tanaman', label: 'Analisis Tanaman' },
  { key: 'historis', label: 'Data Historis' },
  { key: 'laporan', label: 'Laporan' },
]

export default function Navbar({ activePage, onNavigate }: { activePage: PageKey; onNavigate: (page: PageKey) => void }) {
  const navButtonClass = 'rounded-md border-[3px] border-black px-3 py-1 shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'

  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) as { name: string; email: string; role?: string } : null
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  let visibleItems: Array<{ key: PageKey; label: string }>
  if (isAdmin) {
    visibleItems = [{ key: 'admin', label: 'Admin' }]
  } else {
    visibleItems = user ? navItems.filter(i => i.key !== 'beranda') : navItems
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b-[3px] border-black bg-[#f6f6ee]/95 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4">
          <p className="text-xl font-black leading-none sm:text-2xl">AgroSense</p>
          <nav className="hidden items-center gap-3 text-xs font-bold lg:flex">
            {visibleItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`${navButtonClass} ${activePage === item.key ? 'bg-[#d6ff24]' : 'bg-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border-[3px] border-black bg-white px-3 py-1.5 text-xs font-bold shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <UserRound size={14} />
              {user ? user.name : 'Akun'}
              <ChevronDown size={12} />
            </summary>
            <div className="absolute right-0 mt-2 w-44 rounded-xl border-[3px] border-black bg-white p-2 shadow-[4px_4px_0_#000]">
              {user ? (
                <>
                  <p className="mb-2 truncate px-2 text-[10px] text-neutral-500">{user.email}</p>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-full rounded-md border-[3px] border-black bg-red-500 px-3 py-1.5 text-xs font-black text-white transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('login')}
                    className="mb-2 w-full rounded-md border-[3px] border-black bg-[#d6ff24] px-3 py-1.5 text-xs font-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full rounded-md border-[3px] border-black bg-[#4de4ff] px-3 py-1.5 text-xs font-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  >
                    Daftar
                  </button>
                </>
              )}
            </div>
          </details>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
          <div className="w-full max-w-[360px] rounded-2xl border-[4px] border-black bg-white p-6 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-red-500 shadow-[3px_3px_0_#000]">
              <LogOut size={20} className="text-white" />
            </div>
            <h2 className="text-center text-xl font-black">Yakin ingin keluar?</h2>
            <p className="mt-1 text-center text-xs text-neutral-500">Anda akan kembali ke halaman utama</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 rounded-xl border-[3px] border-black bg-white py-2 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Tidak
              </button>
              <button onClick={() => { setShowLogoutModal(false); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.setItem('toast', 'logout'); onNavigate('beranda') }} className="flex-1 rounded-xl border-[3px] border-black bg-red-500 py-2 text-sm font-black text-white shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
