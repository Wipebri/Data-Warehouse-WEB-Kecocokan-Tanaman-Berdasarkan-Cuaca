import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { createUser, findUserByEmail, comparePassword, findUserById } from '../models/User.js'
import { superadminMiddleware } from '../middleware/adminAuth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' })
    }
    const user = await createUser({ name, email, password })
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user })
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message })
    console.error('Register error:', err)
    res.status(500).json({ error: 'Gagal mendaftar' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' })
    }
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    const match = await comparePassword(user, password)
    if (!match) {
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Gagal masuk' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token tidak ditemukan' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await findUserById(decoded.id)
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Token tidak valid' })
  }
})

router.post('/seed-superadmin', async (req, res) => {
  try {
    const { email, password, name, masterKey } = req.body
    if (masterKey !== process.env.MASTER_KEY) {
      return res.status(403).json({ error: 'Master key tidak valid' })
    }
    const existing = await findUserByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' })
    }
    const user = await createUser({ name, email, password, role: 'superadmin' })
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user })
  } catch (err) {
    console.error('Seed superadmin error:', err)
    res.status(500).json({ error: 'Gagal membuat superadmin' })
  }
})

export default router
