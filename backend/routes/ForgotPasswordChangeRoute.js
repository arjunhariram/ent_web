import express from 'express';
import { checkOTPVerification } from '../utils/OTPVerifiedChecker.js';
import { validatePasswordFormat, passwordsMatch } from '../middleware/PasswordFormatValidator.js';
import { hashPassword } from '../utils/PasswordHash.js';
import { updateUserPassword } from '../utils/otpmodifypassword.js';
import redisClientInstance from '../utils/redisClient.js';

const router = express.Router();

/**
 * Reset password endpoint for users who have forgotten their password
 * POST /api/user/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { mobileNumber, password, confirmPassword } = req.body;
    
    // Debug: Password received from frontend
    console.log(`[DEBUG] Password reset received for mobile: ${mobileNumber ? mobileNumber.slice(0, 4) + '****' : 'undefined'}`);
    
    // Validate request body
    if (!mobileNumber || !password || !confirmPassword) {
      console.log('[DEBUG] Missing required fields in request body');
      return res.status(400).json({
        success: false,
        message: 'Mobile number, password and confirmation are required'
      });
    }
    
    // No need to clean mobile number again as it's already cleaned in the frontend
    // Step 1: Check if OTP was verified for this mobile number
    console.log(`[DEBUG] Checking OTP verification for mobile: ${mobileNumber.slice(0, 4) + '****'}`);
    const otpVerificationResult = await checkOTPVerification(mobileNumber);
    console.log(`[DEBUG] OTP verification status: ${otpVerificationResult.success ? 'Verified' : 'Not Verified'}`);
    
    if (!otpVerificationResult.success) {
      return res.status(403).json({
        success: false,
        message: otpVerificationResult.message
      });
    }

    // Step 2: Check if passwords match
    if (!passwordsMatch(password, confirmPassword)) {
      console.log('[DEBUG] Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }
    
    // Step 3: Validate password format
    console.log('[DEBUG] Validating password format');
    const passwordValidationResult = validatePasswordFormat(password);
    console.log(`[DEBUG] Password validation: ${passwordValidationResult.success ? 'Valid' : 'Invalid'}`);
    if (!passwordValidationResult.success) {
      console.log('[DEBUG] Password validation details:', passwordValidationResult.details);
      return res.status(400).json({
        success: false,
        message: passwordValidationResult.message,
        details: passwordValidationResult.details
      });
    }
    
    // Step 4: Hash the password
    console.log('[DEBUG] Hashing password');
    const hashedPassword = await hashPassword(password);
    console.log('[DEBUG] Password hashed successfully');
    
    // Step 5: Update user's password in database
    console.log(`[DEBUG] Updating password for mobile: ${mobileNumber.slice(0, 4) + '****'}`);
    const updateResult = await updateUserPassword(mobileNumber, hashedPassword);
    console.log(`[DEBUG] Database update result: ${updateResult.success ? 'Success' : 'Failed'}, Message: ${updateResult.message}`);
    
    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: updateResult.message
      });
    }
    
    // Step 6: Store reset record in Redis (for tracking recent resets)
    const resetKey = `password_reset:${mobileNumber}`;
    await redisClientInstance.setJson(resetKey, { 
      resetTime: new Date().toISOString(),
      success: true
    }, 172800); // 48 hours (in seconds)
    
    // Return success response
    console.log(`[DEBUG] Password reset successful for user: ${updateResult.userId}`);
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      userId: updateResult.userId
    });
    
  } catch (error) {
    console.error('[DEBUG] Error in reset-password route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing your request'
    });
  }
});

export default router;
