import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the absolute path to the .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  console.debug('Environment variables available:', Object.keys(process.env));
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Issues a JWT token for authenticated users
 * @param {Object} user - User data to encode in the token
 * @returns {string} - JWT token
 */
export const issueToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Cannot issue token.');
  }
  
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
