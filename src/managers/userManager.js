import UserRepository from "../repositories/user.rop.js"
import UserUtil from "../utils/user.util.js"
import bcrypt from "bcryptjs"
import Token from "../helpers/token.js"

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
  static async Login(data) {
    const user = await UserUtil.verifyCredentialsForLogin(data)
    const accessToken = Token.getAccessToken(user._id, user.role)
    const refreshToken = Token.getRefreshToken(user._id, user.role)
    await UserRepository.updateRefreshToken(user._id, refreshToken)
    return {
      user,
      accessToken,
      refreshToken
    }
  }
  static async invalidateRefreshToken(refreshToken) {
    await UserRepository.invalidateRefreshToken(refreshToken)
  }
  static async updateRefreshToken(user) {
    const accessToken = Token.getAccessToken(user.id, user.role)
    const refreshToken = Token.getRefreshToken(user.id, user.role)
    await UserRepository.updateRefreshToken(user.id, refreshToken)
    return {
      accessToken,
      refreshToken
    }
  }
}

export default UserManager
