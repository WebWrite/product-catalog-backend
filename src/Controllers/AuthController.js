import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import UserManager from "../managers/userManager.js"
import AuthCookies from "../helpers/cookieOptions.js"
import { logActivity } from "../utils/activityLog.util.js"

class AuthController {
  static async registerUser(req, res) {
    const user = await UserManager.registerUser(req.body)
    await logActivity({
      userId: user.id,
      action: "CUSTOMER_REGISTER",
      target: "Auth",
      role: user.role,
      message: "Customer create the account",
      requestId: req.requestId,
      metadata: { userId: user.id, email: user.email }
    })
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
  static async registerSeller(req, res) {
    const user = await UserManager.createSellerProfile(req.body)
    await logActivity({
      userId: user.id,
      action: "SELLER_REGISTER",
      target: "Auth",
      role: user.role,
      message: "Seller create the account",
      requestId: req.requestId,
      metadata: { email: req.body.email }
    })

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
  static async Login(req, res) {
    const result = await UserManager.Login(req.body)
    const { user, accessToken, refreshToken, cart } = result
    const { id, role, email, name, isVerified, status } = user
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    await logActivity({
      userId: id,
      action: "LOGIN",
      target: "Auth",
      role: role,
      message: "User logged in successfully",
      requestId: req.requestId,
      metadata: { name, email }
    })

    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.USER_LOGGED_IN,
      user: { id, role, email, name, isVerified, status, cart }
    })
  }

  static async Logout(req, res) {
    await UserManager.invalidateRefreshToken(req.cookies.refreshToken)
    AuthCookies.clearCookies(res)
    await logActivity({
      userId: req.user.id,
      action: "LOGOUT",
      target: "Auth",
      role: req.user.role,
      message: "User logged out successfully",
      requestId: req.requestId,
      metadata: { userId: req.user.id }
    })
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.USER_LOGGED_OUT
    })
  }

  static async refreshToken(req, res) {
    const { accessToken, refreshToken } = await UserManager.updateRefreshToken(
      req.user
    )
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.REFRESH_TOKEN_UPDATED
    })
  }
  static async verifyOtp(req, res) {
    let user = await UserManager.verifyEmail(req.body)
    await logActivity({
      userId: user.id,
      action: "VERIFY OTP",
      target: "Auth",
      role: user.role,
      message: "User email verify successfully",
      requestId: req.requestId,
      metadata: { email: user.email, isVerified: user.isVerified }
    })
    return res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.OTP_VERIFIED
    })
  }

  static async sendLoginOtp(req, res) {
    let user = await UserManager.sendLoginOtp(req.body)
    await logActivity({
      userId: user.id,
      action: "OTP SEND",
      target: "Auth",
      role: user.role,
      message: "OTP send successfully",
      requestId: req.requestId,
      metadata: { email: user.email, isVerified: user.isVerified }
    })
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }

  static async verifyLoginOtp(req, res) {
    const result = await UserManager.verifyLoginOtp(req.body)
    const { user, accessToken, refreshToken, cart } = result
    const { id, role, email, name, isVerified, status } = user
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    await logActivity({
      userId: id,
      action: "VERIFY OTP",
      target: "Auth",
      role: role,
      message: "User verify OTP successfully",
      requestId: req.requestId,
      metadata: { email: req.body.email }
    })
    return res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.OTP_VERIFIED,
      user: { id, role, email, name, isVerified, status, cart }
    })
  }

  static async resendEmailOtp(req, res) {
    let user = await UserManager.resendEmailOtp(req.body)
    await logActivity({
      userId: user.id,
      action: "RESEND OTP",
      target: "Auth",
      role: user.role,
      message: "Again OTP send successfully",
      requestId: req.requestId,
      metadata: { email: user.email, isVerified: user.isVerified }
    })
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
}
export default AuthController
