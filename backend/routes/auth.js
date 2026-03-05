const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Seed default users on first startup
const DEFAULT_USERS = [
  { username: 'prem',  password: 'p123' },
  { username: 'admin', password: 'admin123' },
];

async function seedUsers() {
  for (const u of DEFAULT_USERS) {
    const exists = await User.findOne({ username: u.username });
    if (!exists) {
      const newUser = new User({ username: u.username, password: u.password });
      await newUser.save();
      console.log(`✅ Seeded user: ${u.username}`);
    }
  }
}
// Seed after DB connects (called conditionally)
setTimeout(async () => {
  try { await seedUsers(); } catch (e) { /* ignore if DB not ready */ }
}, 2000);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    // Try DB first
    let user = await User.findOne({ username }).catch(() => null);

    // Fallback to hardcoded users (for offline / no-DB mode)
    if (!user) {
      const found = DEFAULT_USERS.find(u => u.username === username);
      if (found && found.password === password) {
        const token = jwt.sign({ id: username, username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, username });
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ error: 'Username already taken' });

    const newUser = new User({ username: username.trim(), email: email?.trim() || '', password });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id.toString(), username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, username: newUser.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me  (requires token)
router.get('/me', async (req, res) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    res.json({ username: decoded.username });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
