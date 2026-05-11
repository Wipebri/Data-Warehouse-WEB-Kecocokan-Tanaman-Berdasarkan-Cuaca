import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const PREDICT_SCRIPT = path.join(__dirname, '..', '..', 'data-analysis', 'predict.py')
const PYTHON = process.env.PYTHON_PATH || 'python'

export function runPrediction(features) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, [PREDICT_SCRIPT])
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (d) => { stdout += d })
    child.stderr.on('data', (d) => { stderr += d })

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python error: ${stderr}`))
      }
      try {
        resolve(JSON.parse(stdout))
      } catch {
        reject(new Error(`Invalid JSON from Python: ${stdout}`))
      }
    })

    child.on('error', reject)
    child.stdin.write(JSON.stringify(features))
    child.stdin.end()
  })
}
