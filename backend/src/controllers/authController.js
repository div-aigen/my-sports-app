const { validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/emailService');

const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, full_name, phone_number } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create(email, password, full_name, phone_number);
    const token = User.generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      user,
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = User.generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { full_name, phone_number } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.updateProfile(userId, full_name, phone_number);
    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { old_password, new_password } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    const isPasswordValid = await User.verifyPassword(old_password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update to new password
    await User.changePassword(userId, new_password);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findByEmail(email);

    if (user) {
      // Generate reset token
      const resetToken = await User.createPasswordResetToken(email);

      // Send email with reset token
      try {
        await emailService.sendPasswordResetEmail(email, resetToken, user.full_name);
      } catch (emailErr) {
        console.error('Failed to send password reset email:', emailErr);
        // Still return success to user for security
      }
    }

    // Always return success message to prevent email enumeration attacks
    res.json({
      message: 'If that email is registered with us, you will receive a password reset code shortly.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    // Still return success message
    res.json({
      message: 'If that email is registered with us, you will receive a password reset code shortly.',
    });
  }
};

const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, token, new_password } = req.body;

  try {
    // Verify token and reset password
    const user = await User.resetPasswordWithToken(email, token, new_password);

    res.json({
      message: 'Your password has been reset successfully. You can now login with your new password.',
      user,
    });
  } catch (err) {
    console.error('Reset password error:', err);

    // Generic error message for security
    res.status(400).json({
      error: 'Invalid or expired reset code. Please request a new one.',
    });
  }
};

const registerPushToken = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) {
    return res.status(400).json({ error: 'Push token is required' });
  }

  try {
    await User.updatePushToken(userId, token);
    console.log(`[NOTIF] Push token registered for user ${userId}: ${token}`);
    res.json({ message: 'Push token registered successfully' });
  } catch (err) {
    console.error('Register push token error:', err);
    res.status(500).json({ error: 'Failed to register push token' });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  registerPushToken,
};
