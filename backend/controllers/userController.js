import bcrypt from 'bcrypt';
import pool from '../db.js';
import redisClient from '../utils/redisClient.js';

export const setPassword = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { mobileNumber, password } = req.body;
    console.log('Setting password for mobile:', mobileNumber);
    
    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required'
      });
    }

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    const otpVerified = await redisClient.get(`verified:${cleanNumber}`);
    console.log('OTP verification status:', otpVerified);
    
    if (!otpVerified) {
      return res.status(403).json({
        success: false,
        message: 'OTP verification required before setting password'
      });
    }
    
    // Check if user exists
    const userCheckResult = await client.query(
      'SELECT id FROM users WHERE mobile_number = $1',
      [cleanNumber]
    );
    
    // Prevent existing users from creating a new account
    if (userCheckResult.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already registered. Please login instead.'
      });
    }
    
    await client.query('BEGIN');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');
    
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    console.log('Users table exists:', tableExists);
    
    if (!tableExists) {
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          mobile_number VARCHAR(20) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    }
    
    console.log('Creating new user with mobile:', cleanNumber);
    
    const result = await client.query(
      'INSERT INTO users (mobile_number, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [cleanNumber, passwordHash]
    );
    
    if (result.rowCount === 0) {
      throw new Error('Database operation failed');
    }
    
    const userId = result.rows[0].id;
    await client.query('COMMIT');
    
    await redisClient.delete(`verified:${cleanNumber}`);
    console.log('Password set successfully for user ID:', userId);
    
    res.status(200).json({
      success: true,
      message: 'Account created successfully',
      userId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting password: ' + error.message
    });
  } finally {
    client.release();
  }
};
