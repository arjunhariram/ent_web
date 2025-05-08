import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  try {
    // Generate salt with 10 rounds (can be configured based on security needs)
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    
    // Hash password with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Compare a plain text password with a hash to verify
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches hash
 */
export async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing password:', error);
    throw new Error('Password comparison failed');
  }
}
