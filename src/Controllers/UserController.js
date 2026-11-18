import { HTTP_STATUS } from "../constants/statusCodes.js"
import UserManager from "../managers/userManager.js"
import AuthCookies from "../helpers/cookieOptions.js"

class UserController {
  static async getCurrentUser(req, res) {
    let user = await UserManager.findUserById(req.user.id)
    return res.json({ user })
  }

  static async UpdateProfile(req, res) {
    const passwordChanged = Boolean(req.body.oldPassword)
    let user = await UserManager.UpdateProfile(req.user.id, req.body)

    if (passwordChanged) {
      AuthCookies.clearCookies(res)
      req.app.get("io")?.in(`user:${req.user.id}`).disconnectSockets(true)
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user
    })
  }
}

export default UserController
