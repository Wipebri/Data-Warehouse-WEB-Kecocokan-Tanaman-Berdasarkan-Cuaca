import { useState, useEffect } from 'react'

const ROLES = ['admin', 'superadmin']
const ROLE_BADGES: Record<string, string> = {
  admin: 'bg-[#d6ff24] text-black',
  superadmin: 'bg-red-200 text-red-800',
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' })
  const token = localStorage.getItem('token')
  const h = { Authorization: `Bearer ${token}` }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { headers: h })
      const d = await res.json()
      const all = d.users || []
      setUsers(all.filter((u: any) => u.role === 'admin' || u.role === 'superadmin'))
    } catch { setUsers([]) } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const changeRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    const d = await res.json()
    setMsg(d.message || d.error || '')
    if (d.ok) fetchUsers()
  }

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name}?`)) return
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: h })
    const d = await res.json()
    setMsg(d.message || d.error || '')
    if (d.ok) fetchUsers()
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    setMsg(d.error || `Akun ${form.name} berhasil dibuat`)
    if (d.ok) { setShowForm(false); setForm({ name: '', email: '', password: '', role: 'admin' }); fetchUsers() }
  }

  return (
    <div className="space-y-5">
      {msg && (
        <div className="flex items-center justify-between rounded-xl border-[3px] border-black bg-blue-100 p-3 text-xs font-bold">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="ml-2 underline">Tutup</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Total {users.length} admin & superadmin</p>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="rounded-lg border-[3px] border-black bg-[#d6ff24] px-3 py-1 text-[10px] font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            + Tambah Akun
          </button>
          <button onClick={fetchUsers} className="rounded-lg border-[3px] border-black bg-white px-3 py-1 text-[10px] font-black shadow-[3px_3px_0_#000] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            Segarkan
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#000]">
          <h3 className="mb-3 text-sm font-black">Tambah Akun Baru</h3>
          <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-4">
            <input type="text" placeholder="Nama" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="rounded-md border-[2px] border-black bg-white px-3 py-1.5 text-[11px] font-bold placeholder:text-neutral-400" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              className="rounded-md border-[2px] border-black bg-white px-3 py-1.5 text-[11px] font-bold placeholder:text-neutral-400" />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6}
              className="rounded-md border-[2px] border-black bg-white px-3 py-1.5 text-[11px] font-bold placeholder:text-neutral-400" />
            <div className="flex gap-2">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="flex-1 rounded-md border-[2px] border-black bg-white px-3 py-1.5 text-[11px] font-bold">
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <button type="submit" className="rounded-md border-[2px] border-black bg-[#2ca63d] px-3 py-1.5 text-[11px] font-bold text-white shadow-[2px_2px_0_#000]">
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md border-[2px] border-black bg-red-200 px-3 py-1.5 text-[11px] font-bold">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-[4px] border-black bg-white shadow-[6px_6px_0_#000]">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b-[3px] border-black bg-neutral-50">
                <th className="p-3 font-black w-[25%]">Nama</th>
                <th className="p-3 font-black w-[35%]">Email</th>
                <th className="p-3 font-black w-[15%]">Role</th>
                <th className="p-3 font-black w-[25%]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-black/10 hover:bg-neutral-50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-neutral-600">{u.email}</td>
                  <td className="p-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ${ROLE_BADGES[u.role] || 'bg-neutral-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">Ubah ke</span>
                      <select
                        defaultValue={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className="rounded-md border-[2px] border-black bg-white px-2 py-0.5 text-[10px] font-bold"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        onClick={() => deleteUser(u.id, u.name)}
                        className="rounded-md border-[2px] border-black bg-red-100 px-2 py-0.5 text-[10px] font-bold hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-xs text-neutral-500">Belum ada admin atau superadmin</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
