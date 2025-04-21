import express from 'express';
import { setPassword } from '../controllers/userController.js';
import validatePassword from '../middleware/PasswordValidator.js';

const router = express.Router();

router.post('/set-password', validatePassword, setPassword);

export default router;
