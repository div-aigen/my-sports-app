const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// --- Helpers ---

function createToken(email) {
  return jwt.sign(
    { sub: email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function parseDateParams(startDate, endDate) {
  let s = null, e = null;
  if (startDate) { try { s = startDate; new Date(s); } catch { s = null; } }
  if (endDate) { try { e = endDate; new Date(e); } catch { e = null; } }
  return [s, e];
}

function dateWhere(col, start, end, paramOffset = 1) {
  const clauses = [];
  const params = [];
  let idx = paramOffset;
  if (start) {
    clauses.push(`${col} >= $${idx}`);
    params.push(start);
    idx++;
  }
  if (end) {
    clauses.push(`${col} <= $${idx}`);
    params.push(end);
    idx++;
  }
  const where = clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
  return { where, params, nextIdx: idx };
}

// --- Auth ---

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT email, password_hash FROM dashboard.admins WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    const token = createToken(email);
    res.json({ token, email });
  } catch (err) {
    console.error('Dashboard login error:', err);
    res.status(500).json({ detail: 'Login failed' });
  }
};

const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const existing = await pool.query(
      'SELECT id FROM dashboard.admins WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO dashboard.admins (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );
    const token = createToken(email);
    res.status(201).json({ token, email: result.rows[0].email });
  } catch (err) {
    console.error('Dashboard signup error:', err);
    res.status(500).json({ detail: 'Signup failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM dashboard.admins WHERE email = $1',
      [req.adminEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ detail: 'Admin not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Dashboard getMe error:', err);
    res.status(500).json({ detail: 'Failed to fetch admin' });
  }
};

const verify = async (req, res) => {
  res.json({ email: req.adminEmail, valid: true });
};

// --- Analytics ---

const getOverview = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);

    const [users, sessions, participants, active, venues, avgP, verified, downloads] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM users WHERE 1=1 ${dw.where}`, dw.params),
      pool.query(`SELECT COUNT(*) as count FROM sessions WHERE 1=1 ${dw.where}`, dw.params),
      pool.query(`SELECT COUNT(*) as count FROM participants WHERE 1=1 ${dw.where}`, dw.params),
      pool.query(`SELECT COUNT(*) as count FROM sessions WHERE status = 'open' ${dw.where}`, dw.params),
      pool.query('SELECT COUNT(*) as count FROM venues'),
      pool.query(`SELECT COALESCE(AVG(participant_count), 0) as avg FROM (SELECT session_id, COUNT(*) as participant_count FROM participants WHERE status = 'active' ${dw.where} GROUP BY session_id) sub`, dw.params),
      pool.query(`SELECT COUNT(*) as count FROM users WHERE email_verified = true ${dw.where}`, dw.params),
      pool.query('SELECT total FROM dashboard.downloads LIMIT 1'),
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_sessions: parseInt(sessions.rows[0].count),
      total_participants: parseInt(participants.rows[0].count),
      active_sessions: parseInt(active.rows[0].count),
      total_venues: parseInt(venues.rows[0].count),
      avg_participants: Math.round(parseFloat(avgP.rows[0].avg) * 10) / 10,
      verified_users: parseInt(verified.rows[0].count),
      total_downloads: downloads.rows.length > 0 ? downloads.rows[0].total : 0,
    });
  } catch (err) {
    console.error('Dashboard overview error:', err);
    res.status(500).json({ detail: 'Failed to fetch overview' });
  }
};

const getUsersGrowth = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count FROM users WHERE 1=1 ${dw.where} GROUP BY date ORDER BY date`,
      dw.params
    );
    let running = 0;
    const data = result.rows.map(r => {
      running += parseInt(r.count);
      return { date: r.date.toISOString().split('T')[0], users: running, new_users: parseInt(r.count) };
    });
    res.json(data);
  } catch (err) {
    console.error('Dashboard users-growth error:', err);
    res.status(500).json({ detail: 'Failed to fetch users growth' });
  }
};

const getSessionsTrend = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT DATE_TRUNC('day', created_at)::date as date, COUNT(*) as count FROM sessions WHERE 1=1 ${dw.where} GROUP BY date ORDER BY date`,
      dw.params
    );
    res.json(result.rows.map(r => ({ date: r.date.toISOString().split('T')[0], sessions: parseInt(r.count) })));
  } catch (err) {
    console.error('Dashboard sessions-trend error:', err);
    res.status(500).json({ detail: 'Failed to fetch sessions trend' });
  }
};

const getSportDistribution = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT COALESCE(sport_type, 'Unknown') as sport, COUNT(*) as count FROM sessions WHERE 1=1 ${dw.where} GROUP BY sport_type ORDER BY count DESC`,
      dw.params
    );
    res.json(result.rows.map(r => ({ sport: r.sport, count: parseInt(r.count) })));
  } catch (err) {
    console.error('Dashboard sport-distribution error:', err);
    res.status(500).json({ detail: 'Failed to fetch sport distribution' });
  }
};

const getVenuePopularity = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('s.created_at::date', sd, ed);
    const joinClause = dw.where ? `AND 1=1 ${dw.where}` : '';
    const result = await pool.query(
      `SELECT v.name as venue, COUNT(s.id) as sessions_count FROM venues v LEFT JOIN sessions s ON s.venue_id = v.id ${joinClause} GROUP BY v.id, v.name ORDER BY sessions_count DESC`,
      dw.params
    );
    res.json(result.rows.map(r => ({ venue: r.venue, sessions: parseInt(r.sessions_count) })));
  } catch (err) {
    console.error('Dashboard venue-popularity error:', err);
    res.status(500).json({ detail: 'Failed to fetch venue popularity' });
  }
};

const getSessionStatus = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT status, COUNT(*) as count FROM sessions WHERE 1=1 ${dw.where} GROUP BY status`,
      dw.params
    );
    res.json(result.rows.map(r => ({ status: r.status, count: parseInt(r.count) })));
  } catch (err) {
    console.error('Dashboard session-status error:', err);
    res.status(500).json({ detail: 'Failed to fetch session status' });
  }
};

const getRecentSessions = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('s.created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT s.id, s.title, s.sport_type, s.status, s.scheduled_date,
              s.scheduled_time, s.scheduled_end_time, s.max_participants,
              s.total_cost, s.location_address,
              u.full_name as creator_name,
              v.name as venue_name,
              (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as participant_count
       FROM sessions s
       LEFT JOIN users u ON s.creator_id = u.id
       LEFT JOIN venues v ON s.venue_id = v.id
       WHERE 1=1 ${dw.where}
       ORDER BY s.created_at DESC LIMIT 20`,
      dw.params
    );
    res.json(result.rows.map(r => ({
      id: r.id,
      title: r.title,
      sport_type: r.sport_type || 'Unknown',
      status: r.status,
      scheduled_date: r.scheduled_date ? r.scheduled_date.toISOString().split('T')[0] : null,
      scheduled_time: r.scheduled_time || null,
      scheduled_end_time: r.scheduled_end_time || null,
      max_participants: r.max_participants,
      total_cost: r.total_cost ? parseFloat(r.total_cost) : 0,
      location_address: r.location_address,
      creator_name: r.creator_name,
      venue_name: r.venue_name,
      participant_count: parseInt(r.participant_count),
    })));
  } catch (err) {
    console.error('Dashboard recent-sessions error:', err);
    res.status(500).json({ detail: 'Failed to fetch recent sessions' });
  }
};

const getParticipantsStats = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('p.created_at::date', sd, ed);
    const topResult = await pool.query(
      `SELECT u.full_name, COUNT(p.id) as sessions_joined
       FROM participants p JOIN users u ON p.user_id = u.id
       WHERE p.status = 'active' ${dw.where}
       GROUP BY u.id, u.full_name ORDER BY sessions_joined DESC LIMIT 10`,
      dw.params
    );

    const dw2 = dateWhere('s.created_at::date', sd, ed);
    const fillResult = await pool.query(
      `SELECT s.id, s.title, s.max_participants,
              (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as filled
       FROM sessions s WHERE 1=1 ${dw2.where} ORDER BY s.created_at DESC`,
      dw2.params
    );

    const top_users = topResult.rows.map(r => ({ name: r.full_name, sessions: parseInt(r.sessions_joined) }));
    const fill_rates = fillResult.rows.map(r => {
      const max = r.max_participants || 14;
      const filled = parseInt(r.filled);
      return { title: r.title, filled, max, rate: Math.round((filled / max) * 1000) / 10 };
    });

    res.json({ top_users, fill_rates });
  } catch (err) {
    console.error('Dashboard participants-stats error:', err);
    res.status(500).json({ detail: 'Failed to fetch participants stats' });
  }
};

// --- Settings ---

const getDownloads = async (req, res) => {
  try {
    const dlResult = await pool.query('SELECT android, ios, total, last_updated FROM dashboard.downloads LIMIT 1');
    if (dlResult.rows.length === 0) {
      return res.json({ android: 0, ios: 0, total: 0, history: [] });
    }
    const doc = dlResult.rows[0];

    const histResult = await pool.query(
      'SELECT platform, count, note, updated_at, updated_by FROM dashboard.download_history ORDER BY updated_at DESC'
    );
    const history = histResult.rows.map(h => ({
      platform: h.platform,
      count: h.count,
      note: h.note,
      updated_at: h.updated_at ? h.updated_at.toISOString() : null,
      updated_by: h.updated_by,
    }));

    res.json({
      android: doc.android,
      ios: doc.ios,
      total: doc.total,
      last_updated: doc.last_updated ? doc.last_updated.toISOString() : null,
      history,
    });
  } catch (err) {
    console.error('Dashboard getDownloads error:', err);
    res.status(500).json({ detail: 'Failed to fetch downloads' });
  }
};

const updateDownloads = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { count, platform = 'android', note = '' } = req.body;
  const now = new Date();

  try {
    // Update platform count
    await pool.query(
      `UPDATE dashboard.downloads SET ${platform === 'ios' ? 'ios' : 'android'} = $1, last_updated = $2`,
      [count, now]
    );

    // Recalculate total
    const dlResult = await pool.query('SELECT android, ios FROM dashboard.downloads LIMIT 1');
    const row = dlResult.rows[0];
    const total = (row.android || 0) + (row.ios || 0);
    await pool.query('UPDATE dashboard.downloads SET total = $1', [total]);

    // Insert history
    await pool.query(
      'INSERT INTO dashboard.download_history (platform, count, note, updated_at, updated_by) VALUES ($1, $2, $3, $4, $5)',
      [platform, count, note, now, req.adminEmail]
    );

    res.json({ android: row.android, ios: row.ios, total, last_updated: now.toISOString() });
  } catch (err) {
    console.error('Dashboard updateDownloads error:', err);
    res.status(500).json({ detail: 'Failed to update downloads' });
  }
};

// --- CSV Exports ---

const exportUsersCsv = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT id, full_name, email, phone_number, email_verified, created_at::date as signup_date
       FROM users WHERE 1=1 ${dw.where} ORDER BY created_at DESC`,
      dw.params
    );
    const header = 'id,full_name,email,phone_number,email_verified,signup_date\n';
    const rows = result.rows.map(r =>
      `${r.id},"${r.full_name || ''}","${r.email}","${r.phone_number || ''}",${r.email_verified},${r.signup_date ? r.signup_date.toISOString().split('T')[0] : ''}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.send(header + rows);
  } catch (err) {
    console.error('Dashboard export users error:', err);
    res.status(500).json({ detail: 'Export failed' });
  }
};

const exportSessionsCsv = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('s.created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT s.id, s.title, s.sport_type, s.status, s.scheduled_date,
              s.scheduled_time, s.scheduled_end_time, s.max_participants,
              s.total_cost, s.location_address,
              u.full_name as creator_name, v.name as venue_name,
              (SELECT COUNT(*) FROM participants p WHERE p.session_id = s.id AND p.status = 'active') as participant_count,
              s.created_at::date as created_date
       FROM sessions s LEFT JOIN users u ON s.creator_id = u.id LEFT JOIN venues v ON s.venue_id = v.id
       WHERE 1=1 ${dw.where} ORDER BY s.created_at DESC`,
      dw.params
    );
    const header = 'id,title,sport_type,status,scheduled_date,scheduled_time,scheduled_end_time,max_participants,total_cost,location_address,creator_name,venue_name,participant_count,created_date\n';
    const rows = result.rows.map(r =>
      `${r.id},"${r.title || ''}","${r.sport_type || 'Unknown'}",${r.status},${r.scheduled_date ? r.scheduled_date.toISOString().split('T')[0] : ''},${r.scheduled_time || ''},${r.scheduled_end_time || ''},${r.max_participants},${r.total_cost ? parseFloat(r.total_cost) : 0},"${r.location_address || ''}","${r.creator_name || ''}","${r.venue_name || ''}",${r.participant_count},${r.created_date ? r.created_date.toISOString().split('T')[0] : ''}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sessions_export.csv');
    res.send(header + rows);
  } catch (err) {
    console.error('Dashboard export sessions error:', err);
    res.status(500).json({ detail: 'Export failed' });
  }
};

const exportParticipantsCsv = async (req, res) => {
  const [sd, ed] = parseDateParams(req.query.start_date, req.query.end_date);
  try {
    const dw = dateWhere('p.created_at::date', sd, ed);
    const result = await pool.query(
      `SELECT p.id, u.full_name as user_name, u.email as user_email,
              s.title as session_title, s.sport_type, s.scheduled_date,
              p.cost_per_person, p.status, p.created_at::date as joined_date
       FROM participants p JOIN users u ON p.user_id = u.id JOIN sessions s ON p.session_id = s.id
       WHERE 1=1 ${dw.where} ORDER BY p.created_at DESC`,
      dw.params
    );
    const header = 'id,user_name,user_email,session_title,sport_type,scheduled_date,cost_per_person,status,joined_date\n';
    const rows = result.rows.map(r =>
      `${r.id},"${r.user_name}","${r.user_email}","${r.session_title}","${r.sport_type || 'Unknown'}",${r.scheduled_date ? r.scheduled_date.toISOString().split('T')[0] : ''},${r.cost_per_person ? parseFloat(r.cost_per_person) : 0},${r.status},${r.joined_date ? r.joined_date.toISOString().split('T')[0] : ''}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=participants_export.csv');
    res.send(header + rows);
  } catch (err) {
    console.error('Dashboard export participants error:', err);
    res.status(500).json({ detail: 'Export failed' });
  }
};

module.exports = {
  login,
  signup,
  getMe,
  verify,
  getOverview,
  getUsersGrowth,
  getSessionsTrend,
  getSportDistribution,
  getVenuePopularity,
  getSessionStatus,
  getRecentSessions,
  getParticipantsStats,
  getDownloads,
  updateDownloads,
  exportUsersCsv,
  exportSessionsCsv,
  exportParticipantsCsv,
};
