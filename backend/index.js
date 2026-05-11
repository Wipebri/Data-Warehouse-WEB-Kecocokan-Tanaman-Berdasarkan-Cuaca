import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

import predictionRoutes from './routes/prediction.js'
import authRoutes from './routes/auth.js'
import reportRoutes from './routes/reports.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ app: 'AgroSense API', version: '1.0.0', status: 'running' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', predictionRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`AgroSense backend running on http://localhost:${PORT}`)
})
