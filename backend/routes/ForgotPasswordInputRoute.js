import express from 'express';
import { isValidIndianMobileNumber } from '../middleware/MobileFormatChecker.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { generateOTP } from '../utils/OTPgenerator.js';
import { hashAndSaveOTP } from '../utils/OTPhashsave.js';
import { isOTPLimitNotReached, getRemainingOTPAttempts } from '../middleware/OTPcountcheck.js';
import { incrementOTPCount } from '../utils/OTPcount.js';

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  const { mobileNumber } = req.body;
  console.log('Received forgot password request for mobile number:', mobileNumber); // Log input

  try {
    // Validate mobile number format
    if (!isValidIndianMobileNumber(mobileNumber)) {
      console.log('Invalid mobile number format:', mobileNumber); // Log validation failure
      return res.status(400).json({ message: 'Please enter a valid Indian Mobile Number' });
    }

    // Check if mobile number exists in the database
    const exists = await doesMobileNumberExist(mobileNumber);
    console.log('Mobile number exists:', exists); // Log existence check result

    if (!exists) {
      return res.status(404).json({ message: 'No account linked with this mobile number' });
    }

    // Check if OTP limit is reached
    const isWithinLimit = await isOTPLimitNotReached(mobileNumber);
    if (!isWithinLimit) {
      console.log('OTP request limit exceeded for:', mobileNumber);
      return res.status(429).json({ message: 'Too many OTPs have been requested. Please try again later.' });
    }

    // Generate a 5-digit OTP
    const otp = generateOTP();
    console.log('Generated OTP for password reset:', otp); // Log generated OTP (for development only, remove in production)
    
    // Hash and save the OTP to Redis
    await hashAndSaveOTP(mobileNumber, otp);
    
    // Increment OTP count for this mobile number
    await incrementOTPCount(mobileNumber);
    
    // Get remaining OTP attempts
    const otpsRemaining = await getRemainingOTPAttempts(mobileNumber);
    
    // In production, you would send this OTP via SMS
    // For development, we're returning it in the response
    console.log('Mobile number is valid and exists. Proceeding with OTP validation for password reset.');
    res.status(200).json({ 
      message: 'OTP sent to your mobile number',
      otp: otp, // Remove this in production - only for testing
      otpsRemaining: otpsRemaining
    });
  } catch (error) {
    console.error('Error in forgot password route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
