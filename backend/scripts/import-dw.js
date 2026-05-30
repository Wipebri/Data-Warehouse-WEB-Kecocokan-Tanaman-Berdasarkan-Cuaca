import mysql from 'mysql2/promise'
import fs from 'fs'
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

const DW_DIR = path.join(__dirname, '..', '..', 'data-analysis', 'data-warehouse')

async function importCSV(table, filePath, columns) {
  const content = fs.readFileSync(filePath, 'utf-8').trim()
  const lines = content.split('\n')
  const rows = lines.slice(1).filter(l => l.trim())
  console.log(`  ${table}: ${rows.length} baris`)

  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const placeholders = batch.map(() => `(${columns.map(() => '?').join(',')})`).join(',')
    const values = batch.flatMap(line => {
      const cols = line.split(',')
      return columns.map((_, ci) => {
        const v = cols[ci]?.trim()
        return v === '' ? null : (isNaN(Number(v)) ? v : Number(v))
      })
    })
    await pool.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`, values)
  }
}

async function main() {
  console.log('Memulai import data warehouse...\n')

  // Create tables
  await pool.query(`DROP TABLE IF EXISTS dw_fact_prediction`)
  await pool.query(`DROP TABLE IF EXISTS dw_dim_crop`)
  await pool.query(`DROP TABLE IF EXISTS dw_dim_soil`)
  await pool.query(`DROP TABLE IF EXISTS dw_dim_weather`)

  await pool.query(`CREATE TABLE dw_dim_crop (crop_id INT PRIMARY KEY, crop_name VARCHAR(50))`)
  await pool.query(`CREATE TABLE dw_dim_soil (soil_id INT PRIMARY KEY, ph DOUBLE)`)
  await pool.query(`CREATE TABLE dw_dim_weather (weather_id INT PRIMARY KEY, temperature DOUBLE, humidity DOUBLE)`)
  await pool.query(`CREATE TABLE dw_fact_prediction (prediction_id INT PRIMARY KEY, crop_id INT, weather_id INT, soil_id INT)`)

  // Import
  await importCSV('dw_dim_crop', path.join(DW_DIR, 'dimension', 'dim_crop.csv'), ['crop_id', 'crop_name'])
  await importCSV('dw_dim_soil', path.join(DW_DIR, 'dimension', 'dim_soil.csv'), ['soil_id', 'ph'])
  await importCSV('dw_dim_weather', path.join(DW_DIR, 'dimension', 'dim_weather.csv'), ['weather_id', 'temperature', 'humidity'])
  await importCSV('dw_fact_prediction', path.join(DW_DIR, 'fact', 'fact_prediction.csv'), ['prediction_id', 'crop_id', 'weather_id', 'soil_id'])

  console.log('\nSelesai!')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
