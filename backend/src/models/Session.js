const pool = require('../config/database');

class Session {
  static async create(creatorId, title, description, locationAddress, scheduledDate, scheduledTime, totalCost, maxParticipants = 14, scheduledEndTime = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create session
      const sessionResult = await client.query(
        `INSERT INTO sessions (creator_id, title, description, location_address, scheduled_date, scheduled_time, scheduled_end_time, total_cost, max_participants, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
         RETURNING *`,
        [creatorId, title, description, locationAddress, scheduledDate, scheduledTime, scheduledEndTime, totalCost, maxParticipants]
      );

      const session = sessionResult.rows[0];

      // Auto-join creator as first participant
      const costPerPerson = totalCost; // Only creator initially
      await client.query(
        `INSERT INTO participants (session_id, user_id, cost_per_person)
         VALUES ($1, $2, $3)`,
        [session.id, creatorId, costPerPerson]
      );

      await client.query('COMMIT');
      return session;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT s.*, u.full_name as creator_name,
              (SELECT COUNT(*) FROM participants WHERE session_id = s.id AND status = 'active') as participant_count
       FROM sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findAll(page = 1, limit = 10, status = 'open', date = null) {
    let query = `
      SELECT s.*, u.full_name as creator_name,
             (SELECT COUNT(*) FROM participants WHERE session_id = s.id AND status = 'active') as participant_count
      FROM sessions s
      JOIN users u ON s.creator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND s.scheduled_date = $${params.length}`;
    }

    query += ` ORDER BY s.scheduled_date DESC, s.scheduled_time DESC`;

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, creatorId, title, description, locationAddress, scheduledDate, scheduledTime, totalCost, scheduledEndTime = null) {
    // Check if user is creator
    const session = await pool.query('SELECT creator_id FROM sessions WHERE id = $1', [id]);
    if (session.rows[0].creator_id !== creatorId) {
      throw new Error('Only creator can update session');
    }

    const result = await pool.query(
      `UPDATE sessions
       SET title = $1, description = $2, location_address = $3, scheduled_date = $4, scheduled_time = $5, scheduled_end_time = $6, total_cost = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [title, description, locationAddress, scheduledDate, scheduledTime, scheduledEndTime, totalCost, id]
    );
    return result.rows[0];
  }

  static async cancel(id, creatorId) {
    // Check if user is creator
    const session = await pool.query('SELECT creator_id FROM sessions WHERE id = $1', [id]);
    if (session.rows[0].creator_id !== creatorId) {
      throw new Error('Only creator can cancel session');
    }

    const result = await pool.query(
      `UPDATE sessions
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE sessions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }
}

module.exports = Session;
