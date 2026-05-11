import { Router } from 'express'
import { runPrediction } from '../services/ml-service.js'
import { getLocations, fetchWeather, findNearestCity } from '../services/bmkg.js'

const router = Router()

const ALL_CROPS = [
  'banana', 'maize', 'mungbean', 'orange', 'papaya', 'potato', 'tomato', 'watermelon',
]

const SOIL_DEFAULTS = { N: 75, P: 50, K: 45, ph: 6.5 }

router.get('/crops', (req, res) => {
  res.json({ crops: ALL_CROPS })
})

router.get('/locations', (req, res) => {
  res.json({ locations: getLocations() })
})

router.get('/weather/nearest', (req, res) => {
  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })
  const result = findNearestCity(lat, lng)
  res.json(result)
})

router.get('/test-weather', (req, res) => {
  res.json({ message: 'test-weather works' })
})

router.get('/weather', (req, res) => {
  const city = req.query.city
  if (!city) return res.status(400).json({ error: 'query param ?city= required' })
  fetchWeather(city).then(weather => {
    res.json(weather)
  }).catch(err => {
    res.status(500).json({ error: err.message })
  })
})

router.get('/satellite/himawari', async (req, res) => {
  const types = ['EH', 'WE', 'NC']
  for (const type of types) {
    try {
      const url = `https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_${type}_Indonesia.png`
      const resp = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      if (resp.ok || resp.status === 206) return res.json({ url })
    } catch {}
  }
  res.json({ url: null })
})

router.post('/predict/check', async (req, res) => {
  try {
    const { crop, location } = req.body

    if (!crop || !location) {
      return res.status(400).json({ error: 'crop and location are required' })
    }

    const normalizedCrop = crop.toLowerCase().trim()
    if (!ALL_CROPS.includes(normalizedCrop)) {
      return res.status(400).json({ error: `Unknown crop: ${crop}`, validCrops: ALL_CROPS })
    }

    const weather = await fetchWeather(location)

    const features = {
      temperature: weather.temperature,
      humidity: weather.humidity,
      ph: SOIL_DEFAULTS.ph,
    }

    const prediction = await runPrediction(features)

    const isSuitable = prediction.predicted_crop === normalizedCrop
    const probabilityByCrop = new Map(
      (prediction.alternatives || []).map(a => [a.crop, a.probability]),
    )
    const selectedCropConfidence = probabilityByCrop.get(normalizedCrop) ?? 0

    const topAlternatives = (prediction.alternatives || [])
      .filter(a => a.crop !== normalizedCrop)
      .slice(0, 5)

    res.json({
      crop: normalizedCrop,
      location,
      weather: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        current: weather.current,
        forecast: weather.forecast,
        lat: weather.lat,
        lng: weather.lng,
      },
      soil: SOIL_DEFAULTS,
      predicted_crop: prediction.predicted_crop,
      confidence: prediction.confidence,
      selected_crop_confidence: selectedCropConfidence,
      suitable: isSuitable,
      alternatives: topAlternatives,
      message: isSuitable
        ? `${normalizedCrop.charAt(0).toUpperCase() + normalizedCrop.slice(1)} sangat cocok ditanam di ${location} saat ini.`
        : `${normalizedCrop.charAt(0).toUpperCase() + normalizedCrop.slice(1)} kurang cocok ditanam di ${location} saat ini.`,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
