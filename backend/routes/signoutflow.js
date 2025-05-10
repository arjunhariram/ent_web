import express from 'express';
import { invalidateToken } from '../utils/JWTinvalidator.js';
import { jwtMiddleware } from '../middleware/jwtverify.js';

const router = express.Router();

// Apply jwtMiddleware to ensure user is authenticated before signing out
// This also ensures req.mobileNumber is available if needed, and token is somewhat validated
router.post('/signout', jwtMiddleware, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // This case should ideally be caught by jwtMiddleware if it's configured to run before this
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
      return res.status(400).json({ message: 'Token not provided in header' });
    }

    const invalidated = await invalidateToken(token);

    if (invalidated) {
      // Optionally, clear any session-related cookies if they are httpOnly and set by the server
      // res.clearCookie('session_cookie_name'); 
      res.status(200).json({ message: 'Successfully signed out' });
    } else {
      // This could happen if the token was already expired or an error occurred during blacklisting
      res.status(500).json({ message: 'Sign out process encountered an issue' });
    }
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ message: 'Internal server error during sign out' });
  }
});

export default router;
