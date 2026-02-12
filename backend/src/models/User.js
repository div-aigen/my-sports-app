const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

class User {
  static async create(email, password, fullName, phoneNumber) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, phone_number) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, phone_number',
      [email, hashedPassword, fullName, phoneNumber]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, email, full_name, phone_number FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
  }

  static async updateProfile(userId, fullName, phoneNumber) {
    const result = await pool.query(
      'UPDATE users SET full_name = $1, phone_number = $2 WHERE id = $3 RETURNING id, email, full_name, phone_number',
      [fullName, phoneNumber, userId]
    );
    return result.rows[0];
  }

  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, full_name, phone_number',
      [hashedPassword, userId]
    );
    return result.rows[0];
  }

  static async createPasswordResetToken(email) {
    // Generate 6-character hex token (3 bytes = 6 hex chars)
    const token = crypto.randomBytes(3).toString('hex');
    // Token expires in 1 hour
    const expiry = new Date(Date.now() + 3600000);

    const result = await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3 RETURNING email',
      [token, expiry, email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return token;
  }

  static async verifyResetToken(email, token) {
    const result = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expiry > NOW()',
      [email, token]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    return result.rows[0];
  }

  static async resetPasswordWithToken(email, token, newPassword) {
    // Verify token is valid
    const user = await this.verifyResetToken(email, token);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token (one-time use)
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2 RETURNING id, email, full_name, phone_number',
      [hashedPassword, user.id]
    );

    return result.rows[0];
  }
}

module.exports = User;
