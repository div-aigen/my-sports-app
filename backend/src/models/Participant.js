const pool = require('../config/database');
const { calculateCostPerPerson } = require('../utils/costCalculator');

class Participant {
  static async join(sessionId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if session exists and get total cost
      const sessionResult = await client.query(
        'SELECT * FROM sessions WHERE id = $1 AND status != $2',
        [sessionId, 'cancelled']
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found or is cancelled');
      }

      const session = sessionResult.rows[0];

      // Check if user is already a participant
      const existingParticipant = await client.query(
        'SELECT id FROM participants WHERE session_id = $1 AND user_id = $2 AND status = $3',
        [sessionId, userId, 'active']
      );

      if (existingParticipant.rows.length > 0) {
        throw new Error('User already joined this session');
      }

      // Count current participants
      const countResult = await client.query(
        'SELECT COUNT(*) FROM participants WHERE session_id = $1 AND status = $2',
        [sessionId, 'active']
      );

      const currentCount = parseInt(countResult.rows[0].count);

      // Check max participants
      if (currentCount >= session.max_participants) {
        throw new Error('Session is full');
      }

      // Add participant
      const newCount = currentCount + 1;
      const costPerPerson = calculateCostPerPerson(session.total_cost, newCount);

      const result = await client.query(
        'INSERT INTO participants (session_id, user_id, cost_per_person, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [sessionId, userId, costPerPerson, 'active']
      );

      // Update all participants' costs with the new calculation
      await client.query(
        'UPDATE participants SET cost_per_person = $1 WHERE session_id = $2 AND status = $3',
        [costPerPerson, sessionId, 'active']
      );

      // Update session status if full
      if (newCount >= session.max_participants) {
        await client.query(
          'UPDATE sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['full', sessionId]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async leave(sessionId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is creator
      const sessionResult = await client.query(
        'SELECT * FROM sessions WHERE id = $1',
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }

      const session = sessionResult.rows[0];

      // Check if user is creator and handle ownership transfer
      const isCreator = session.creator_id === userId;
      if (isCreator) {
        // Count other participants (excluding creator)
        const otherParticipantsResult = await client.query(
          'SELECT * FROM participants WHERE session_id = $1 AND user_id != $2 AND status = $3',
          [sessionId, userId, 'active']
        );

        if (otherParticipantsResult.rows.length === 0) {
          throw new Error('Creator cannot leave session when they are the only participant. Please cancel the session instead.');
        }

        // Transfer ownership to a random participant
        const randomIndex = Math.floor(Math.random() * otherParticipantsResult.rows.length);
        const newCreatorId = otherParticipantsResult.rows[randomIndex].user_id;

        await client.query(
          'UPDATE sessions SET creator_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newCreatorId, sessionId]
        );
      }

      // Check if session date/time has passed
      const now = new Date();
      const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`);

      if (now > sessionDateTime) {
        throw new Error('Cannot leave session that has already started');
      }

      // Remove participant
      const removeResult = await client.query(
        'DELETE FROM participants WHERE session_id = $1 AND user_id = $2 AND status = $3 RETURNING *',
        [sessionId, userId, 'active']
      );

      if (removeResult.rows.length === 0) {
        throw new Error('User is not a participant in this session');
      }

      // Count remaining participants
      const countResult = await client.query(
        'SELECT COUNT(*) FROM participants WHERE session_id = $1 AND status = $2',
        [sessionId, 'active']
      );

      const remainingCount = parseInt(countResult.rows[0].count);

      // Recalculate costs for remaining participants
      if (remainingCount > 0) {
        const costPerPerson = calculateCostPerPerson(session.total_cost, remainingCount);
        await client.query(
          'UPDATE participants SET cost_per_person = $1 WHERE session_id = $2 AND status = $3',
          [costPerPerson, sessionId, 'active']
        );
      }

      // Update session status back to open if it was full
      if (session.status === 'full' && remainingCount < session.max_participants) {
        await client.query(
          'UPDATE sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['open', sessionId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async findBySessionId(sessionId) {
    const result = await pool.query(
      `SELECT p.*, u.full_name, u.email, u.phone_number
       FROM participants p
       JOIN users u ON p.user_id = u.id
       WHERE p.session_id = $1 AND p.status = 'active'
       ORDER BY p.created_at ASC`,
      [sessionId]
    );
    return result.rows;
  }

  static async findBySessionAndUserId(sessionId, userId) {
    const result = await pool.query(
      'SELECT * FROM participants WHERE session_id = $1 AND user_id = $2 AND status = $3',
      [sessionId, userId, 'active']
    );
    return result.rows[0];
  }
}

module.exports = Participant;
