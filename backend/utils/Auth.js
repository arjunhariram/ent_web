import bcrypt from 'bcrypt';
import pool from '../db.js';

/**
 * Authenticates a user by comparing the provided password with the stored hash
 * @param {string} mobileNumber - User's mobile number
 * @param {string} password - User's plaintext password to verify
 * @returns {Promise<Object|null>} - Returns user object if authenticated, null otherwise
 */
export const authenticateUser = async (mobileNumber, password) => {
  try {
    // Query to get the user's password hash
    const query = 'SELECT id, mobile_number, password_hash FROM users WHERE mobile_number = $1';
    const { rows } = await pool.query(query, [mobileNumber]);
    
    if (rows.length === 0) {
      return null; // User not found
    }
    
    const user = rows[0];
    const storedHash = user.password_hash;
    
    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);
    
    if (!isMatch) {
      return null; // Password does not match
    }
    
    // If password matches, return user data (excluding password hash)
    return {
      id: user.id,
      mobileNumber: user.mobile_number
    };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
};
