const { validationResult } = require('express-validator');
const Session = require('../models/Session');

const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, location_address, scheduled_date, scheduled_time, scheduled_end_time, total_cost, max_participants, sport_type, venue_id } = req.body;
  const creatorId = req.user.id;

  // Validate required fields for new sessions with venue assignment
  if (!scheduled_end_time || !sport_type || !venue_id) {
    return res.status(400).json({ error: 'Sport type, venue, and end time are required' });
  }

  try {
    const session = await Session.create(
      creatorId,
      title,
      description,
      location_address,
      scheduled_date,
      scheduled_time,
      total_cost,
      max_participants || 14,
      scheduled_end_time,
      sport_type,
      venue_id
    );

    res.status(201).json({
      message: 'Session created successfully',
      session,
    });
  } catch (err) {
    // Handle specific error cases
    if (err.message === 'NO_FIELD_AVAILABLE') {
      return res.status(409).json({
        error: 'All fields are booked for this time slot. Please choose a different time or venue.',
        errorCode: 'NO_FIELD_AVAILABLE'
      });
    }
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

const listSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'open';
    const date = req.query.date || null;
    const location = req.query.location || null;

    const sessions = await Session.findAll(page, limit, status, date, location);
    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

const getSession = async (req, res) => {
  try {
    const id = req.params.id;
    let session;

    if (/^\d+$/.test(id)) {
      // Numeric - database primary key
      session = await Session.findById(parseInt(id));
    } else if (/^[A-Za-z]{6}$/.test(id)) {
      // 6 letters - invite code
      session = await Session.findByInviteCode(id);
    } else {
      // Otherwise - session_id (xxxx-xxxx-xxxx-xxxx format)
      session = await Session.findBySessionId(id);
    }

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

const updateSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sessionId = parseInt(req.params.id);
    const { title, description, location_address, scheduled_date, scheduled_time, scheduled_end_time, total_cost } = req.body;
    const creatorId = req.user.id;

    const session = await Session.update(
      sessionId,
      creatorId,
      title,
      description,
      location_address,
      scheduled_date,
      scheduled_time,
      total_cost,
      scheduled_end_time || null
    );

    res.json({
      message: 'Session updated successfully',
      session,
    });
  } catch (err) {
    if (err.message === 'Only creator can update session') {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === 'FIELD_NOT_AVAILABLE') {
      return res.status(409).json({
        error: 'The field is not available at the new time. Please choose a different time.',
        errorCode: 'FIELD_NOT_AVAILABLE'
      });
    }
    console.error('Update session error:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

const cancelSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const creatorId = req.user.id;

    const session = await Session.cancel(sessionId, creatorId);

    res.json({
      message: 'Session cancelled successfully',
      session,
    });
  } catch (err) {
    if (err.message === 'Only creator can cancel session') {
      return res.status(403).json({ error: err.message });
    }
    console.error('Cancel session error:', err);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
};

module.exports = {
  createSession,
  listSessions,
  getSession,
  updateSession,
  cancelSession,
};
