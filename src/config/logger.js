import winston from "winston";

const {colorize} = winston.format
const logger = winston.createLogger({
    level: "info",

    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        colorize({
            all: true,
            colors: {
                info: "gray", 
                error: "red",     
            },
        }),

        winston.format.printf((info) => {
            if (info.stack) {
                return `${info.timestamp} ${info.level.toUpperCase()}\n${info.stack}`;
            }

            return `${info.timestamp} ${info.level.toUpperCase()} ${info.message}`;
        })
    ),

    transports: [
        new winston.transports.Console(),
    ],
});

export default logger;