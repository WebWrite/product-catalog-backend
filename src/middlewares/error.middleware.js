import logger from "../config/logger.js";

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
                ? "Internal server error"
                : err.message,
    });
};

export default errorHandler;