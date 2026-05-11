import { Router } from 'express'
import mysql from 'mysql2/promise'
import authMiddleware from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrosense',
  waitForConnections: true,
  connectionLimit: 10,
})

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, date, crop, crop_label AS cropLabel, location, score, label,
              temp, hum, heat_stress AS heatStress, disease_risk AS diseaseRisk, water
       FROM reports WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    )
    res.json({ reports: rows })
  } catch (err) {
    console.error('Get reports error:', err)
    res.status(500).json({ error: 'Gagal mengambil laporan' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { date, crop, cropLabel, location, score, label, temp, hum, heatStress, diseaseRisk, water } = req.body
    if (!date || !crop || !location || score == null || !label) {
      return res.status(400).json({ error: 'Data laporan tidak lengkap' })
    }
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO reports (id, user_id, date, crop, crop_label, location, score, label, temp, hum, heat_stress, disease_risk, water)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, date, crop, cropLabel || null, location, score, label, temp || null, hum || null, heatStress || null, diseaseRisk || null, water || null]
    )
    res.status(201).json({ id })
  } catch (err) {
    console.error('Create report error:', err)
    res.status(500).json({ error: 'Gagal menyimpan laporan' })
  }
})

router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE user_id = ?', [req.userId])
    res.json({ ok: true })
  } catch (err) {
    console.error('Clear reports error:', err)
    res.status(500).json({ error: 'Gagal menghapus laporan' })
  }
})

export default router
