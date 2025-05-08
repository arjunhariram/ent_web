import redis from 'redis';

// Reuse the Redis client configuration
const redisClient = redis.createClient({
  // Add your Redis configuration here if needed
  // url: 'redis://localhost:6379'
});

// Connect to Redis if not already connected
(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect().catch(err => {
      console.error('Redis connection error:', err);
    });
  }
})();

redisClient.on('error', err => console.error('Redis Client Error:', err));

/**
 * Check if OTP request count is within limits
 * @param {string} mobileNumber - The user's mobile number
 * @param {number} maxAllowed - Maximum allowed OTP requests (default: 3)
 * @returns {Promise<boolean>} - True if under limit, false if limit reached
 */
export async function isOTPLimitNotReached(mobileNumber, maxAllowed = 3) {
  try {
    const key = `otpcount:${mobileNumber}`;
    const count = await redisClient.get(key);
    
    // If no count exists or count is less than max allowed
    if (!count || parseInt(count) < maxAllowed) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking OTP count:', error);
    // Default to allowing OTP in case of error
    return true;
  }
}

/**
 * Get remaining OTP attempts
 * @param {string} mobileNumber - The user's mobile number
 * @param {number} maxAllowed - Maximum allowed OTP requests (default: 3)
 * @returns {Promise<number>} - Number of remaining attempts
 */
export async function getRemainingOTPAttempts(mobileNumber, maxAllowed = 3) {
  try {
    const key = `otpcount:${mobileNumber}`;
    const count = await redisClient.get(key);
    
    if (!count) {
      return maxAllowed;
    }
    
    const remaining = Math.max(0, maxAllowed - parseInt(count));
    return remaining;
  } catch (error) {
    console.error('Error getting remaining OTP attempts:', error);
    return 0;
  }
}
