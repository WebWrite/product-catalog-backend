import UserRepository from "../repositories/user.rop.js"
import UserUtil from "../utils/user.util.js"
import bcrypt from "bcryptjs"

class UserManager {
  static async registerUser(data) {
    await UserUtil.findUserWitEmail(data.email)
    const hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword 
    const user = await UserRepository.createUser(data)
    return user
  }
  static async createSellerProfile(data) {
    const { name, email, password, role, storeName, storeType } = data
    const user = await this.registerUser({
      name,
      email,
      password,
      role
    })
    await UserRepository.createSellerProfile({
      storeName,
      storeType,
      userId: user._id
    })
  }
}
export default UserManager
