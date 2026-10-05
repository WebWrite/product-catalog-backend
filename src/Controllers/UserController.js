import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"

class UserController {
  static async registerUser(req, res, next) {
    console.log(req.body)
    try {
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.USER_REGISTERED
      })
    } catch (err) {
      next(err)
    }
  }
}
export default UserController
