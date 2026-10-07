import logger from "../config/logger.js";
import { ERROR_MESSAGES } from "../constants/errorMessages.js";

const errorHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        method: req.method,
        url: req.originalUrl,
        statusCode: err.statusCode || 500,
        stack: err.stack,
    });

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? `${ERROR_MESSAGES.INTERNAL_SERVER_ERROR}`
                : err.message,
    });
};

export default errorHandler;