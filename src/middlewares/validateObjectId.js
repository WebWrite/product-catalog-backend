import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

const validateObjectId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid product ID", 400));
    }

    next();
};

export default validateObjectId;