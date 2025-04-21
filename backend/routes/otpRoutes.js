import express from 'express';
import bcrypt from 'bcrypt';
import { generateAndStoreOTP } from '../controllers/otpController.js';
import validateMobileNumber from '../middleware/InputValueChecker.js';
import redisClient from '../utils/redisClient.js';

const router = express.Router();

router.post('/generate', validateMobileNumber, generateAndStoreOTP);

router.post('/resend', async (req, res) => {
  const { mobileNumber } = req.body;
  
  if (!mobileNumber) {
    return res.status(400).json({
      isValid: false,
      message: 'Mobile number is required'
    });
  }
  
  const cleanNumber = mobileNumber.replace(/\D/g, '');
  
  const lastSentTime = await redisClient.get(`lastSent:${cleanNumber}`);
  const currentTime = Math.floor(Date.now() / 1000);
  
  if (lastSentTime && (currentTime - parseInt(lastSentTime)) < 60) {
    const timeRemaining = 60 - (currentTime - parseInt(lastSentTime));
    return res.json({
      isValid: false,
      message: `Please wait ${timeRemaining} second(s) before requesting a new OTP`,
      timeRemaining
    });
  }
  
  req.body.isResend = true;
  return validateMobileNumber(req, res);
});

router.post('/verify', async (req, res) => {
  const { mobileNumber, otp } = req.body;
  
  if (!mobileNumber || !otp) {
    return res.status(400).json({ 
      isValid: false, 
      message: 'Mobile number and OTP are required' 
    });
  }

  const cleanNumber = mobileNumber.replace(/\D/g, '');
  
  const storedHashedOTP = await redisClient.get(`otp:${cleanNumber}`);
  
  if (!storedHashedOTP) {
    return res.json({ 
      isValid: false, 
      message: 'OTP expired or not found. OTPs are valid for 5 minutes.' 
    });
  }
  
  const userOTPString = otp.toString();
  console.log('User input OTP converted to string:', userOTPString);
  
  const isMatch = await bcrypt.compare(userOTPString, storedHashedOTP);
  console.log('OTP comparison result:', isMatch);
  
  if (isMatch) {
    await redisClient.delete(`otp:${cleanNumber}`);
    const verificationSet = await redisClient.set(`verified:${cleanNumber}`, 'true', 600);
    
    return res.json({ 
      isValid: true, 
      message: 'OTP verified successfully' 
    });
  } else {
    return res.json({ 
      isValid: false, 
      message: 'Invalid OTP' 
    });
  }
});

export default router;
