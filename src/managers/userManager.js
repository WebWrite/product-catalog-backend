import UserRepository from "../repositories/user.rop.js"
import UserUtil from "../utils/user.util.js"
import bcrypt from "bcryptjs"
import Token from "../helpers/token.js"
import mongoose from "mongoose"
import OtpUtils from "../utils/otp.util.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import AppError from "../utils/AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
class UserManager {
  static async registerUser(data, session) {
    let isUser = await UserUtil.findUserWitEmail(data.email)
    if (isUser) {
      throw new AppError(
        ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      )
    }
    const hashedPassword = await bcrypt.hash(data.password, 10)
    data.password = hashedPassword
    const user = await UserRepository.createUser(data, session)
    await OtpUtils.sendOtp(data.name, data.email, "signup")
    return user
  }

  static async createSellerProfile(data) {
    const { name, email, password, storeName, storeType } = data

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const user = await this.registerUser(
          {
            name,
            email,
            password,
            role: "seller"
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
      await OtpUtils.sendOtp(name, email, "signup")
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

  static async verifyEmail(data) {
    const { email, otp } = data
    await OtpUtils.verifyOtp(email, otp, "signup")
    await UserRepository.updateVerifyStatus(email)
  }
  static async sendLoginOtp(data) {
    const user = await UserUtil.findUserWitEmail(data.email)
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    if (!user.isVerified) {
      throw new AppError(ERROR_MESSAGES.VERIFY_EMAIL, HTTP_STATUS.BAD_REQUEST)
    }
    OtpUtils.sendOtp(user.name, user.email, "signin")
  }

  static async verifyLoginOtp(data) {
    const { email, otp } = data
    await OtpUtils.verifyOtp(email, otp, "signin")
    const user = await UserUtil.findUserWitEmail(email)
    const accessToken = Token.getAccessToken(user._id, user.role)
    const refreshToken = Token.getRefreshToken(user._id, user.role)
    await UserRepository.updateRefreshToken(user._id, refreshToken)
    return {
      user,
      accessToken,
      refreshToken
    }
  }

  static async resendEmailOtp(data) {
    let user = await UserUtil.findUserWitEmail(data.email)
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }
    await OtpUtils.sendOtp(user.name, data.email, "signup")
  }

  static async findUserById(id) {
    let user = await UserRepository.finUserbyId(id)
    console.log(user)
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      status: user.status
    }
  }
}

export default UserManager
