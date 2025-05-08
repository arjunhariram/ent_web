import redisClientInstance from './redisClient.js';

/**
 * Check if the OTP is verified for a given mobile number
 * @param {string} mobileNumber - User's mobile number
 * @returns {Promise<Object>} - Result object with success flag and message
 */
export async function checkOTPVerification(mobileNumber) {
  try {
    // Check if the mobile number is verified using Redis
    // Using the same key format as in OTPcompare.js
    const verificationKey = `verified:${mobileNumber}`;
    const verificationData = await redisClientInstance.getJson(verificationKey);
    
    if (!verificationData || !verificationData.verified) {
      return {
        success: false,
        message: 'OTP verification required before setting password'
      };
    }
    
    // Return success if verified
    return {
      success: true,
      message: 'Mobile number is verified'
    };
  } catch (error) {
    console.error(`Error checking OTP verification status for ${mobileNumber}:`, error);
    return {
      success: false,
      message: 'Internal server error while checking verification status'
    };
  }
}
