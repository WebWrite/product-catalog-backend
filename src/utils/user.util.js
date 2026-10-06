import UserRepository from "../repositories/user.rop.js"
class UserUtil {
  static async findUserWitEmail(email) {
    const user = await UserRepository.findUserWithEmail(email)
    if (!user) {
      console.log("email does not exist")
      return
    }
    return user
  }
}
export default UserUtil
