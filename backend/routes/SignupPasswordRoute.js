import express from 'express';
import { checkOTPVerification } from '../utils/OTPVerifiedChecker.js';
import { validatePasswordFormat, passwordsMatch } from '../middleware/PasswordFormatValidator.js';
import { hashPassword } from '../utils/PasswordHash.js';
import { addNewUser } from '../utils/addnewuser.js';

const router = express.Router();

/**
 * Set password endpoint for newly registered users
 * POST /api/user/set-password
 */
router.post('/set-password', async (req, res) => {
  try {
    const { mobileNumber, password, confirmPassword } = req.body;
    
    // Debug: Password received from frontend
    console.log(`[DEBUG] Password received for mobile: ${mobileNumber ? mobileNumber.slice(0, 4) + '****' : 'undefined'}`);
    
    // Validate request body
    if (!mobileNumber || !password || !confirmPassword) {
      console.log('[DEBUG] Missing required fields in request body');
      return res.status(400).json({
        success: false,
        message: 'Mobile number, password and confirmation are required'
      });
    }
    
    // Clean the mobile number (remove non-digit characters)
    const cleanMobileNumber = mobileNumber.replace(/\D/g, '');
    
    // Step 1: Check if OTP was verified for this mobile number
    console.log(`[DEBUG] Checking OTP verification for mobile: ${cleanMobileNumber.slice(0, 4) + '****'}`);
    const otpVerificationResult = await checkOTPVerification(cleanMobileNumber);
    console.log(`[DEBUG] OTP verification status: ${otpVerificationResult.success ? 'Verified' : 'Not Verified'}`);
    
    if (!otpVerificationResult.success) {
      return res.status(403).json({
        success: false,
        message: otpVerificationResult.message
      });
    }
    
    // Step 2: Check if passwords match
    const matchResult = passwordsMatch(password, confirmPassword);
    console.log(`[DEBUG] Passwords match check: ${matchResult.success ? 'Passed' : 'Failed'}`);
    
    if (!matchResult.success) {
      return res.status(400).json({
        success: false,
        message: matchResult.message
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
    
    // Step 5: Store user in database
    console.log(`[DEBUG] Adding user to database with mobile: ${cleanMobileNumber.slice(0, 4) + '****'}`);
    const saveResult = await addNewUser(cleanMobileNumber, hashedPassword);
    console.log(`[DEBUG] Database save result: ${saveResult.success ? 'Success' : 'Failed'}, Message: ${saveResult.message}`);
    
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: saveResult.message
      });
    }
    
    // Return success response
    console.log(`[DEBUG] User created successfully with ID: ${saveResult.user.id}`);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      userId: saveResult.user.id
    });
    
  } catch (error) {
    console.error('[DEBUG] Error in set-password route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing your request'
    });
  }
});

export default router;
