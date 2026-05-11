import { Router } from 'express'
import mysql from 'mysql2/promise'
import { adminMiddleware, superadminMiddleware } from '../middleware/adminAuth.js'
import { getAllUsers, findUserById, updateUserRole, deleteUserById, countUsers, countUsersByRole } from '../models/User.js'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrosense',
  waitForConnections: true,
  connectionLimit: 10,
})

const router = Router()

router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsers()
    res.json({ users })
  } catch (err) {
    console.error('Admin get users error:', err)
    res.status(500).json({ error: 'Gagal mengambil data user' })
  }
})

router.get('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
    res.json({ user })
  } catch (err) {
    console.error('Admin get user error:', err)
    res.status(500).json({ error: 'Gagal mengambil data user' })
  }
})

router.put('/users/:id/role', superadminMiddleware, async (req, res) => {
  try {
    const { role } = req.body
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid. Pilihan: user, admin, superadmin' })
    }
    const user = await findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
    await updateUserRole(req.params.id, role)
    res.json({ ok: true, message: `Role ${user.name} diubah menjadi ${role}` })
  } catch (err) {
    console.error('Admin update role error:', err)
    res.status(500).json({ error: 'Gagal mengubah role user' })
  }
})

router.delete('/users/:id', superadminMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' })
    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' })
    }
    await deleteUserById(req.params.id)
    res.json({ ok: true, message: `User ${user.name} berhasil dihapus` })
  } catch (err) {
    console.error('Admin delete user error:', err)
    res.status(500).json({ error: 'Gagal menghapus user' })
  }
})

router.get('/reports', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.date, r.crop, r.crop_label AS cropLabel, r.location, r.score, r.label,
              r.temp, r.hum, r.heat_stress AS heatStress, r.disease_risk AS diseaseRisk, r.water,
              r.created_at AS createdAt, u.name AS userName, u.email AS userEmail
       FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`
    )
    res.json({ reports: rows })
  } catch (err) {
    console.error('Admin get reports error:', err)
    res.status(500).json({ error: 'Gagal mengambil laporan' })
  }
})

router.delete('/reports/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM reports WHERE id = ?', [req.params.id])
    res.json({ ok: true })
  } catch (err) {
    console.error('Admin delete report error:', err)
    res.status(500).json({ error: 'Gagal menghapus laporan' })
  }
})

router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await countUsers()
    const roleCounts = await countUsersByRole()
    const [reportCount] = await pool.query('SELECT COUNT(*) as total FROM reports')
    const [recentReports] = await pool.query(
      `SELECT r.created_at AS createdAt, u.name AS userName
       FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT 10`
    )
    const [topCrops] = await pool.query(
      `SELECT crop_label AS cropLabel, COUNT(*) as count FROM reports GROUP BY crop_label ORDER BY count DESC LIMIT 5`
    )
    const [topLocations] = await pool.query(
      `SELECT location, COUNT(*) as count FROM reports GROUP BY location ORDER BY count DESC LIMIT 5`
    )

    const roleMap = {}
    for (const r of roleCounts) roleMap[r.role] = r.count

    res.json({
      totalUsers,
      totalReports: reportCount[0].total,
      roleCounts: roleMap,
      recentReports,
      topCrops,
      topLocations,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    res.status(500).json({ error: 'Gagal mengambil statistik' })
  }
})

router.get('/stats/reports-by-date', adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const [rows] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM reports
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [days]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('Reports by date error:', err)
    res.status(500).json({ error: 'Gagal mengambil data' })
  }
})

router.get('/stats/score-distribution', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        CASE
          WHEN score >= 80 THEN 'Sangat Optimal'
          WHEN score >= 60 THEN 'Optimal'
          WHEN score >= 35 THEN 'Waspada'
          ELSE 'Kurang Sesuai'
        END as \`range\`,
        COUNT(*) as count
       FROM reports
       GROUP BY \`range\`
       ORDER BY MIN(score)`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('Score distribution error:', err)
    res.status(500).json({ error: 'Gagal mengambil data' })
  }
})

router.get('/stats/avg-score-per-crop', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT crop_label AS crop, ROUND(AVG(score), 1) as avgScore, COUNT(*) as count
       FROM reports
       WHERE crop_label IS NOT NULL AND crop_label != ''
       GROUP BY crop_label
       ORDER BY avgScore DESC`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('Avg score per crop error:', err)
    res.status(500).json({ error: 'Gagal mengambil data' })
  }
})

export default router
