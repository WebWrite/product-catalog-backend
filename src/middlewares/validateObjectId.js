import mongoose from "mongoose"
import AppError from "../utils/AppError.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"

const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(
      new AppError(ERROR_MESSAGES.INVALID_OBJECT_ID, HTTP_STATUS.BAD_REQUEST)
    )
  }

  next()
}

export default validateObjectId
