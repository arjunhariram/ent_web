import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Issues a JWT token for authenticated users
 * @param {Object} user - User data to encode in the token
 * @returns {string} - JWT token
 */
export const issueToken = (user) => {
  const payload = {
    userId: user.id,
    mobileNumber: user.mobileNumber,
  };
  
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
  
  return token;
};

/**
 * Verifies a JWT token and returns the decoded data
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token data or null if invalid
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};
