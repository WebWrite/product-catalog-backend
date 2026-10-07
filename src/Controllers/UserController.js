import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import UserManager from "../managers/userManager.js"

class UserController {
  static async registerUser(req, res, next) {
    try {
      await UserManager.registerUser(req.body)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.USER_REGISTERED
      })
    } catch (err) {
      next(err)
    }
  }
  static async registerSeller(req, res, next) {
    try {
      
      await UserManager.createSellerProfile(req.body)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.SELLER_PROFILE_CREATED
      })
    } catch (err) {
      next(err)
    }
  }
}
export default UserController
