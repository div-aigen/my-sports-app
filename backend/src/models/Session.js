const pool = require('../config/database');
const Field = require('./Field');

/**
 * Generate a unique 16-character alphanumeric session ID
 * Format: xxxx-xxxx-xxxx-xxxx (lowercase letters and numbers with hyphens)
 */
function generateSessionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let sessionId = '';
  for (let i = 0; i < 16; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i !== 15) {
      sessionId += '-';
    }
  }
  return sessionId;
}

/**
 * Generate a short 6-character uppercase alphabet invite code
 * Format: XXXXXX (e.g., ABCDEF) - easy to share verbally or type
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class Session {
  /**
   * Create a new session with automatic field assignment
   * @param {number} creatorId - User ID of session creator
   * @param {string} title - Session title
   * @param {string} description - Session description
   * @param {string} locationAddress - Location address (for display/backward compatibility)
   * @param {string} scheduledDate - Date in YYYY-MM-DD format
   * @param {string} scheduledTime - Start time in HH:MM format
   * @param {number} totalCost - Total cost for the session
   * @param {number} maxParticipants - Maximum participants (default 14)
   * @param {string|null} scheduledEndTime - End time in HH:MM format
   * @param {string|null} sportType - Sport type (e.g., "Football", "Cricket")
   * @param {number|null} venueId - Venue ID (from venues table)
   * @returns {Promise<Object>} Created session object with field assignment
   * @throws {Error} "NO_FIELD_AVAILABLE" if all fields booked for this time slot
   */
  static async create(creatorId, title, description, locationAddress, scheduledDate, scheduledTime, totalCost, maxParticipants = 14, scheduledEndTime = null, sportType = null, venueId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let assignedFieldId = null;

      // If venue and sport are provided, find and assign an available field
      if (sportType && venueId && scheduledEndTime) {
        const availableField = await Field.findAvailableField(
          venueId,
          sportType,
          scheduledDate,
          scheduledTime,
          scheduledEndTime
        );

        if (!availableField) {
          throw new Error('NO_FIELD_AVAILABLE');
        }

        assignedFieldId = availableField.id;
      }

      // Generate unique IDs
      const sessionId = generateSessionId();
      const inviteCode = generateInviteCode();

      // Create session with venue and field information
      const sessionResult = await client.query(
        `INSERT INTO sessions (session_id, invite_code, creator_id, title, description, location_address, scheduled_date, scheduled_time, scheduled_end_time, total_cost, max_participants, status, sport_type, venue_id, field_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open', $12, $13, $14)
         RETURNING *`,
        [sessionId, inviteCode, creatorId, title, description, locationAddress, scheduledDate, scheduledTime, scheduledEndTime, totalCost, maxParticipants, sportType, venueId, assignedFieldId]
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

  static async findBySessionId(sessionId) {
    const result = await pool.query(
      `SELECT s.*, u.full_name as creator_name,
              (SELECT COUNT(*) FROM participants WHERE session_id = s.id AND status = 'active') as participant_count
       FROM sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.session_id = $1`,
      [sessionId]
    );
    return result.rows[0];
  }

  static async findByInviteCode(inviteCode) {
    const result = await pool.query(
      `SELECT s.*, u.full_name as creator_name,
              (SELECT COUNT(*) FROM participants WHERE session_id = s.id AND status = 'active') as participant_count
       FROM sessions s
       JOIN users u ON s.creator_id = u.id
       WHERE s.invite_code = $1`,
      [inviteCode.toUpperCase()]
    );
    return result.rows[0];
  }

  static async findAll(page = 1, limit = 10, status = 'open', date = null, location = null, sportType = null) {
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

    if (location) {
      params.push(`%${location}%`);
      query += ` AND s.location_address ILIKE $${params.length}`;
    }

    if (sportType) {
      params.push(sportType);
      query += ` AND s.sport_type = $${params.length}`;
    }

    query += ` ORDER BY s.scheduled_date DESC, s.scheduled_time DESC`;

    const offset = (page - 1) * limit;
    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update an existing session with conflict detection
   * If time/date changes, verifies that the assigned field is still available
   * @throws {Error} "FIELD_NOT_AVAILABLE" if field is no longer available at new time
   */
  static async update(id, creatorId, title, description, locationAddress, scheduledDate, scheduledTime, totalCost, scheduledEndTime = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if user is creator and get existing session details
      const sessionResult = await client.query(
        'SELECT creator_id, field_id, scheduled_date, scheduled_time, scheduled_end_time FROM sessions WHERE id = $1',
        [id]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }

      const existingSession = sessionResult.rows[0];

      if (existingSession.creator_id !== creatorId) {
        throw new Error('Only creator can update session');
      }

      // If session has a field assignment, check if time/date change creates conflict
      if (existingSession.field_id && scheduledEndTime) {
        const dateChanged = existingSession.scheduled_date !== scheduledDate;
        const timeChanged =
          existingSession.scheduled_time !== scheduledTime ||
          existingSession.scheduled_end_time !== scheduledEndTime;

        // If date or time changed, verify field is still available
        if (dateChanged || timeChanged) {
          const isAvailable = await Field.isFieldAvailable(
            existingSession.field_id,
            scheduledDate,
            scheduledTime,
            scheduledEndTime,
            id // Exclude current session from conflict check
          );

          if (!isAvailable) {
            throw new Error('FIELD_NOT_AVAILABLE');
          }
        }
      }

      // Update session
      const result = await client.query(
        `UPDATE sessions
         SET title = $1, description = $2, location_address = $3, scheduled_date = $4, scheduled_time = $5, scheduled_end_time = $6, total_cost = $7, updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [title, description, locationAddress, scheduledDate, scheduledTime, scheduledEndTime, totalCost, id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
