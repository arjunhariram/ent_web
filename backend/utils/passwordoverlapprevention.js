import bcrypt from 'bcrypt';
import pool from '../db.js';

/**
 * Verify if the new password is different from current and past passwords
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} newPassword - The plaintext new password the user wants to set
 * @returns {Promise<Object>} - Object with success status and message
 */
export const verifyPasswordNotOverlapping = async (mobileNumber, newPassword) => {
  try {
    // Step 1: Get the user's current password hash from the users table
    const userQuery = {
      text: 'SELECT password_hash FROM users WHERE mobile_number = $1',
      values: [mobileNumber]
    };
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Step 2: Check if new password matches current password
    const currentPasswordHash = userResult.rows[0].password_hash;
    const isCurrentPasswordMatch = await bcrypt.compare(newPassword, currentPasswordHash);
    
    if (isCurrentPasswordMatch) {
      return {
        success: false,
        message: 'New password cannot be the same as your current password'
      };
    }
    
    // Step 3: Get past passwords from user_passwords table
    const pastPasswordsQuery = {
      text: 'SELECT password_hash FROM user_passwords WHERE mobile_number = $1 ORDER BY created_at DESC LIMIT 3',
      values: [mobileNumber]
    };
    
    const pastPasswordsResult = await pool.query(pastPasswordsQuery);
    
    // Step 4: Compare new password with past passwords
    for (const row of pastPasswordsResult.rows) {
      const isPastPasswordMatch = await bcrypt.compare(newPassword, row.password_hash);
      
      if (isPastPasswordMatch) {
        return {
          success: false,
          message: 'You have used this password recently. Please choose a different password'
        };
      }
    }
    
    // If all checks pass, the new password is valid
    return {
      success: true,
      message: 'Password validation passed'
    };
    
  } catch (error) {
    console.error('Error verifying password overlap:', error);
    return {
      success: false,
      message: 'An error occurred while validating the password'
    };
  }
};
