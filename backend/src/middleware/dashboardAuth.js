const jwt = require('jsonwebtoken');

const authenticateDashboardToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ detail: 'Invalid or expired token' });
    }
    // Dashboard tokens use "sub" (email) instead of "id"
    req.adminEmail = payload.sub;
    next();
  });
};

module.exports = { authenticateDashboardToken };
