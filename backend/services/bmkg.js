import { getSubdistricts } from './subdistricts.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BMKG_API = 'https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4='

const CACHE_FILE = join(__dirname, 'cache', 'weather-cache.json')

// Throttle: minimum seconds between API calls per city
const THROTTLE_SECONDS = 180
const inMemoryThrottle = new Map()

const TZ_OFFSET = {
  'WIB': 7, 'WITA': 8, 'WIT': 9,
}

const LOCATIONS = [
  { city: 'Jakarta', province: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, adm4: '31.71.01.1001', tz: 'WIB' },
  { city: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lng: 107.6191, adm4: '32.73.01.1001', tz: 'WIB' },
  { city: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lng: 112.7521, adm4: '35.78.01.1001', tz: 'WIB' },
  { city: 'Semarang', province: 'Jawa Tengah', lat: -6.9932, lng: 110.4203, adm4: '33.74.01.1001', tz: 'WIB' },
  { city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695, adm4: '34.71.01.1001', tz: 'WIB' },
  { city: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lng: 98.6722, adm4: '12.71.01.1001', tz: 'WIB' },
  { city: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754, adm4: '16.71.01.1001', tz: 'WIB' },
  { city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327, adm4: '73.71.01.1001', tz: 'WITA' },
  { city: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126, adm4: '51.71.01.1001', tz: 'WITA' },
  { city: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lng: 124.8421, adm4: '71.71.01.1001', tz: 'WITA' },
  { city: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lng: 109.3425, adm4: '61.71.02.1001', tz: 'WIB' },
  { city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lng: 116.8529, adm4: '64.71.01.1001', tz: 'WITA' },
  { city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3186, lng: 114.5944, adm4: '63.71.01.1001', tz: 'WITA' },
  { city: 'Pekanbaru', province: 'Riau', lat: 0.5071, lng: 101.4478, adm4: '14.71.02.1001', tz: 'WIB' },
  { city: 'Batam', province: 'Kepulauan Riau', lat: 1.0456, lng: 104.0305, adm4: '21.71.02.1001', tz: 'WIB' },
  { city: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lng: 100.4172, adm4: '13.71.01.1001', tz: 'WIB' },
  { city: 'Bogor', province: 'Jawa Barat', lat: -6.5971, lng: 106.8060, adm4: '32.71.01.1001', tz: 'WIB' },
  { city: 'Malang', province: 'Jawa Timur', lat: -7.9797, lng: 112.6304, adm4: '35.73.01.1001', tz: 'WIB' },
  { city: 'Solo', province: 'Jawa Tengah', lat: -7.5667, lng: 110.8281, adm4: '33.72.01.1001', tz: 'WIB' },
  { city: 'Cirebon', province: 'Jawa Barat', lat: -6.7318, lng: 108.5521, adm4: '32.74.01.1001', tz: 'WIB' },
  { city: 'Tangerang', province: 'Banten', lat: -6.1781, lng: 106.6300, adm4: '36.71.01.1001', tz: 'WIB' },
  { city: 'Bekasi', province: 'Jawa Barat', lat: -6.2383, lng: 106.9756, adm4: '32.75.01.1001', tz: 'WIB' },
  { city: 'Depok', province: 'Jawa Barat', lat: -6.4025, lng: 106.7942, adm4: '32.76.03.1001', tz: 'WIB' },
  { city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lng: 117.1536, adm4: '64.72.01.1001', tz: 'WITA' },
  { city: 'Jayapura', province: 'Papua', lat: -2.5910, lng: 140.6690, adm4: '91.71.01.1001', tz: 'WIT' },
  { city: 'Ambon', province: 'Maluku', lat: -3.6554, lng: 128.1908, tz: 'WIT' },
  { city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167, adm4: '52.71.02.1001', tz: 'WITA' },
  { city: 'Kupang', province: 'Nusa Tenggara Timur', lat: -10.1617, lng: 123.6078, adm4: '53.71.01.1001', tz: 'WITA' },
  { city: 'Palu', province: 'Sulawesi Tengah', lat: -0.8986, lng: 119.8704, adm4: '72.71.03.1001', tz: 'WITA' },
  { city: 'Kendari', province: 'Sulawesi Tenggara', lat: -3.9985, lng: 122.5150, adm4: '74.71.03.1001', tz: 'WITA' },
  { city: 'Banda Aceh', province: 'Aceh', lat: 5.5483, lng: 95.3238, tz: 'WIB' },
  { city: 'Jambi', province: 'Jambi', lat: -1.6099, lng: 103.6138, adm4: '15.71.01.1001', tz: 'WIB' },
  { city: 'Bengkulu', province: 'Bengkulu', lat: -3.7975, lng: 102.2652, adm4: '17.71.01.1001', tz: 'WIB' },
  { city: 'Tanjung Pinang', province: 'Kepulauan Riau', lat: 0.9168, lng: 104.4433, adm4: '21.72.01.1001', tz: 'WIB' },
  { city: 'Mamuju', province: 'Sulawesi Barat', lat: -2.6853, lng: 118.8861, tz: 'WITA' },
  { city: 'Gorontalo', province: 'Gorontalo', lat: 0.5333, lng: 123.0667, adm4: '75.71.01.1001', tz: 'WITA' },
  { city: 'Ternate', province: 'Maluku Utara', lat: 0.7833, lng: 127.3833, adm4: '82.71.02.1001', tz: 'WIT' },
  { city: 'Palangkaraya', province: 'Kalimantan Tengah', lat: -2.2131, lng: 113.9172, adm4: '62.71.01.1001', tz: 'WIB' },
  { city: 'Manokwari', province: 'Papua Barat', lat: -0.8667, lng: 134.0833, tz: 'WIT' },
  { city: 'Tanjung Selor', province: 'Kalimantan Utara', lat: 2.8433, lng: 117.3667, adm4: '65.71.01.1001', tz: 'WITA' },
  { city: 'Pangkal Pinang', province: 'Kepulauan Bangka Belitung', lat: -2.1333, lng: 106.1167, adm4: '19.71.02.1001', tz: 'WIB' },
  { city: 'Bandar Lampung', province: 'Lampung', lat: -5.4293, lng: 105.2614, adm4: '18.71.03.1001', tz: 'WIB' },
  { city: 'Serang', province: 'Banten', lat: -6.1167, lng: 106.1503, adm4: '36.73.01.1001', tz: 'WIB' },
]

function readCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function writeCache(cache) {
  try {
    const dir = dirname(CACHE_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8')
  } catch (e) {
    console.error('Cache write error:', e.message)
  }
}

export function getLocations() {
  return LOCATIONS.map((l, i) => ({
    id: i + 1,
    city: l.city,
    province: l.province,
    lat: l.lat,
    lng: l.lng,
    subdistricts: getSubdistricts(l.city),
  }))
}

export function findNearestCity(lat, lng) {
  let nearest = LOCATIONS[0]
  let minDist = Infinity
  for (const loc of LOCATIONS) {
    const d = Math.sqrt((loc.lat - lat) ** 2 + (loc.lng - lng) ** 2)
    if (d < minDist) {
      minDist = d
      nearest = loc
    }
  }
  return { city: nearest.city, lat: nearest.lat, lng: nearest.lng }
}

function getNowLocal(tzAbbr) {
  const offset = TZ_OFFSET[tzAbbr] || 7
  const ms = Date.now() + offset * 3600000
  const d = new Date(ms)
  const pad = n => String(n).padStart(2, '0')
  return {
    iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`,
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    totalMinutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
  }
}

function parseLocalDatetime(str) {
  if (!str) return null
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  return {
    date: `${m[1]}-${m[2]}-${m[3]}`,
    hours: parseInt(m[4]),
    minutes: parseInt(m[5]),
    totalMinutes: parseInt(m[4]) * 60 + parseInt(m[5]),
  }
}

export async function fetchWeather(cityName) {
  const loc = LOCATIONS.find(l => l.city.toLowerCase() === cityName.toLowerCase())
  if (!loc) return generateFallbackForecast(cityName, null)

  const now = getNowLocal(loc.tz || 'WIB')
  const cache = readCache()
  const cacheKey = `${cityName.toLowerCase().trim()}`

  // Try fresh API call (with throttle)
  if (loc.adm4) {
    const lastCall = inMemoryThrottle.get(cacheKey) || 0
    const elapsed = (Date.now() - lastCall) / 1000

    if (elapsed >= THROTTLE_SECONDS) {
      try {
        inMemoryThrottle.set(cacheKey, Date.now())

        const url = `${BMKG_API}${loc.adm4}`
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) throw new Error(`BMKG API HTTP ${res.status}`)

        const body = await res.json()
        if (!body.data || !body.data[0] || !body.data[0].cuaca) {
          throw new Error('Unexpected BMKG response structure')
        }

        const allEntries = body.data[0].cuaca.flat()
        if (allEntries.length === 0) throw new Error('Empty cuaca data')

        const analysisDates = allEntries
          .filter(e => e.analysis_date)
          .map(e => e.analysis_date)
        const analysisDate = analysisDates[0] || 'unknown'

        const result = buildWeatherResult(cityName, loc, allEntries, analysisDate, now)

        // Cache it
        cache[cacheKey] = {
          data: result,
          analysisDate,
          cachedAt: Date.now(),
        }
        writeCache(cache)

        return result
      } catch (e) {
        console.error(`BMKG fetch error for ${cityName}: ${e.message}`)
        inMemoryThrottle.delete(cacheKey)
      }
    }
  }

  // Fallback to file cache
  if (cache[cacheKey]) {
    const cached = cache[cacheKey]
    if (cached.data) return cached.data
  }

  // Last resort: generate seeded forecast
  const fallback = generateFallbackForecast(cityName, loc)
  cache[cacheKey] = { data: fallback, analysisDate: 'fallback', cachedAt: Date.now() }
  writeCache(cache)
  return fallback
}

function buildWeatherResult(cityName, loc, allEntries, analysisDate, now) {
  // Find the entry closest to current time (prefer past over future)
  const current = findNearestSlot(allEntries, now)

  const dailyForecast = buildDailyForecast(allEntries, now)

  // Build hourly time-slot data for detailed charts
  const hourly = allEntries
    .filter(e => e.local_datetime && e.t != null)
    .map(e => {
      const p = parseLocalDatetime(e.local_datetime)
      return {
        datetime: e.local_datetime,
        date: p?.date || '',
        hour: p?.hours ?? 0,
        temperature: e.t,
        humidity: e.hu,
        rainfall: e.tp ?? 0,
        windSpeed: e.ws ?? 0,
        windDirection: e.wd || '',
        conditionCode: e.weather,
        condition: e.weather_desc || '',
      }
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime))

  return {
    location: cityName,
    lat: loc.lat,
    lng: loc.lng,
    temperature: current ? current.t : null,
    humidity: current ? current.hu : null,
    rainfall: current ? current.tp : null,
    weather_desc: current ? current.weather_desc : null,
    weather_desc_en: current ? current.weather_desc_en : null,
    current: current ? {
      date: parseLocalDatetime(current.local_datetime)?.date || now.date,
      local_datetime: current.local_datetime,
      temperature: current.t,
      humidity: current.hu,
      rainfall: current.tp,
      windSpeed: current.ws,
      windDirection: current.wd,
      conditionCode: current.weather,
      condition: current.weather_desc,
      temperatureMin: getDayMinMax(allEntries, now.date).min,
      temperatureMax: getDayMinMax(allEntries, now.date).max,
    } : null,
    forecast: dailyForecast,
    hourly,
    analysis_date: analysisDate,
  }
}

function findNearestSlot(entries, now) {
  let bestPast = null
  let bestPastDiff = Infinity
  let bestFuture = null
  let bestFutureDiff = Infinity

  for (const e of entries) {
    const p = parseLocalDatetime(e.local_datetime)
    if (!p) continue

    const diff = p.totalMinutes - now.totalMinutes

    if (diff <= 0) {
      // Past or current slot
      const absDiff = Math.abs(diff)
      if (absDiff < bestPastDiff) {
        bestPastDiff = absDiff
        bestPast = e
      }
    } else {
      // Future slot
      if (diff < bestFutureDiff) {
        bestFutureDiff = diff
        bestFuture = e
      }
    }
  }

  // Prefer past slots (if within 6 hours)
  if (bestPast && bestPastDiff <= 360) return bestPast
  // Fall back to closest future slot
  if (bestFuture) return bestFuture
  // Last resort
  return bestPast || entries[0]
}

function getDayMinMax(entries, dateStr) {
  const day = entries.filter(e => {
    const p = parseLocalDatetime(e.local_datetime)
    return p && p.date === dateStr && e.t != null
  })
  if (day.length === 0) return { min: null, max: null }
  const temps = day.map(e => e.t)
  return {
    min: Math.min(...temps),
    max: Math.max(...temps),
  }
}

function buildDailyForecast(entries, now) {
  const days = new Map()
  for (const e of entries) {
    const p = parseLocalDatetime(e.local_datetime)
    if (!p) continue
    if (!days.has(p.date)) days.set(p.date, [])
    days.get(p.date).push(e)
  }

  const sortedDates = [...days.keys()].sort()
  const forecast = []

  for (const date of sortedDates) {
    if (forecast.length >= 7) break
    const dayEntries = days.get(date)
    const temps = dayEntries.filter(e => e.t != null).map(e => e.t)
    const hums = dayEntries.filter(e => e.hu != null).map(e => e.hu)
    const rains = dayEntries.filter(e => e.tp != null).map(e => e.tp)
    const winds = dayEntries.filter(e => e.ws != null).map(e => e.ws)

    const avgTemp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null
    const avgHum = hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null
    const totalRain = rains.length ? Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10 : 0
    const avgWind = winds.length ? Math.round(winds.reduce((a, b) => a + b, 0) / winds.length * 10) / 10 : null

    const mid = dayEntries[Math.floor(dayEntries.length / 2)] || dayEntries[0]
    const tempsA = temps.length ? temps : [null]

    forecast.push({
      date,
      temperature: avgTemp,
      humidity: avgHum,
      rainfall: totalRain,
      windSpeed: avgWind,
      windDirection: mid.wd || null,
      conditionCode: mid.weather || null,
      condition: mid.weather_desc || 'Prakiraan',
      temperatureMin: Math.min(...tempsA),
      temperatureMax: Math.max(...tempsA),
    })
  }

  while (forecast.length < 7) {
    const last = forecast[forecast.length - 1]
    const d = new Date(now.date)
    d.setUTCDate(d.getUTCDate() + forecast.length)
    const pad = n => String(n).padStart(2, '0')
    forecast.push({
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      temperature: last?.temperature ?? null,
      humidity: last?.humidity ?? null,
      rainfall: 0,
      windSpeed: null,
      windDirection: null,
      conditionCode: null,
      condition: 'Prakiraan',
    })
  }

  return forecast
}

function generateFallbackForecast(cityName, loc) {
  const now = getNowLocal(loc?.tz || 'WIB')
  const seed = Math.abs(hashCode(`${cityName.toLowerCase()}-${now.date}`))
  const rand = createSeededRandom(seed)
  const forecast = []
  const hourly = []

  for (let i = 0; i < 7; i++) {
    const t = 26 + rand() * 6
    const h = 65 + rand() * 25
    const r = rand() * 250
    const code = r > 150 ? 60 : r > 80 ? 3 : Math.floor(rand() * 3)
    const d = new Date(now.date)
    d.setUTCDate(d.getUTCDate() + i)
    const pad = n => String(n).padStart(2, '0')
    const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    forecast.push({
      date: dateStr,
      temperature: Math.round(t * 10) / 10,
      humidity: Math.round(h),
      rainfall: Math.round(r * 10) / 10,
      windSpeed: Math.round(5 + rand() * 25),
      windDirection: ['Utara', 'Timur', 'Selatan', 'Barat', 'Barat Daya', 'Barat Laut', 'Tenggara', 'Timur Laut'][Math.floor(rand() * 8)],
      conditionCode: code,
      condition: WEATHER_NAMES[code] || 'Cerah',
      temperatureMin: Math.round((t - 3) * 10) / 10,
      temperatureMax: Math.round((t + 3) * 10) / 10,
    })

    // Generate 4 hourly slots per day (00, 06, 12, 18)
    for (const hour of [0, 6, 12, 18]) {
      const hTemp = t + (Math.sin(hour / 24 * Math.PI * 2 - 1) * 3) + (rand() - 0.5) * 2
      const hHum = h + (Math.cos(hour / 24 * Math.PI * 2) * 8) + (rand() - 0.5) * 4
      const hRain = Math.max(0, r * (0.15 + rand() * 0.2))
      hourly.push({
        datetime: `${dateStr} ${pad(hour)}:00:00`,
        date: dateStr,
        hour,
        temperature: Math.round(hTemp * 10) / 10,
        humidity: Math.round(Math.min(100, Math.max(40, hHum))),
        rainfall: Math.round(hRain * 10) / 10,
        windSpeed: Math.round((5 + rand() * 20) * 10) / 10,
        windDirection: ['Utara', 'Timur', 'Selatan', 'Barat'][Math.floor(rand() * 4)],
        conditionCode: code,
        condition: WEATHER_NAMES[code] || 'Cerah',
      })
    }
  }

  return {
    location: cityName,
    lat: loc?.lat || null,
    lng: loc?.lng || null,
    temperature: forecast[0].temperature,
    humidity: forecast[0].humidity,
    rainfall: forecast[0].rainfall,
    weather_desc: forecast[0].condition,
    current: forecast[0],
    forecast,
    hourly,
  }
}

const WEATHER_NAMES = {
  0: 'Cerah', 1: 'Cerah', 2: 'Cerah Berawan', 3: 'Berawan',
  4: 'Berawan Tebal', 5: 'Udara Kabur', 10: 'Asap', 45: 'Kabut',
  60: 'Hujan Ringan', 61: 'Hujan Sedang', 62: 'Hujan Lebat',
  63: 'Hujan Lokal', 80: 'Hujan Petir', 95: 'Hujan Petir',
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function createSeededRandom(seed) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}
