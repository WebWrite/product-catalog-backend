import { HTTP_STATUS } from "../constants/statusCodes.js"
import UserManager from "../managers/userManager.js"

class UserController {
  static async getCurrentUser(req, res) {
    let user = await UserManager.findUserById(req.user.id)
    return res.json({ user })
  }

  static async UpdateProfile(req, res) {
    let user = await UserManager.UpdateProfile(req.user.id, req.body)
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user
    })
  }
}

export default UserController
