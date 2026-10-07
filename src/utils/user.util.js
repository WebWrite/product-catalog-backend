import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import UserRepository from "../repositories/user.rop.js"
import bcrypt from "bcryptjs"
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
    const isMatch = await bcrypt.compare(data.password, user.password)
    if (!isMatch) {
      console.log("email or password is incorrect")
    }
    if (!user.isVerified) {
      throw new Error(ERROR_MESSAGES.VERIFY_EMAIL)
    }
    return user
  }
}
export default UserUtil
