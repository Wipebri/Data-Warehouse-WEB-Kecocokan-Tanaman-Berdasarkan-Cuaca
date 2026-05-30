import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrosense',
  waitForConnections: true,
  connectionLimit: 10,
})

async function main() {
  const [[{ cnt }]] = await pool.query('SELECT COUNT(*) as cnt FROM reports')
  if (cnt > 5) { console.log(`reports sudah ada ${cnt} baris, skip seed`); process.exit(0) }

  const [users] = await pool.query('SELECT id FROM users LIMIT 5')
  if (users.length === 0) { console.log('tidak ada user, seed user dulu'); process.exit(1) }

  const crops = ['maize', 'mungbean', 'banana', 'watermelon', 'orange', 'papaya', 'tomato', 'potato']
  const labels = ['Jagung', 'Kacang Hijau', 'Pisang', 'Semangka', 'Jeruk', 'Pepaya', 'Tomat', 'Kentang']
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Malang', 'Bogor', 'Semarang', 'Medan']

  const [dwWeather] = await pool.query('SELECT temperature, humidity FROM dw_dim_weather ORDER BY RAND() LIMIT 100')

  let inserted = 0
  for (const w of dwWeather) {
    const cropIdx = Math.floor(Math.random() * crops.length)
    const user = users[Math.floor(Math.random() * users.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const daysAgo = Math.floor(Math.random() * 90)
    const date = new Date(Date.now() - daysAgo * 86400000)
    const dateStr = date.toISOString().split('T')[0]
    const score = Math.round(30 + Math.random() * 70)
    let label = 'Kurang Sesuai'
    if (score >= 80) label = 'Sangat Optimal'
    else if (score >= 60) label = 'Optimal'
    else if (score >= 35) label = 'Waspada'
    const water = String(Math.round(40 + Math.random() * 100))
    const heatStress = String(Math.round(5 + Math.random() * 40))
    const diseaseRisk = String(Math.round(5 + Math.random() * 50))

    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    await pool.query(
      `INSERT INTO reports (id, user_id, date, crop, crop_label, location, score, label, temp, hum, water, heat_stress, disease_risk, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid, user.id, dateStr, crops[cropIdx], labels[cropIdx], location, score, label,
       Math.round(w.temperature), Math.round(w.humidity),
       water, heatStress, diseaseRisk, date.toISOString().slice(0, 19).replace('T', ' ')]
    )
    inserted++
  }

  console.log(`Seeded ${inserted} reports`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
