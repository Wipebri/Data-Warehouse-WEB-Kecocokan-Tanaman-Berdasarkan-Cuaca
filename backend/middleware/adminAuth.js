import authMiddleware from './auth.js'

export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya untuk admin.' })
    }
    next()
  })
}

export function superadminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.userRole !== 'superadmin') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya untuk superadmin.' })
    }
    next()
  })
}
