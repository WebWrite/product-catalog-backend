import { HTTP_STATUS } from "../constants/statusCodes.js"
import UserManager from "../managers/userManager.js"

class UserController {
  static async getCurrentUser(req, res) {
    let user = await UserManager.findUserById(req.user.id)
    return res.json({ user })
  }
}

export default UserController
