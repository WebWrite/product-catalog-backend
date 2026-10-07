import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const responseTime = Date.now() - start;
        logger.info( `${res.statusCode} ${req.method} ${req.originalUrl} ${responseTime}ms`);
    });

    next();
};

export default requestLogger;