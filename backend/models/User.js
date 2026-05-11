import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrosense',
  waitForConnections: true,
  connectionLimit: 10,
})

export async function createUser({ name, email, password, role = 'user' }) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
  if (existing.length > 0) throw Object.assign(new Error('Email sudah terdaftar'), { status: 409 })
  const hash = await bcrypt.hash(password, 12)
  const id = crypto.randomUUID()
  await pool.query('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [id, name, email.toLowerCase(), hash, role])
  return { id, name, email: email.toLowerCase(), role }
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
  return rows[0] || null
}

export async function findUserById(id) {
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id])
  return rows[0] || null
}

export async function comparePassword(user, candidate) {
  return bcrypt.compare(candidate, user.password)
}

export async function getAllUsers() {
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
  return rows
}

export async function updateUserRole(id, role) {
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id])
}

export async function deleteUserById(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id])
}

export async function countUsers() {
  const [rows] = await pool.query('SELECT COUNT(*) as total FROM users')
  return rows[0].total
}

export async function countUsersByRole() {
  const [rows] = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role')
  return rows
}
