import express from 'express';
import { isValidIndianMobileNumber } from '../middleware/MobileFormatChecker.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { generateOTP } from '../utils/OTPgenerator.js';
import { hashAndSaveOTP } from '../utils/OTPhashsave.js';
import { incrementOTPCount } from '../utils/OTPcount.js';
import { checkMobileNumberOTPStatus, getOTPStatusMessage } from '../utils/mobilenumberOTPstatus.js';
import { getRemainingOTPAttempts } from '../middleware/OTPcountcheck.js';

const router = express.Router();

router.post('/create-account', async (req, res) => {
  const { mobileNumber } = req.body;
  console.log('Received request to create account with mobile number:', mobileNumber); // Log input

  try {
    // Validate mobile number format
    if (!isValidIndianMobileNumber(mobileNumber)) {
      console.log('Invalid mobile number format:', mobileNumber); // Log validation failure
      return res.status(400).json({ message: 'Please enter a valid Indian Mobile Number' });
    }

    // Check if mobile number exists in the database
    const exists = await doesMobileNumberExist(mobileNumber);
    console.log('Mobile number exists:', exists); // Log existence check result

    if (exists) {
      return res.status(200).json({ message: 'This mobile number is already registered. Please login instead.' }); // Adjusted response
    }

    // Check comprehensive OTP status
    const otpStatus = await checkMobileNumberOTPStatus(mobileNumber);
    
    if (!otpStatus.isEligibleForOTP) {
      console.log('OTP not eligible:', mobileNumber);
      return res.status(429).json({ 
        message: getOTPStatusMessage(otpStatus)
      });
    }

    // Generate a 5-digit OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp); // Log generated OTP (for development only, remove in production)
    
    // Hash and save the OTP to Redis
    await hashAndSaveOTP(mobileNumber, otp);
    
    // Increment OTP count for this mobile number
    await incrementOTPCount(mobileNumber);
    
    // Get remaining OTP attempts
    const otpsRemaining = await getRemainingOTPAttempts(mobileNumber);
    
    // In production, you would send this OTP via SMS
    // For development, we're returning it in the response
    console.log('Mobile number is valid and not registered. Proceeding with OTP validation.');
    res.status(200).json({ 
      message: 'Mobile number is valid and not registered. Proceed with OTP validation.',
      otp: otp, // Remove this in production - only for testing
      otpsRemaining: otpsRemaining
    });
  } catch (error) {
    console.error('Error in create account route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
