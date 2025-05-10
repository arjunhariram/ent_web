import pool from '../db.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { storePasswordInHistory } from './passwordmover.js';

/**
 * Update user password in the database after verification
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} hashedPassword - The hashed new password
 * @returns {Promise<Object>} - Result with success flag, message, and userId
 */
export async function updateUserPassword(mobileNumber, hashedPassword) {
  const client = await pool.connect();
  
  // Add debugging for parameters
  console.log('updateUserPassword called with mobile:', mobileNumber);
  console.log('Parameter type:', typeof mobileNumber);
  
  // Check if mobileNumber is an object instead of a string
  if (typeof mobileNumber === 'object' && mobileNumber !== null) {
    console.log('Mobile number is an object:', mobileNumber);
    if (mobileNumber.mobileNumber) {
      console.log('Extracting mobileNumber from object');
      mobileNumber = mobileNumber.mobileNumber;
    }
  }
  
  try {
    await client.query('BEGIN');
    
    console.log('About to check if mobile number exists:', mobileNumber);
    
    // Use MobileDBCheck to verify if the mobile number exists
    const mobileExists = await doesMobileNumberExist(mobileNumber);
    
    console.log('Mobile exists check result:', mobileExists);
    
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
    console.log('Running query with mobile:', mobileNumber);
    const userResult = await client.query(userQuery, [mobileNumber]);
    
    console.log('Query result rows count:', userResult.rowCount);
    
    const userId = userResult.rows[0].id;
    const currentPasswordHash = userResult.rows[0].password_hash;
    
    console.log('Found user ID:', userId);
    
    // Store the current password in history before updating
    await storePasswordInHistory(mobileNumber, currentPasswordHash);
    console.log('Old password moved to history');
    
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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      success: false,
      message: 'Database error while updating password'
    };
  } finally {
    client.release();
  }
}
