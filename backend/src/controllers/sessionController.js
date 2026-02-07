const { validationResult } = require('express-validator');
const Session = require('../models/Session');

const createSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, location_address, scheduled_date, scheduled_time, scheduled_end_time, total_cost, max_participants } = req.body;
  const creatorId = req.user.id;

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
      scheduled_end_time || null
    );

    res.status(201).json({
      message: 'Session created successfully',
      session,
    });
  } catch (err) {
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

    const sessions = await Session.findAll(page, limit, status, date);
    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

const getSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const session = await Session.findById(sessionId);

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
