import { verifyToken } from '../utils/authUtils.js';

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default auth;
