import express from 'express';
import { generateOTP } from '../utils/OTPgenerator.js';
import { hashAndSaveOTP } from '../utils/OTPhashsave.js';
import { compareOTP } from '../middleware/OTPcompare.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { isOTPLimitNotReached, getRemainingOTPAttempts } from '../middleware/OTPcountcheck.js';
import { incrementOTPCount } from '../utils/OTPcount.js';

const router = express.Router();

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;

  try {
    if (!mobileNumber || !otp) {
      return res.status(400).json({ 
        isValid: false, 
        message: 'Mobile number and OTP are required' 
      });
    }

    // Verify the OTP using compareOTP function from OTPcompare.js
    const isValid = await compareOTP(mobileNumber, otp);

    if (isValid) {
      return res.status(200).json({
        isValid: true,
        message: 'OTP verified successfully'
      });
    } else {
      return res.status(400).json({
        isValid: false,
        message: 'Invalid OTP or OTP expired'
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      isValid: false,
      message: 'Internal server error during OTP verification'
    });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  const { mobileNumber } = req.body;

  try {
    if (!mobileNumber) {
      return res.status(400).json({
        isValid: false,
        message: 'Mobile number is required'
      });
    }

    // Check if the OTP limit has been reached
    const isWithinLimit = await isOTPLimitNotReached(mobileNumber);
    if (!isWithinLimit) {
      return res.status(429).json({
        isValid: false,
        message: 'Too many OTPs have been requested. Please try again later.',
        otpsRemaining: 0
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Store the OTP in Redis
    await hashAndSaveOTP(mobileNumber, otp);
    
    // Increment OTP count for this mobile number
    await incrementOTPCount(mobileNumber);
    
    // Get remaining OTP attempts
    const otpsRemaining = await getRemainingOTPAttempts(mobileNumber);
    
    // Calculate resend attempts based on business logic (typically 2-3 attempts)
    // This is separate from the daily OTP limit
    const resendAttemptsLeft = Math.min(2, otpsRemaining - 1); // Max 2 resends, adjust as needed
    
    // In production, send OTP via SMS
    // For development, return the OTP
    return res.status(200).json({
      isValid: true,
      message: 'OTP resent successfully',
      otp: otp, // Remove in production
      resendAttemptsLeft: resendAttemptsLeft,
      otpsRemaining: otpsRemaining
    });
    
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({
      isValid: false,
      message: 'Internal server error while resending OTP'
    });
  }
});

export default router;
