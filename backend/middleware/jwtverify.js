import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isTokenBlacklisted } from '../utils/JWTinvalidator.js'; // Import blacklist checker
import redisClient from '../utils/redisClient.js'; // Ensure redisClient is available if not already

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

/**
 * Verify JWT token and extract mobile number
 * @param {string} token - JWT token to verify
 * @returns {Object} - { isValid: boolean, mobileNumber: string|null, error: string|null }
 */
export const verifyToken = async (token) => { // Make function async
  try {
    if (!token) {
      return {
        isValid: false,
        mobileNumber: null,
        error: 'No token provided'
      };
    }

    if (!JWT_SECRET) {
      return {
        isValid: false,
        mobileNumber: null,
        error: 'JWT_SECRET is not configured'
      };
    }

    // Remove 'Bearer ' prefix if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Check if token is blacklisted
    if (await isTokenBlacklisted(tokenString)) {
      return {
        isValid: false,
        mobileNumber: null,
        error: 'Token has been invalidated' // Or 'Signed out'
      };
    }

    const decoded = jwt.verify(tokenString, JWT_SECRET);
    
    if (!decoded.mobileNumber) {
      return {
        isValid: false,
        mobileNumber: null,
        error: 'Invalid token payload'
      };
    }

    return {
      isValid: true,
      mobileNumber: decoded.mobileNumber,
      error: null
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    
    return {
      isValid: false,
      mobileNumber: null,
      error: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    };
  }
};

/**
 * Middleware to verify JWT from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const jwtMiddleware = async (req, res, next) => { // Make function async
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const verification = await verifyToken(token); // Await the async verifyToken
  
  if (!verification.isValid) {
    return res.status(401).json({ message: verification.error });
  }
  
  // Add verified mobile number to request object
  req.mobileNumber = verification.mobileNumber;
  next();
};
