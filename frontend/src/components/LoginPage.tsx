import { useState } from 'react'
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function LoginPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Gagal masuk')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('toast', 'login')
      onNavigate(data.user?.role === 'admin' || data.user?.role === 'superadmin' ? 'admin' : 'laporan')
    } catch {
      setError('Tidak bisa terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border-[4px] border-black bg-white p-8 shadow-[8px_8px_0_#000]">
        <button
          onClick={() => onNavigate('laporan')}
          className="mb-6 flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-black"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-black bg-[#d6ff24] shadow-[3px_3px_0_#000]">
          <LogIn size={24} />
        </div>

        <h1 className="text-center text-3xl font-black">Masuk</h1>
        <p className="mt-1 text-center text-xs text-neutral-500">Silakan masuk ke akun Anda</p>

        {error && (
          <div className="mt-4 rounded-lg border-[2px] border-red-500 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold">Email</label>
            <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0_#000]">
              <Mail size={16} className="text-neutral-400" />
              <input
                type="email"
                placeholder="contoh@email.com"
                className="w-full text-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Password</label>
            <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-3 py-2 shadow-[3px_3px_0_#000]">
              <Lock size={16} className="text-neutral-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Masukkan password"
                className="w-full text-sm outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPw((p) => !p)} className="text-neutral-400 hover:text-black">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border-[3px] border-black bg-[#d6ff24] py-3 text-sm font-black shadow-[4px_4px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-neutral-500">
          Belum punya akun?{' '}
          <button onClick={() => onNavigate('register')} className="font-black text-black underline">
            Daftar
          </button>
        </p>
      </div>
    </main>
  )
}
