import pool from '../db.js';

export const doesMobileNumberExist = async (mobileNumber) => {
  try {
    console.log('Checking if mobile number exists:', mobileNumber); // Log input
    const query = 'SELECT 1 FROM users WHERE mobile_number = $1 LIMIT 1';
    const result = await pool.query(query, [mobileNumber]);
    console.log('Query result:', result.rows); // Log query result

    return result.rowCount > 0; // Return true if the number exists, false otherwise
  } catch (error) {
    console.error('Error checking mobile number in database:', error);
    throw new Error('Database error');
  }
};
