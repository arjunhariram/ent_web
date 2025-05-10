import pool from '../db.js';

/**
 * Check if a mobile number exists in the users table
 * @param {string} mobileNumber - The mobile number to check
 * @returns {Promise<boolean>} - True if mobile number exists, false otherwise
 */
export async function doesMobileNumberExist(mobileNumber) {
  console.log('doesMobileNumberExist called with:', mobileNumber);
  console.log('Mobile number type:', typeof mobileNumber);
  
  if (!mobileNumber) {
    console.error('Mobile number is null or undefined!');
    return false;
  }
  
  // Handle if mobileNumber is an object
  if (typeof mobileNumber === 'object' && mobileNumber !== null) {
    console.log('Mobile number is an object:', mobileNumber);
    if (mobileNumber.mobileNumber) {
      console.log('Extracting mobileNumber property from object');
      mobileNumber = mobileNumber.mobileNumber;
    }
  }

  const client = await pool.connect();
  try {
    const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE mobile_number = $1)';
    console.log('Running SQL query:', query, 'with mobile:', mobileNumber);
    
    const result = await client.query(query, [mobileNumber]);
    
    console.log('Query result:', result.rows[0]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Error checking if mobile number exists:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  } finally {
    client.release();
  }
}
