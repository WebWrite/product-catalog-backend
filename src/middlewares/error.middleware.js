import { HTTP_STATUS } from "../constants/statusCodes.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
const errorHandler = (err, req, res, next) => {
  console.log("actual error is :: ", err)
  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR })
}
export default errorHandler
