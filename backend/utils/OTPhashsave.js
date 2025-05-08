import bcrypt from 'bcrypt';
import redisClient from './redisClient.js';

/**
 * Hash the OTP and save it to Redis with the mobile number
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} otp - The OTP to hash and save
 * @param {number} expiryInSeconds - OTP expiry time in seconds (default: 5 minutes)
 * @returns {Promise<boolean>} - True if successful
 */
export async function hashAndSaveOTP(mobileNumber, otp, expiryInSeconds = 300) {
  try {
    // Convert OTP to string if it's not already
    const otpString = String(otp);
    
    // Hash the OTP using bcrypt
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otpString, saltRounds);
    
    // Save the hashed OTP to Redis with the mobile number as key
    // Explicitly set expiry to 5 minutes (300 seconds)
    const key = `otp:${mobileNumber}`;
    const result = await redisClient.set(key, hashedOTP, 'EX', 300);
    
    console.log(`OTP saved for mobile number: ${mobileNumber} with 5 minutes expiry`);
    return result;
  } catch (error) {
    console.error('Error saving OTP:', error);
    return false;
  }
}

/**
 * Verify an OTP against the stored hash
 * @param {string} mobileNumber - The user's mobile number
 * @param {string} otp - The OTP to verify
 * @returns {Promise<boolean>} - True if OTP is valid
 */
export async function verifyOTP(mobileNumber, otp) {
  try {
    // Get the hashed OTP from Redis
    const key = `otp:${mobileNumber}`;
    const hashedOTP = await redisClient.get(key);
    
    if (!hashedOTP) {
      console.log('No OTP found or OTP expired');
      return false;
    }
    
    // Compare the provided OTP with the stored hash
    const isValid = await bcrypt.compare(String(otp), hashedOTP);
    
    if (isValid) {
      // Delete the OTP after successful verification
      await redisClient.delete(key);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}
