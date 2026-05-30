import { Router } from 'express'
import mysql from 'mysql2/promise'
import { adminMiddleware, superadminMiddleware } from '../middleware/adminAuth.js'
import { getAllUsers, findUserById, createUser, updateUserRole, deleteUserById, countUsers, countUsersByRole } from '../models/User.js'

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

router.post('/users', superadminMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' })
    if (!['admin', 'superadmin'].includes(role)) return res.status(400).json({ error: 'Role harus admin atau superadmin' })
    const user = await createUser({ name, email, password, role })
    res.json({ ok: true, user })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Gagal membuat user' })
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
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
       FROM reports
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY 1`,
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

// ─── BI Endpoints ──────────────────────────────────────────────

router.get('/bi/overview', adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const location = req.query.location || ''
    const { clause: cropClause, params: cropParams } = buildCropWhere(req.query.crop)
    const dateClause = ` AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`
    const where = `${dateClause}${cropClause}${location ? ` AND location = ?` : ''}`
    const params = [days, ...cropParams]
    if (location) params.push(location)

    const [[{ totalReports }]] = await pool.query(`SELECT COUNT(*) as totalReports FROM reports WHERE 1=1${where}`, params)
    const [[{ avgScore }]] = await pool.query(`SELECT ROUND(AVG(score), 1) as avgScore FROM reports WHERE 1=1${where}`, params)
    const [topCrops] = await pool.query(
      `SELECT crop_label AS crop, COUNT(*) as count FROM reports WHERE crop_label IS NOT NULL AND crop_label != ''${where} GROUP BY crop_label ORDER BY count DESC LIMIT 3`,
      params
    )
    const [[{ activeLocations }]] = await pool.query(`SELECT COUNT(DISTINCT location) as activeLocations FROM reports WHERE 1=1${where}`, params)
    const [trend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count FROM reports WHERE 1=1${where} GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY date`,
      params
    )
    res.json({ totalReports, avgScore, topCrops: topCrops[0]?.crop || '-', activeLocations, trend })
  } catch (err) {
    console.error('BI overview error:', err)
    res.status(500).json({ error: 'Gagal mengambil data overview' })
  }
})

function buildCropWhere(cropParam, prefix = '') {
  const col = prefix ? `${prefix}.crop_label` : 'crop_label'
  if (!cropParam) return { clause: '', params: [] }
  const crops = cropParam.split(',').filter(Boolean)
  if (crops.length === 0) return { clause: '', params: [] }
  const placeholders = crops.map(() => '?').join(',')
  return { clause: ` AND ${col} IN (${placeholders})`, params: crops }
}

router.get('/bi/timeline', adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const location = req.query.location || ''
    const { clause: cropClause, params: cropParams } = buildCropWhere(req.query.crop)
    let sql = `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`
    const params = [days]
    if (cropClause) { sql += cropClause; params.push(...cropParams) }
    if (location) { sql += ` AND location = ?`; params.push(location) }
    sql += ` GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') ORDER BY 1`
    const [rows] = await pool.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('BI timeline error:', err)
    res.status(500).json({ error: 'Gagal mengambil data timeline' })
  }
})

router.get('/bi/score-distribution', adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const location = req.query.location || ''
    const { clause: cropClause, params: cropParams } = buildCropWhere(req.query.crop)
    let sql = `SELECT CASE WHEN score >= 80 THEN 'Sangat Optimal' WHEN score >= 60 THEN 'Optimal' WHEN score >= 35 THEN 'Waspada' ELSE 'Kurang Sesuai' END as \`range\`, COUNT(*) as count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`
    const params = [days]
    if (cropClause) { sql += cropClause; params.push(...cropParams) }
    if (location) { sql += ` AND location = ?`; params.push(location) }
    sql += ` GROUP BY \`range\` ORDER BY MIN(score)`
    const [rows] = await pool.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('BI score distribution error:', err)
    res.status(500).json({ error: 'Gagal mengambil data distribusi' })
  }
})

router.get('/bi/compare', adminMiddleware, async (req, res) => {
  try {
    const period = req.query.period || 'month'
    const location = req.query.location || ''
    const { clause: cropClause, params: cropParams } = buildCropWhere(req.query.crop)
    let currentExpr, prevExpr, curLabel, prevLabel
    if (period === 'year') {
      currentExpr = 'YEAR(NOW())'
      prevExpr = 'YEAR(NOW()) - 1'
      curLabel = new Date().getFullYear().toString()
      prevLabel = (new Date().getFullYear() - 1).toString()
    } else {
      currentExpr = `DATE_FORMAT(NOW(), '%Y-%m')`
      prevExpr = `DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m')`
      const now = new Date()
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      curLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevLabel = `${monthNames[prev.getMonth()]} ${prev.getFullYear()}`
    }
    const where = `${cropClause}${location ? ` AND location = ?` : ''}`
    const curParams = [...cropParams]
    const prevParams = [...cropParams]
    if (location) { curParams.push(location); prevParams.push(location) }
    const [[current]] = await pool.query(`SELECT COUNT(*) as count, ROUND(AVG(score), 1) as avgScore FROM reports WHERE DATE_FORMAT(created_at, '%Y-%m') = ${currentExpr}${where}`, curParams)
    const [[previous]] = await pool.query(`SELECT COUNT(*) as count, ROUND(AVG(score), 1) as avgScore FROM reports WHERE DATE_FORMAT(created_at, '%Y-%m') = ${prevExpr}${where}`, prevParams)
    res.json({ current: { ...current, period: curLabel }, previous: { ...previous, period: prevLabel } })
  } catch (err) {
    console.error('BI compare error:', err)
    res.status(500).json({ error: 'Gagal mengambil data perbandingan' })
  }
})

router.get('/bi/drill-down', adminMiddleware, async (req, res) => {
  try {
    const location = req.query.location || ''
    const dateFrom = req.query.dateFrom || ''
    const dateTo = req.query.dateTo || ''
    const { clause: cropClause, params: cropParams } = buildCropWhere(req.query.crop, 'r')
    let sql = `SELECT r.id, r.date, r.crop_label AS cropLabel, r.location, r.score, r.label, r.temp, r.hum, r.water, r.heat_stress AS heatStress, r.disease_risk AS diseaseRisk, r.created_at AS createdAt, u.name AS userName FROM reports r JOIN users u ON r.user_id = u.id WHERE 1=1`
    const params = []
    if (cropClause) { sql += cropClause; params.push(...cropParams) }
    if (location) { sql += ` AND r.location = ?`; params.push(location) }
    if (dateFrom) { sql += ` AND r.created_at >= ?`; params.push(dateFrom) }
    if (dateTo) { sql += ` AND r.created_at <= ?`; params.push(dateTo + ' 23:59:59') }
    sql += ` ORDER BY r.created_at DESC LIMIT 200`
    const [rows] = await pool.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('BI drill-down error:', err)
    res.status(500).json({ error: 'Gagal mengambil data detail' })
  }
})

// ─── Data Warehouse Endpoints ─────────────────────────────────

router.get('/dw/scatter', adminMiddleware, async (req, res) => {
  try {
    const crop = req.query.crop || ''
    const limit = parseInt(req.query.limit) || 2000
    let sql = `SELECT c.crop_name AS crop, w.temperature, w.humidity, s.ph
               FROM dw_fact_prediction f
               JOIN dw_dim_crop c ON f.crop_id = c.crop_id
               JOIN dw_dim_weather w ON f.weather_id = w.weather_id
               JOIN dw_dim_soil s ON f.soil_id = s.soil_id`
    const params = []
    if (crop) { sql += ` WHERE c.crop_name = ?`; params.push(crop) }
    sql += ` ORDER BY RAND() LIMIT ?`; params.push(limit)
    const [rows] = await pool.query(sql, params)
    res.json({ data: rows })
  } catch (err) {
    console.error('DW scatter error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/dw/optimal-zones', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.crop_name AS crop,
              ROUND(MIN(w.temperature), 1) AS tempMin, ROUND(MAX(w.temperature), 1) AS tempMax, ROUND(AVG(w.temperature), 1) AS tempAvg,
              ROUND(MIN(w.humidity), 1) AS humMin, ROUND(MAX(w.humidity), 1) AS humMax, ROUND(AVG(w.humidity), 1) AS humAvg,
              ROUND(MIN(s.ph), 1) AS phMin, ROUND(MAX(s.ph), 1) AS phMax, ROUND(AVG(s.ph), 1) AS phAvg,
              COUNT(*) AS count
       FROM dw_fact_prediction f
       JOIN dw_dim_crop c ON f.crop_id = c.crop_id
       JOIN dw_dim_weather w ON f.weather_id = w.weather_id
       JOIN dw_dim_soil s ON f.soil_id = s.soil_id
       GROUP BY c.crop_name
       ORDER BY count DESC`
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('DW optimal zones error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
