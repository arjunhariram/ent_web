import pool from '../db.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';

/**
 * Update user password in the database after OTP verification
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} hashedPassword - The hashed new password
 * @returns {Promise<Object>} - Result with success flag, message, and userId
 */
export async function updateUserPassword(mobileNumber, hashedPassword) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Use MobileDBCheck to verify if the mobile number exists
    const mobileExists = await doesMobileNumberExist(mobileNumber);
    
    // Safety check using MobileDBCheck
    if (!mobileExists) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'User not found with the provided mobile number'
      };
    }
    
    // Get user ID and current password
    const userQuery = 'SELECT id, password_hash FROM users WHERE mobile_number = $1';
    const userResult = await client.query(userQuery, [mobileNumber]);
    
    const userId = userResult.rows[0].id;
    const currentPasswordHash = userResult.rows[0].password_hash;
    
    // Prevent reuse of the same password 
    if (currentPasswordHash === hashedPassword) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'New password must be different from current password'
      };
    }
    
    // Update the password
    const updateQuery = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    await client.query(updateQuery, [hashedPassword, userId]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      message: 'Password updated successfully',
      userId: userId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user password:', error);
    
    return {
      success: false,
      message: 'Database error while updating password'
    };
  } finally {
    client.release();
  }
}
