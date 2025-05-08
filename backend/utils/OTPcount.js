import redisClient from './redisClient.js';

/**
 * Increment OTP request count for a mobile number
 * @param {string} mobileNumber - The user's mobile number
 * @param {number} expiryInSeconds - Count expiry time in seconds (default: 8 hours)
 * @returns {Promise<number>} - Current count after increment
 */
export async function incrementOTPCount(mobileNumber, expiryInSeconds = 28800) {
  try {
    const key = `otpcount:${mobileNumber}`;
    let count = await redisClient.get(key);
    
    // If no count exists, initialize to 0
    if (!count) {
      count = 0;
      // Set initial expiry time (8 hours)
      await redisClient.set(key, count.toString(), expiryInSeconds);
    }
    
    // Increment the count
    count = await redisClient.incr(key);
    
    console.log(`OTP count for ${mobileNumber}: ${count}`);
    return parseInt(count) || 0;
  } catch (error) {
    console.error('Error incrementing OTP count:', error);
    return -1;
  }
}
