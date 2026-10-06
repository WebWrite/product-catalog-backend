import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message:
            "Too many authentication attempts. Please try again later.",
    },
});
export default authLimiter;