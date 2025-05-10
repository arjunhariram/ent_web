import express from 'express';
import { jwtMiddleware } from '../middleware/jwtverify.js';
import { authenticateUser } from '../utils/Auth.js';
import { validatePasswordFormat, passwordsMatch } from '../middleware/PasswordFormatValidator.js';
import { hashPassword } from '../utils/PasswordHash.js';
import { updateUserPassword } from '../utils/modifypassword.js';
import { verifyPasswordNotOverlapping } from '../utils/passwordoverlapprevention.js';

const router = express.Router();

/**
 * Route to change user password
 * Requires:
 * - JWT authentication token
 * - Current password
 * - New password
 * - Confirm password
 */
router.post('/change-password', jwtMiddleware, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const mobileNumber = req.mobileNumber; // Set by JWT middleware
  
  console.log('Received change password request for mobile:', mobileNumber);
  
  try {
    // Step 1: Verify current password
    const user = await authenticateUser(mobileNumber, currentPassword);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }
    
    // Step 2: Validate new password format
    const passwordValidation = validatePasswordFormat(newPassword);
    if (!passwordValidation.success) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
        details: passwordValidation.details
      });
    }
    
    // Step 3: Check if passwords match
    const matchResult = passwordsMatch(newPassword, confirmPassword);
    if (!matchResult.success) {
      return res.status(400).json({
        success: false,
        message: matchResult.message
      });
    }
    
    // Step 3.5: Check if new password overlaps with current/past passwords
    const overlapResult = await verifyPasswordNotOverlapping(mobileNumber, newPassword);
    if (!overlapResult.success) {
      return res.status(400).json({
        success: false,
        message: overlapResult.message
      });
    }
    
    // Step 4: Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Step 5: Update password in database
    // Fixed: Passing parameters as separate arguments to match the function signature
    const updateResult = await updateUserPassword(mobileNumber, hashedPassword);
    
    if (!updateResult.success) {
      return res.status(400).json({
        success: false,
        message: updateResult.message
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('Error in change password route:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password'
    });
  }
});

export default router;
