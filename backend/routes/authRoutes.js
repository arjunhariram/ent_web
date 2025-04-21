import express from 'express';
import pool from '../db.js';
import { comparePassword, generateToken } from '../utils/authUtils.js';
import auth from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import validatePassword from '../middleware/PasswordValidator.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Please provide mobile number and password' });
    }
    
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE mobile_number = $1',
      [mobile]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    
    const userDetails = await pool.query(
      'SELECT id, mobile_number as mobile FROM users WHERE id = $1',
      [user.id]
    );
    
    res.json({
      success: true,
      token,
      user: userDetails.rows[0]
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, mobile_number as mobile FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/change-password', auth, validatePassword, async (req, res) => {
  const client = await pool.connect();
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const userResult = await client.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await comparePassword(currentPassword, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
