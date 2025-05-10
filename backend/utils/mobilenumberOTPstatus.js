import { isOTPLimitNotReached, getRemainingOTPAttempts } from '../middleware/OTPcountcheck.js';
import { 
  isNotBlockedByIncorrectOTP, 
  getRemainingIncorrectOTPAttempts,
  getTimeUntilUnblock
} from './OTPabusepreventor.js';
import redisClientInstance from './redisClient.js';

/**
 * Comprehensive check for a mobile number's OTP status
 * @param {string} mobileNumber - The mobile number to check
 * @param {number} maxOTPRequests - Maximum allowed OTP requests (default: 3)
 * @returns {Promise<Object>} - Object containing status information
 */
export const checkMobileNumberOTPStatus = async (mobileNumber, maxOTPRequests = 3) => {
  try {
    // Check for password reset cooldown
    const resetKey = `password_reset:${mobileNumber}`;
    const recentReset = await redisClientInstance.get(resetKey);
    
    // Check OTP request count limit
    const isWithinOTPLimit = await isOTPLimitNotReached(mobileNumber, maxOTPRequests);
    const remainingOTPAttempts = await getRemainingOTPAttempts(mobileNumber, maxOTPRequests);
    
    // Check incorrect OTP blocks
    const isNotBlocked = await isNotBlockedByIncorrectOTP(mobileNumber);
    const remainingIncorrectAttempts = await getRemainingIncorrectOTPAttempts(mobileNumber);
    
    // Get block time remaining if blocked
    let blockTimeRemaining = 0;
    if (!isNotBlocked) {
      blockTimeRemaining = await getTimeUntilUnblock(mobileNumber);
    }
    
    return {
      isEligibleForOTP: isWithinOTPLimit && isNotBlocked && !recentReset,
      hasRecentPasswordReset: !!recentReset,
      isWithinOTPRequestLimit: isWithinOTPLimit,
      isBlockedByIncorrectAttempts: !isNotBlocked,
      remainingOTPRequests: remainingOTPAttempts,
      remainingIncorrectAttempts: remainingIncorrectAttempts,
      blockTimeRemaining: blockTimeRemaining
    };
  } catch (error) {
    console.error('Error checking mobile number OTP status:', error);
    throw error;
  }
};

/**
 * Get human-readable status message based on OTP status
 * @param {Object} status - OTP status object from checkMobileNumberOTPStatus
 * @returns {string} - User-friendly status message
 */
export const getOTPStatusMessage = (status) => {
  if (status.hasRecentPasswordReset) {
    return 'Your account has a recent password reset. Please try again later.';
  }
  
  if (!status.isWithinOTPRequestLimit) {
    return `You've reached the maximum number of OTP requests. Please try again later.`;
  }
  
  if (status.isBlockedByIncorrectAttempts) {
    const hours = Math.floor(status.blockTimeRemaining / 3600);
    const minutes = Math.floor((status.blockTimeRemaining % 3600) / 60);
    return `Your account is temporarily blocked due to too many incorrect attempts. Try again in ${hours} hours and ${minutes} minutes.`;
  }
  
  if (status.isEligibleForOTP) {
    return `You can request an OTP. You have ${status.remainingOTPRequests} OTP requests remaining.`;
  }
  
  return 'Unable to determine OTP status.';
};

/**
 * Mark a mobile number as having recently completed a password reset
 * @param {string} mobileNumber - The mobile number
 * @param {number} cooldownPeriod - Cooldown period in seconds (default: 15 minutes)
 * @returns {Promise<void>}
 */
export const markPasswordReset = async (mobileNumber, cooldownPeriod = 15 * 60) => {
  const resetKey = `password_reset:${mobileNumber}`;
  await redisClientInstance.set(resetKey, 'true', cooldownPeriod);
};
