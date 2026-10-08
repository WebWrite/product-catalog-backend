import { randomUUID } from "crypto";
import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
    const requestId = req.get("X-Request-ID") || randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    const start = Date.now();

    res.on("finish", () => {
        const responseTime = Date.now() - start;

        logger.info("HTTP request completed", {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
        });
    });

    next();
};

export default requestLogger;