import bcrypt from 'bcrypt';
import redisClient from '../utils/redisClient.js';

/**
 * Compare the input OTP with the stored hashed OTP
 * @param {string} mobileNumber - User's mobile number
 * @param {string|number} inputOTP - OTP entered by the user
 * @returns {Promise<boolean>} - True if OTP is valid
 */
export async function compareOTP(mobileNumber, inputOTP) {
  try {
    // Convert input OTP to string if it's not already
    const otpString = String(inputOTP);
    
    // Get the hashed OTP from Redis
    const key = `otp:${mobileNumber}`;
    const hashedOTP = await redisClient.get(key);
    
    if (!hashedOTP) {
      console.log(`No OTP found or OTP expired for mobile number: ${mobileNumber}`);
      return false;
    }
    
    // Compare the provided OTP with the stored hash using bcrypt
    const isValid = await bcrypt.compare(otpString, hashedOTP);
    
    if (isValid) {
      console.log(`OTP verified successfully for mobile number: ${mobileNumber}`);
      
      // Delete the OTP after successful verification
      await redisClient.delete(key);
      
      // Mark this mobile number as verified in Redis
      await markMobileAsVerified(mobileNumber);
    } else {
      console.log(`Invalid OTP for mobile number: ${mobileNumber}`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`Error comparing OTP for ${mobileNumber}:`, error);
    return false;
  }
}

/**
 * Mark a mobile number as verified in Redis
 * @param {string} mobileNumber - User's mobile number
 * @param {number} expiryInSeconds - Verification status expiry time (default: 1 hour)
 * @returns {Promise<boolean>} - True if successful
 */
export async function markMobileAsVerified(mobileNumber, expiryInSeconds = 3600) {
  try {
    // Store verification status in Redis
    const key = `verified:${mobileNumber}`;
    const timestamp = Date.now();
    
    // Store as JSON to include verification timestamp
    const verificationData = {
      verified: true,
      timestamp: timestamp,
      expiresAt: timestamp + (expiryInSeconds * 1000)
    };
    
    // Use setJson to store the verification data
    await redisClient.setJson(key, verificationData, expiryInSeconds);
    
    console.log(`Mobile number ${mobileNumber} marked as verified`);
    return true;
  } catch (error) {
    console.error(`Error marking mobile ${mobileNumber} as verified:`, error);
    return false;
  }
}

/**
 * Check if a mobile number is verified
 * @param {string} mobileNumber - User's mobile number
 * @returns {Promise<boolean>} - True if mobile number is verified
 */
export async function isMobileVerified(mobileNumber) {
  try {
    const key = `verified:${mobileNumber}`;
    const verificationData = await redisClient.getJson(key);
    
    if (!verificationData || !verificationData.verified) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking verification status for ${mobileNumber}:`, error);
    return false;
  }
}
