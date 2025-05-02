import express from 'express';
import { setPassword } from '../controllers/userController.js';
import validatePassword from '../middleware/PasswordValidator.js';
import pool from '../db.js';

const router = express.Router();

router.post('/set-password', validatePassword, setPassword);

// Add new endpoint to check if a mobile number already exists
router.post('/check-mobile', async (req, res) => {
  const { mobileNumber } = req.body;
  
  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required'
    });
  }
  
  const cleanNumber = mobileNumber.replace(/\D/g, '');
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT id FROM users WHERE mobile_number = $1',
      [cleanNumber]
    );
    
    const exists = result.rowCount > 0;
    
    res.json({
      success: true,
      exists,
      message: exists ? 'Mobile number already registered' : 'Mobile number available'
    });
  } catch (error) {
    console.error('Error checking mobile number:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking mobile number'
    });
  } finally {
    client.release();
  }
});

export default router;
