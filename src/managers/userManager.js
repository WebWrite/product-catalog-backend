import UserRepository from "../repositories/user.rop.js"
import UserUtil from "../utils/user.util.js"
import bcrypt from "bcryptjs"
import Token from "../helpers/token.js"
import mongoose from "mongoose"
class UserManager {
  static async registerUser(data, session) {
    await UserUtil.findUserWitEmail(data.email)
    const hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword
    const user = await UserRepository.createUser(data, session)
    return user
  }
  static async createSellerProfile(data) {
    const { name, email, password, role, storeName, storeType } = data
    console.log("request data :: ", data)
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const user = await this.registerUser(
          {
            name,
            email,
            password,
            role
          },
          session
        )
        await UserRepository.createSellerProfile(
          {
            storeName,
            storeType,
            userId: user._id
          },
          session
        )
      })
    } finally {
      await session.endSession()
    }
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
