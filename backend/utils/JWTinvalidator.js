import jwt from 'jsonwebtoken';
import redisClient from './redisClient.js';

const BLACKLIST_KEY_PREFIX = 'blacklist_token:';

/**
 * Invalidates a JWT token by adding it to a Redis blacklist.
 * The token will be stored in Redis until its original expiration time.
 * @param {string} tokenString - The JWT token string to invalidate.
 * @returns {Promise<boolean>} - True if token was blacklisted, false otherwise.
 */
export const invalidateToken = async (tokenString) => {
  if (!tokenString) {
    return false;
  }

  try {
    const decoded = jwt.decode(tokenString);
    if (!decoded || !decoded.exp) {
      console.warn('Cannot invalidate token: unable to decode or no expiration time found.');
      return false;
    }

    const expirationTime = decoded.exp; // Expiration time in seconds since epoch
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds since epoch

    const ttl = expirationTime - currentTime; // Time to live in seconds

    if (ttl <= 0) {
      console.log('Token already expired, no need to blacklist.');
      return true; // Consider it successfully "invalidated" as it's expired
    }

    await redisClient.set(`${BLACKLIST_KEY_PREFIX}${tokenString}`, 'invalidated', {
      EX: ttl,
    });
    console.log(`Token blacklisted with TTL: ${ttl}s`);
    return true;
  } catch (error) {
    console.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * Checks if a token is blacklisted.
 * @param {string} tokenString - The JWT token string to check.
 * @returns {Promise<boolean>} - True if token is blacklisted, false otherwise.
 */
export const isTokenBlacklisted = async (tokenString) => {
  if (!tokenString) {
    return false;
  }
  try {
    const result = await redisClient.get(`${BLACKLIST_KEY_PREFIX}${tokenString}`);
    return result === 'invalidated';
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false; // Fail safe: if Redis error, assume not blacklisted to avoid locking out users
  }
};
