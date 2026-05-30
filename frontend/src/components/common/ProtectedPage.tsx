import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { PageKey } from '../../types';

export default function ProtectedPage({ onNavigate, children }: { onNavigate: (page: PageKey) => void; children: React.ReactNode }) {
  const [showModal] = useState(true)
  const isLoggedIn = !!localStorage.getItem('user')

  if (isLoggedIn) return <>{children}</>

  return (
    <div className="relative">
      {children}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => onNavigate('beranda')}>
          <div className="relative w-full max-w-[380px] rounded-2xl border-[4px] border-black bg-white p-8 shadow-[8px_8px_0_#000]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onNavigate('beranda')} className="absolute right-4 top-4 rounded-md border-[2px] border-black p-1 shadow-[2px_2px_0_#000] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <X size={16} />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-black bg-[#ffb703] shadow-[3px_3px_0_#000]">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-center text-2xl font-black">Akses Terbatas</h2>
            <p className="mt-2 text-center text-xs leading-5 text-neutral-600">
              Silakan <span className="font-black text-black">Masuk</span> atau{' '}
              <span className="font-black text-black">Daftar</span> terlebih dahulu
              <br />untuk mengakses halaman ini.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => onNavigate('login')} className="flex-1 rounded-xl border-[3px] border-black bg-[#d6ff24] py-2.5 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Masuk
              </button>
              <button onClick={() => onNavigate('register')} className="flex-1 rounded-xl border-[3px] border-black bg-[#4de4ff] py-2.5 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Daftar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
