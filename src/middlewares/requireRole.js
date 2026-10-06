import AppError from "../utils/AppError.js";

const requireRole = (role) => {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            return next(new AppError("Access denied", 403));
        }

        next();
    };
};

export default requireRole;