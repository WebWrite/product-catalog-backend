import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import UserManager from "../managers/userManager.js"
import AuthCookies from "../helpers/cookieOptions.js"

class AuthController {
  static async registerUser(req, res) {
    await UserManager.registerUser(req.body)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
  static async registerSeller(req, res) {
    await UserManager.createSellerProfile(req.body)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
  static async Login(req, res) {
    const result = await UserManager.Login(req.body)
    const { user, accessToken, refreshToken } = result
    const { role, email, name, isVerified, status } = user
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.USER_LOGGED_IN,
      user: { role, email, name, isVerified, status }
    })
  }
  static async Logout(req, res) {
    //invalidate refreshToken and clear cookies
    await UserManager.invalidateRefreshToken(req.cookies.refreshToken)
    AuthCookies.clearCookies(res)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.USER_LOGGED_OUT
    })
  }
  static async refreshToken(req, res, next) {
    const { accessToken, refreshToken } = await UserManager.updateRefreshToken(
      req.user
    )
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.REFRESH_TOKEN_UPDATED
    })
  }
  static async verifyOtp(req, res) {
    await UserManager.verifyEmail(req.body)
    return res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.OTP_VERIFIED
    })
  }

  static async sendLoginOtp(req, res) {
    await UserManager.sendLoginOtp(req.body)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }

  static async verifyLoginOtp(req, res) {
    const result = await UserManager.verifyLoginOtp(req.body)
    const { user, accessToken, refreshToken } = result
    const { role, email, name, isVerified, status } = user
    AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
    return res.status(HTTP_STATUS.CREATED).json({
      message: SUCCESS_MESSAGES.OTP_VERIFIED,
      user: { role, email, name, isVerified, status }
    })
  }

  static async resendEmailOtp(req, res) {
    await UserManager.resendEmailOtp(req.body)
    return res.status(HTTP_STATUS.OK).json({
      message: SUCCESS_MESSAGES.OTP_SEND
    })
  }
}
export default AuthController
