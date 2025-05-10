import express from 'express';
import { checkOTPVerification } from '../utils/OTPVerifiedChecker.js';
import { validatePasswordFormat } from '../middleware/PasswordFormatValidator.js';
import { hashPassword } from '../utils/PasswordHash.js';
import { updateUserPassword } from '../utils/modifypassword.js';
import redisClientInstance from '../utils/redisClient.js';
import { verifyPasswordNotOverlapping } from '../utils/passwordoverlapprevention.js';

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

    // Step 2: Validate password format (Step number kept for consistency)
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
    
    // Step 2.5: Check if new password overlaps with current/past passwords
    console.log('[DEBUG] Checking password overlap with current/past passwords');
    const overlapResult = await verifyPasswordNotOverlapping(mobileNumber, password);
    if (!overlapResult.success) {
      console.log(`[DEBUG] Password overlap check failed: ${overlapResult.message}`);
      return res.status(400).json({
        success: false,
        message: overlapResult.message
      });
    }
    
    // Step 3: Hash the password
    console.log('[DEBUG] Hashing password');
    const hashedPassword = await hashPassword(password);
    console.log('[DEBUG] Password hashed successfully');
    
    // Step 4: Update user's password in database
    console.log(`[DEBUG] Updating password for mobile: ${mobileNumber.slice(0, 4) + '****'}`);
    const updateResult = await updateUserPassword(mobileNumber, hashedPassword);
    console.log(`[DEBUG] Database update result: ${updateResult.success ? 'Success' : 'Failed'}, Message: ${updateResult.message}`);
    
    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: updateResult.message
      });
    }
    
    // Step 5: Store reset record in Redis (for tracking recent resets)
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
