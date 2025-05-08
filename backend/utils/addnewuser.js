import pool from '../db.js';

/**
 * Add a new user to the database
 * @param {string} mobileNumber - User's mobile number
 * @param {string} passwordHash - Bcrypt hashed password
 * @returns {Promise<Object>} - Result with success flag and user data or error message
 */
export async function addNewUser(mobileNumber, passwordHash) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert new user
    const insertQuery = `
      INSERT INTO users (mobile_number, password_hash)
      VALUES ($1, $2)
      RETURNING id, mobile_number, created_at
    `;
    
    const result = await client.query(insertQuery, [mobileNumber, passwordHash]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      user: result.rows[0],
      message: 'User account created successfully'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error during user addition:', error);
    
    return {
      success: false,
      message: 'Database error during account creation',
      error: error.message
    };
  } finally {
    client.release();
  }
}
