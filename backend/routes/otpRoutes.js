import express from 'express';
import { generateOTP } from '../utils/OTPgenerator.js';
import { hashAndSaveOTP } from '../utils/OTPhashsave.js';
import { compareOTP } from '../middleware/OTPcompare.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { incrementOTPCount } from '../utils/OTPcount.js';
import { resetIncorrectOTPCount } from '../utils/OTPabusepreventor.js';
import { checkMobileNumberOTPStatus, getOTPStatusMessage } from '../utils/mobilenumberOTPstatus.js';
import { checkIPStatus, getIPStatusMessage, incrementIPRequestCount } from '../utils/IPLimiter.js';
import { getRemainingOTPAttempts } from '../middleware/OTPcountcheck.js';

const router = express.Router();

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    if (!mobileNumber || !otp) {
      return res.status(400).json({ 
        isValid: false, 
        message: 'Mobile number and OTP are required' 
      });
    }

    // Check IP status
    const ipStatus = await checkIPStatus(ipAddress);
    if (!ipStatus.isAllowedToMakeRequests) {
      return res.status(429).json({
        isValid: false,
        message: getIPStatusMessage(ipStatus),
        attemptsRemaining: ipStatus.remainingRequests
      });
    }

    // Increment IP request count
    await incrementIPRequestCount(ipAddress);

    // Check mobile number OTP status
    const otpStatus = await checkMobileNumberOTPStatus(mobileNumber);
    if (!otpStatus.isEligibleForOTP && otpStatus.isBlockedByIncorrectAttempts) {
      return res.status(429).json({
        isValid: false,
        message: getOTPStatusMessage(otpStatus),
        blockedFor: Math.ceil(otpStatus.blockTimeRemaining / 60), // minutes
        attemptsRemaining: 0
      });
    }

    // Verify the OTP using compareOTP function from OTPcompare.js
    const isValid = await compareOTP(mobileNumber, otp);

    if (isValid) {
      // Reset incorrect attempt counter on successful verification
      await resetIncorrectOTPCount(mobileNumber);
      
      return res.status(200).json({
        isValid: true,
        message: 'OTP verified successfully'
      });
    } else {
      // Re-check status after failed attempt
      const updatedOtpStatus = await checkMobileNumberOTPStatus(mobileNumber);
      
      return res.status(400).json({
        isValid: false,
        message: updatedOtpStatus.remainingIncorrectAttempts > 0 
          ? `Invalid OTP or OTP expired. ${updatedOtpStatus.remainingIncorrectAttempts} attempts remaining.` 
          : 'Invalid OTP. Your account has been temporarily blocked due to too many failed attempts.',
        attemptsRemaining: updatedOtpStatus.remainingIncorrectAttempts
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
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    if (!mobileNumber) {
      return res.status(400).json({
        isValid: false,
        message: 'Mobile number is required'
      });
    }

    // Check IP status
    const ipStatus = await checkIPStatus(ipAddress);
    if (!ipStatus.isAllowedToMakeRequests) {
      return res.status(429).json({
        isValid: false,
        message: getIPStatusMessage(ipStatus),
        otpsRemaining: 0
      });
    }

    // Increment IP request count
    await incrementIPRequestCount(ipAddress);

    // Check mobile OTP status
    const otpStatus = await checkMobileNumberOTPStatus(mobileNumber);
    if (!otpStatus.isEligibleForOTP) {
      return res.status(429).json({
        isValid: false,
        message: getOTPStatusMessage(otpStatus),
        otpsRemaining: otpStatus.remainingOTPRequests
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
