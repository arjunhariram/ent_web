import redisClient from '../utils/redisClient.js';
import bcrypt from 'bcrypt';

const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const validateMobileNumber = async (req, res, next) => {
  const { mobileNumber, isResend } = req.body;
  
  const cleanNumber = mobileNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 10) {
    const totalOTPCount = await redisClient.get(`totalOTP:${cleanNumber}`) || 0;
    const totalCount = parseInt(totalOTPCount);
    
    if (totalCount >= 3) {
      const cooldownEnd = await redisClient.get(`cooldown:${cleanNumber}`);
      
      if (cooldownEnd) {
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = parseInt(cooldownEnd) - currentTime;
        
        if (remainingTime > 0) {
          const hours = Math.floor(remainingTime / 3600);
          const minutes = Math.floor((remainingTime % 3600) / 60);
          
          return res.json({
            isValid: false,
            message: `OTP limit reached. Please try again in ${hours} hours and ${minutes} minutes.`
          });
        } else {
          await redisClient.delete(`totalOTP:${cleanNumber}`);
          await redisClient.delete(`cooldown:${cleanNumber}`);
          await redisClient.delete(`resend:${cleanNumber}`);
        }
      }
    }
    
    if (isResend) {
      const resendCount = await redisClient.get(`resend:${cleanNumber}`) || 0;
      
      if (parseInt(resendCount) >= 2) {
        return res.json({
          isValid: false,
          message: 'Maximum OTP resend attempts reached. Please try again later.'
        });
      }
      
      await redisClient.set(`resend:${cleanNumber}`, parseInt(resendCount) + 1, 3600);
    } else {
      await redisClient.set(`resend:${cleanNumber}`, 0, 3600);
    }
    
    const newTotalCount = totalCount + 1;
    await redisClient.set(`totalOTP:${cleanNumber}`, newTotalCount, 14400);
    
    if (newTotalCount >= 3) {
      const cooldownEnd = Math.floor(Date.now() / 1000) + 14400;
      await redisClient.set(`cooldown:${cleanNumber}`, cooldownEnd, 14400);
    }
    
    const otp = generateOTP();
    console.log(`Generated OTP (number) for ${cleanNumber}:`, otp);
    
    const otpString = otp.toString();
    console.log(`OTP converted to string:`, otpString);
    
    const hashedOTP = await bcrypt.hash(otpString, 10);
    console.log(`Hashed OTP:`, hashedOTP);
    
    await redisClient.set(`otp:${cleanNumber}`, hashedOTP, 300);
    await redisClient.set(`lastSent:${cleanNumber}`, Math.floor(Date.now() / 1000).toString(), 300);
    
    const otpsRemaining = 3 - newTotalCount;
    
    res.json({ 
      isValid: true, 
      otp: otp,
      message: 'OTP sent successfully',
      resendAttemptsLeft: 2 - (isResend ? parseInt(await redisClient.get(`resend:${cleanNumber}`)) : 0),
      otpsRemaining: otpsRemaining
    });
  } else {
    res.json({ 
      isValid: false, 
      message: 'Mobile number must be exactly 10 digits' 
    });
  }
};

export default validateMobileNumber;
