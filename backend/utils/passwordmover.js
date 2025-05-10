import pool from '../db.js';

/**
 * Check how many password entries exist for a user
 * @param {object} client - Database client connection
 * @param {string} mobileNumber - The user's mobile number
 * @returns {Promise<number>} - Number of password entries
 */
async function getPasswordEntriesCount(client, mobileNumber) {
  const countQuery = `
    SELECT COUNT(*) FROM user_passwords 
    WHERE mobile_number = $1
  `;
  
  const result = await client.query(countQuery, [mobileNumber]);
  return parseInt(result.rows[0].count);
}

/**
 * Delete the oldest password entry for a user
 * @param {object} client - Database client connection
 * @param {string} mobileNumber - The user's mobile number
 */
async function deleteOldestPasswordEntry(client, mobileNumber) {
  const deleteQuery = `
    DELETE FROM user_passwords 
    WHERE id = (
      SELECT id FROM user_passwords 
      WHERE mobile_number = $1 
      ORDER BY created_at ASC 
      LIMIT 1
    )
  `;
  
  await client.query(deleteQuery, [mobileNumber]);
}

/**
 * Store a password in the user_passwords history table
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} passwordHash - The password hash to store
 * @returns {Promise<Object>} - Result with success flag and message
 */
export async function storePasswordInHistory(mobileNumber, passwordHash) {
  const client = await pool.connect();
  
  try {
    console.log('Storing password in history for mobile:', mobileNumber);
    
    // Check how many entries exist
    const entriesCount = await getPasswordEntriesCount(client, mobileNumber);
    
    // If there are already 4 entries, delete the oldest one
    if (entriesCount >= 4) {
      console.log('Deleting oldest password entry for mobile:', mobileNumber);
      await deleteOldestPasswordEntry(client, mobileNumber);
    }
    
    // Insert the password into the history table
    const insertQuery = `
      INSERT INTO user_passwords (mobile_number, password_hash)
      VALUES ($1, $2)
    `;
    
    await client.query(insertQuery, [mobileNumber, passwordHash]);
    
    console.log('Password stored in history successfully');
    
    return {
      success: true,
      message: 'Password stored in history'
    };
  } catch (error) {
    console.error('Error storing password in history:', error);
    console.error('Error details:', error.message);
    
    return {
      success: false,
      message: 'Failed to store password in history'
    };
  } finally {
    client.release();
  }
}
