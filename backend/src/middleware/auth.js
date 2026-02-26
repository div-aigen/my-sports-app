const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireVerifiedEmail = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!result.rows[0].email_verified) {
      return res.status(403).json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
    }

    next();
  } catch (err) {
    console.error('Email verification check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { authenticateToken, requireVerifiedEmail };
