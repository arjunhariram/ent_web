import express from 'express';
import validateMobileNumber from '../middleware/InputValueChecker.js';

const router = express.Router();

router.post('/validate-mobile', validateMobileNumber);

export default router;
