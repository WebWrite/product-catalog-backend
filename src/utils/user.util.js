import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import UserRepository from "../repositories/user.rop.js"
import bcrypt from "bcryptjs"
import AppError from "./AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
class UserUtil {
  static async findUserWitEmail(email) {
    const user = await UserRepository.findUserWithEmail(email)
    if (!user) {
      console.log("email does not exist")
      return
    }
    return user
  }
  static async verifyCredentialsForLogin(data) {
    const user = await this.findUserWitEmail(data.email)
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    const isMatch = await bcrypt.compare(data.password, user.password)
    if (!isMatch) {
      console.log("email or password is incorrect")
    }
    if (!user.isVerified) {
      throw new AppError(ERROR_MESSAGES.VERIFY_EMAIL, HTTP_STATUS.FORBIDDEN)
    }
    return user
  }
}
export default UserUtil
