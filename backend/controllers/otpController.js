import generateOTP from '../utils/otpGenerator.js';
import redisClient from '../utils/redisClient.js';

export const generateAndStoreOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const otp = generateOTP(5);
    const key = `otp:${mobileNumber}`;
    const stored = await redisClient.set(key, otp, 300);
    console.log(`Generated OTP for ${mobileNumber}: ${otp}`);
    if (stored) {
      res.status(200).json({
        success: true,
        message: 'OTP generated successfully'
      });
    } else {
      throw new Error('Failed to store OTP');
    }
  } catch (error) {
    console.error('Error generating OTP:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OTP'
    });
  }
};
