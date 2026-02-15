const pool = require('../config/database');

class Venue {
  /**
   * Get all active venues with their available sports
   * Returns venues with aggregated list of sports
   * @returns {Promise<Array>} Array of venue objects with available_sports array
   */
  static async findAllWithSports() {
    const query = `
      SELECT
        v.id,
        v.name,
        v.address,
        v.city,
        v.description,
        v.status,
        v.maps_url,
        ARRAY_AGG(DISTINCT f.sport_type ORDER BY f.sport_type) as available_sports
      FROM venues v
      LEFT JOIN fields f ON v.id = f.venue_id AND f.status = 'available'
      WHERE v.status = 'active'
      GROUP BY v.id, v.name, v.address, v.city, v.description, v.status, v.maps_url
      ORDER BY v.name
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get a single venue by ID with all its fields
   * @param {number} id - Venue ID
   * @returns {Promise<Object|null>} Venue object with fields array, or null if not found
   */
  static async findByIdWithFields(id) {
    const venueResult = await pool.query(
      'SELECT * FROM venues WHERE id = $1',
      [id]
    );

    if (venueResult.rows.length === 0) {
      return null;
    }

    const fieldsResult = await pool.query(
      `SELECT id, sport_type, field_name, status
       FROM fields
       WHERE venue_id = $1
       ORDER BY sport_type, field_name`,
      [id]
    );

    return {
      ...venueResult.rows[0],
      fields: fieldsResult.rows
    };
  }

  /**
   * Get venue by name
   * @param {string} name - Venue name
   * @returns {Promise<Object|null>} Venue object or null
   */
  static async findByName(name) {
    const result = await pool.query(
      'SELECT * FROM venues WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }
}

module.exports = Venue;
