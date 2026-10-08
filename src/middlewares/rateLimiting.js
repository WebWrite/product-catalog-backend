import rateLimit from 'express-rate-limit'
import { ERROR_MESSAGES } from '../constants/errorMessages.js';

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: `${ERROR_MESSAGES.AUTH_LIMIT}`
    
});

export default authLimiter;