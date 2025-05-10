import redisClientInstance from './redisClient.js';

/**
 * Check if an IP address has reached its request limit
 * @param {string} ipAddress - The IP address to check
 * @param {number} maxRequests - Maximum allowed requests (default: 10)
 * @returns {Promise<boolean>} - True if within limit, false if limit reached
 */
export const isRequestLimitNotReached = async (ipAddress, maxRequests = 10) => {
  try {
    const key = `ip_requests:${ipAddress}`;
    const count = await redisClientInstance.get(key);
    return !count || parseInt(count) < maxRequests;
  } catch (error) {
    console.error('Error checking IP request limit:', error);
    return true; // Default to allowing requests if Redis fails
  }
};

/**
 * Get remaining request attempts for an IP address
 * @param {string} ipAddress - The IP address to check
 * @param {number} maxRequests - Maximum allowed requests (default: 10)
 * @returns {Promise<number>} - Number of remaining requests
 */
export const getRemainingRequestAttempts = async (ipAddress, maxRequests = 10) => {
  try {
    const key = `ip_requests:${ipAddress}`;
    const count = await redisClientInstance.get(key);
    return count ? maxRequests - parseInt(count) : maxRequests;
  } catch (error) {
    console.error('Error getting remaining IP request attempts:', error);
    return 0;
  }
};

/**
 * Check if an IP is not blocked due to abuse
 * @param {string} ipAddress - The IP address to check
 * @returns {Promise<boolean>} - True if not blocked, false if blocked
 */
export const isIPNotBlocked = async (ipAddress) => {
  try {
    const key = `ip_blocked:${ipAddress}`;
    return !(await redisClientInstance.exists(key));
  } catch (error) {
    console.error('Error checking if IP is blocked:', error);
    return true; // Default to not blocked if Redis fails
  }
};

/**
 * Get time until IP unblock in seconds
 * @param {string} ipAddress - The IP address to check
 * @returns {Promise<number>} - Time in seconds until unblock
 */
export const getTimeUntilIPUnblock = async (ipAddress) => {
  try {
    const key = `ip_blocked:${ipAddress}`;
    const ttl = await redisClientInstance.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    console.error('Error getting time until IP unblock:', error);
    return 0;
  }
};

/**
 * Increment request count for an IP address
 * @param {string} ipAddress - The IP address
 * @param {number} expireInSeconds - Time window for rate limiting (default: 1 hour)
 * @returns {Promise<number>} - New request count
 */
export const incrementIPRequestCount = async (ipAddress, expireInSeconds = 3600) => {
  try {
    const key = `ip_requests:${ipAddress}`;
    const count = await redisClientInstance.incr(key);
    
    // Set expiration on first request
    if (count === 1) {
      await redisClientInstance.expire(key, expireInSeconds);
    }
    
    return count;
  } catch (error) {
    console.error('Error incrementing IP request count:', error);
    throw error;
  }
};

/**
 * Block an IP address for a specified duration
 * @param {string} ipAddress - The IP address to block
 * @param {number} blockDuration - Block duration in seconds (default: 24 hours)
 * @returns {Promise<void>}
 */
export const blockIP = async (ipAddress, blockDuration = 24 * 3600) => {
  try {
    const key = `ip_blocked:${ipAddress}`;
    await redisClientInstance.set(key, 'true', blockDuration);
  } catch (error) {
    console.error('Error blocking IP:', error);
    throw error;
  }
};

/**
 * Comprehensive check for an IP address status
 * @param {string} ipAddress - The IP address to check
 * @param {number} maxRequests - Maximum allowed requests (default: 10)
 * @returns {Promise<Object>} - Object containing status information
 */
export const checkIPStatus = async (ipAddress, maxRequests = 10) => {
  try {
    // Check for request count limit
    const isWithinRequestLimit = await isRequestLimitNotReached(ipAddress, maxRequests);
    const remainingRequests = await getRemainingRequestAttempts(ipAddress, maxRequests);
    
    // Check if IP is blocked
    const isNotBlocked = await isIPNotBlocked(ipAddress);
    
    // Get block time remaining if blocked
    let blockTimeRemaining = 0;
    if (!isNotBlocked) {
      blockTimeRemaining = await getTimeUntilIPUnblock(ipAddress);
    }
    
    return {
      isAllowedToMakeRequests: isWithinRequestLimit && isNotBlocked,
      isWithinRequestLimit: isWithinRequestLimit,
      isBlocked: !isNotBlocked,
      remainingRequests: remainingRequests,
      blockTimeRemaining: blockTimeRemaining
    };
  } catch (error) {
    console.error('Error checking IP status:', error);
    throw error;
  }
};

/**
 * Get human-readable status message based on IP status
 * @param {Object} status - IP status object from checkIPStatus
 * @returns {string} - User-friendly status message
 */
export const getIPStatusMessage = (status) => {
  if (status.isBlocked) {
    const hours = Math.floor(status.blockTimeRemaining / 3600);
    const minutes = Math.floor((status.blockTimeRemaining % 3600) / 60);
    return `Your IP address is temporarily blocked due to suspicious activity. Try again in ${hours} hours and ${minutes} minutes.`;
  }
  
  if (!status.isWithinRequestLimit) {
    return `You've reached the maximum number of requests. Please try again later.`;
  }
  
  if (status.isAllowedToMakeRequests) {
    return `Request allowed. You have ${status.remainingRequests} requests remaining.`;
  }
  
  return 'Unable to determine request status.';
};

/**
 * Mark an IP as having recently made a sensitive request
 * @param {string} ipAddress - The IP address
 * @param {number} cooldownPeriod - Cooldown period in seconds (default: 5 minutes)
 * @returns {Promise<void>}
 */
export const markSensitiveRequest = async (ipAddress, cooldownPeriod = 5 * 60) => {
  const requestKey = `sensitive_request:${ipAddress}`;
  await redisClientInstance.set(requestKey, 'true', cooldownPeriod);
};
