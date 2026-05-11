import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    req.userRole = decoded.role || 'user'
    next()
  } catch {
    res.status(401).json({ error: 'Token tidak valid' })
  }
}
