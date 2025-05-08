import express from 'express';
import { isValidIndianMobileNumber } from '../middleware/MobileFormatChecker.js';
import { doesMobileNumberExist } from '../controllers/MobileDBCheck.js';
import { authenticateUser } from '../utils/Auth.js';
import { issueToken } from '../utils/JWTissue.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { mobileNumber, password } = req.body;
  console.log('Login attempt with mobile number:', mobileNumber); // Log login attempt
  
  try {
    // Check if required fields are provided
    if (!mobileNumber || !password) {
      return res.status(400).json({ 
        message: `Please provide ${!mobileNumber ? 'mobile number' : ''}${!mobileNumber && !password ? ' and ' : ''}${!password ? 'password' : ''}` 
      });
    }
    
    // Step 1: Validate mobile number format
    if (!isValidIndianMobileNumber(mobileNumber)) {
      console.log('Invalid mobile number format:', mobileNumber);
      return res.status(400).json({ message: 'Please enter a valid Indian Mobile Number' });
    }
    
    // Step 2: Check if mobile number exists in database
    const exists = await doesMobileNumberExist(mobileNumber);
    if (!exists) {
      console.log('No account found for mobile number:', mobileNumber);
      return res.status(404).json({ message: 'No account linked with this mobile number' });
    }
    
    // Step 3: Authenticate user (verify password)
    const user = await authenticateUser(mobileNumber, password);
    if (!user) {
      console.log('Incorrect password for mobile number:', mobileNumber);
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    // Step 4: Generate JWT token
    const token = issueToken(user);
    
    // Return success response with token and user info
    console.log('User successfully authenticated:', mobileNumber);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber
      }
    });
    
  } catch (error) {
    console.error('Error in login route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
