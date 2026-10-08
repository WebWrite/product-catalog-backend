import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AppError from "../utils/AppError.js"

const notFound = (req, res, next) => {
  next(
    new AppError(
      `${ERROR_MESSAGES.RESOURCE_NOT_FOUND} : ${req.method} ${req.originalUrl}`,
      HTTP_STATUS.NOT_FOUND
    )
  )
}

export default notFound
