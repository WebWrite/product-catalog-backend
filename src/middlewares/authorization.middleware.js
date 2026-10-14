import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AppError from "../utils/AppError.js"

const authorization = (role) => {
  return (req, res, next) => {
    if (req.user.role != role) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED)
    }
    next()
  }
}
export default authorization
