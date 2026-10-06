import { ERROR_MESSAGES } from "../constants/errorMessages.js";
import AppError from "../utils/AppError.js";

const notFound = (req, res, next) => {
    next(
        new AppError(
            `${ERROR_MESSAGES.RESOURCE_NOT_FOUND} : ${req.method} ${req.originalUrl}`,
            404
        )
    );
};

export default notFound;