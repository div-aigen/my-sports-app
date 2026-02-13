const pool = require('../config/database');

class Field {
  /**
   * Find all fields for a specific venue and sport type
   * @param {number} venueId - Venue ID
   * @param {string} sportType - Sport type (e.g., "Football", "Cricket")
   * @returns {Promise<Array>} Array of available field objects
   */
  static async findByVenueAndSport(venueId, sportType) {
    const result = await pool.query(
      `SELECT id, field_name, status
       FROM fields
       WHERE venue_id = $1 AND sport_type = $2 AND status = 'available'
       ORDER BY field_name`,
      [venueId, sportType]
    );
    return result.rows;
  }

  /**
   * Find an available field for a specific time slot
   * This is the CORE CONFLICT DETECTION algorithm
   *
   * Algorithm:
   * 1. Get all fields for this venue + sport combo
   * 2. Find which fields have conflicting bookings (overlapping time)
   * 3. Return first available field (not in conflict list)
   *
   * Time overlap detection: Two sessions overlap if:
   * (start1 < end2) AND (end1 > start2)
   *
   * Example: Request 10:00-12:00
   * - Existing 09:00-10:00: NO conflict (10:00 is start, not overlap)
   * - Existing 10:00-12:00: CONFLICT (exact overlap)
   * - Existing 11:00-13:00: CONFLICT (overlap from 11:00-12:00)
   * - Existing 12:00-14:00: NO conflict (12:00 is start)
   *
   * @param {number} venueId - Venue ID
   * @param {string} sportType - Sport type
   * @param {string} date - Scheduled date (YYYY-MM-DD)
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @param {number|null} excludeSessionId - Session ID to exclude from conflict check (for updates)
   * @returns {Promise<Object|null>} Available field object or null if all fields booked
   */
  static async findAvailableField(venueId, sportType, date, startTime, endTime, excludeSessionId = null) {
    // Step 1: Get all fields for this venue + sport combination
    const allFieldsResult = await pool.query(
      `SELECT id, field_name
       FROM fields
       WHERE venue_id = $1 AND sport_type = $2 AND status = 'available'
       ORDER BY field_name`,
      [venueId, sportType]
    );

    // No fields exist for this venue/sport combination
    if (allFieldsResult.rows.length === 0) {
      return null;
    }

    // Step 2: Find which fields are already booked during the requested time slot
    // Query overlapping sessions on any of these fields
    let conflictQuery = `
      SELECT DISTINCT field_id
      FROM sessions
      WHERE field_id = ANY($1::integer[])
        AND scheduled_date = $2
        AND status != 'cancelled'
        AND (
          -- Two sessions overlap if: (start1 < end2) AND (end1 > start2)
          (scheduled_time < $4 AND scheduled_end_time > $3)
          OR (scheduled_time >= $3 AND scheduled_time < $4)
        )
    `;

    const conflictParams = [
      allFieldsResult.rows.map(f => f.id),  // $1: array of field IDs for this venue+sport
      date,                                   // $2: requested date
      startTime,                              // $3: requested start time
      endTime                                 // $4: requested end time
    ];

    // Exclude current session if updating (prevents self-conflict)
    if (excludeSessionId) {
      conflictQuery += ' AND id != $5';
      conflictParams.push(excludeSessionId);
    }

    const conflictResult = await pool.query(conflictQuery, conflictParams);
    const bookedFieldIds = conflictResult.rows.map(row => row.field_id);

    // Step 3: Find first available field (not in booked list)
    const availableField = allFieldsResult.rows.find(
      field => !bookedFieldIds.includes(field.id)
    );

    return availableField || null;
  }

  /**
   * Check if a specific field is available during a time slot
   * Used when updating sessions to verify field availability at new time
   *
   * @param {number} fieldId - Field ID
   * @param {string} date - Scheduled date (YYYY-MM-DD)
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @param {number|null} excludeSessionId - Session ID to exclude from conflict check
   * @returns {Promise<boolean>} True if field is available, false if conflict exists
   */
  static async isFieldAvailable(fieldId, date, startTime, endTime, excludeSessionId = null) {
    let query = `
      SELECT id
      FROM sessions
      WHERE field_id = $1
        AND scheduled_date = $2
        AND status != 'cancelled'
        AND (
          (scheduled_time < $4 AND scheduled_end_time > $3)
          OR (scheduled_time >= $3 AND scheduled_time < $4)
        )
      LIMIT 1
    `;

    const params = [fieldId, date, startTime, endTime];

    if (excludeSessionId) {
      query = query.replace('LIMIT 1', 'AND id != $5 LIMIT 1');
      params.push(excludeSessionId);
    }

    const result = await pool.query(query, params);
    return result.rows.length === 0; // Available if no conflicts found
  }

  /**
   * Get field by ID
   * @param {number} id - Field ID
   * @returns {Promise<Object|null>} Field object or null
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM fields WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Field;
