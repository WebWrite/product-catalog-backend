import { ERROR_MESSAGES } from "../constants/errorMessages"

const authorization = (role) => {
  return (req, res, next) => {
    if (req.user.role != role) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }
    next()
  }
}
export default authorization
