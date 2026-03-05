const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lighthouse_ai_super_secret_jwt_key_2024';

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches req.user = { id, username } on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
