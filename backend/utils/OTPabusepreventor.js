import redisClient from './redisClient.js';

// Constants
const MAX_INCORRECT_ATTEMPTS = 4;  // Maximum allowed incorrect OTP attempts for mobile
const MAX_INCORRECT_IP_ATTEMPTS = 100;  // Maximum allowed incorrect OTP attempts for IP address
const LOCKOUT_DURATION = 24 * 60 * 60;  // 24 hours in seconds

/**
 * Increment the incorrect OTP attempt count for a mobile number
 * @param {string} mobileNumber - The mobile number
 * @returns {Promise<number>} - The new count of incorrect attempts
 */
export const incrementIncorrectOTPCount = async (mobileNumber) => {
  const key = `incorrect_otp:mobile:${mobileNumber}`;
  const count = await redisClient.incr(key);
  
  // Set expiry of 24 hours if it's a new key
  if (count === 1) {
    await redisClient.set(key, count, LOCKOUT_DURATION);
  }
  
  return count;
};

/**
 * Increment the incorrect OTP attempt count for an IP address
 * @param {string} ipAddress - The IP address
 * @returns {Promise<number>} - The new count of incorrect attempts
 */
export const incrementIncorrectOTPCountForIP = async (ipAddress) => {
  const key = `incorrect_otp:ip:${ipAddress}`;
  const count = await redisClient.incr(key);
  
  // Set expiry of 24 hours if it's a new key
  if (count === 1) {
    await redisClient.set(key, count, LOCKOUT_DURATION);
  }
  
  return count;
};

/**
 * Check if the mobile number has reached the maximum number of incorrect OTP attempts
 * @param {string} mobileNumber - The mobile number
 * @returns {Promise<boolean>} - True if user can still make attempts, false if blocked
 */
export const isNotBlockedByIncorrectOTP = async (mobileNumber) => {
  const key = `incorrect_otp:mobile:${mobileNumber}`;
  const count = await redisClient.get(key);
  
  return !count || parseInt(count) < MAX_INCORRECT_ATTEMPTS;
};

/**
 * Check if the IP address has reached the maximum number of incorrect OTP attempts
 * @param {string} ipAddress - The IP address
 * @returns {Promise<boolean>} - True if IP can still make attempts, false if blocked
 */
export const isIPNotBlockedByIncorrectOTP = async (ipAddress) => {
  const key = `incorrect_otp:ip:${ipAddress}`;
  const count = await redisClient.get(key);
  
  return !count || parseInt(count) < MAX_INCORRECT_IP_ATTEMPTS;
};

/**
 * Get the remaining allowed incorrect OTP attempts for a mobile number
 * @param {string} mobileNumber - The mobile number
 * @returns {Promise<number>} - Number of remaining attempts
 */
export const getRemainingIncorrectOTPAttempts = async (mobileNumber) => {
  const key = `incorrect_otp:mobile:${mobileNumber}`;
  const count = await redisClient.get(key);
  
  if (!count) {
    return MAX_INCORRECT_ATTEMPTS;
  }
  
  const attemptsLeft = Math.max(0, MAX_INCORRECT_ATTEMPTS - parseInt(count));
  return attemptsLeft;
};

/**
 * Get the remaining allowed incorrect OTP attempts for an IP address
 * @param {string} ipAddress - The IP address
 * @returns {Promise<number>} - Number of remaining attempts
 */
export const getRemainingIncorrectOTPAttemptsForIP = async (ipAddress) => {
  const key = `incorrect_otp:ip:${ipAddress}`;
  const count = await redisClient.get(key);
  
  if (!count) {
    return MAX_INCORRECT_IP_ATTEMPTS;
  }
  
  const attemptsLeft = Math.max(0, MAX_INCORRECT_IP_ATTEMPTS - parseInt(count));
  return attemptsLeft;
};

/**
 * Reset the incorrect OTP counter for a mobile number
 * @param {string} mobileNumber - The mobile number to reset
 * @returns {Promise<boolean>} - Success status
 */
export const resetIncorrectOTPCount = async (mobileNumber) => {
  const key = `incorrect_otp:mobile:${mobileNumber}`;
  return await redisClient.delete(key);
};

/**
 * Reset the incorrect OTP counter for an IP address
 * @param {string} ipAddress - The IP address to reset
 * @returns {Promise<boolean>} - Success status
 */
export const resetIncorrectOTPCountForIP = async (ipAddress) => {
  const key = `incorrect_otp:ip:${ipAddress}`;
  return await redisClient.delete(key);
};

/**
 * Get time until the block is lifted for a mobile number (in seconds)
 * @param {string} mobileNumber - The mobile number
 * @returns {Promise<number>} - Time in seconds until block expires
 */
export const getTimeUntilUnblock = async (mobileNumber) => {
  const key = `incorrect_otp:mobile:${mobileNumber}`;
  return await redisClient.ttl(key);
};

/**
 * Get time until the block is lifted for an IP address (in seconds)
 * @param {string} ipAddress - The IP address
 * @returns {Promise<number>} - Time in seconds until block expires
 */
export const getTimeUntilUnblockForIP = async (ipAddress) => {
  const key = `incorrect_otp:ip:${ipAddress}`;
  return await redisClient.ttl(key);
};
