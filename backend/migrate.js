import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrosense',
  waitForConnections: true,
  connectionLimit: 2,
})

async function migrate() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
    console.log('Migration berhasil: kolom role dan created_at ditambahkan')
  } catch (err) {
    console.log('Error:', err.message)
    console.log('Coba query manual...')
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'`)
      await pool.query(`ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
      console.log('Migration berhasil (tanpa IF NOT EXISTS)')
    } catch (e) {
      if (e.errno === 1060) {
        console.log('Kolom sudah ada, tidak perlu migrasi')
      } else {
        console.error('Migration gagal:', e.message)
      }
    }
  }
  process.exit(0)
}

migrate()
