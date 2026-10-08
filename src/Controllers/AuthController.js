import { HTTP_STATUS } from "../constants/statusCodes.js"
import { SUCCESS_MESSAGES } from "../constants/successMessages.js"
import UserManager from "../managers/userManager.js"
import AuthCookies from "../helpers/cookieOptions.js"

class AuthController {
  static async registerUser(req, res, next) {
    try {
      await UserManager.registerUser(req.body)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.USER_REGISTERED
      })
    } catch (err) {
      next(err)
    }
  }
  static async registerSeller(req, res, next) {
    try {
      await UserManager.createSellerProfile(req.body)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.SELLER_PROFILE_CREATED
      })
    } catch (err) {
      next(err)
    }
  }
  static async Login(req, res, next) {
    try {
      const result = await UserManager.Login(req.body)
      const { user, accessToken, refreshToken } = result
      const { role, email, name } = user
      AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.USER_LOGGED_IN,
        user: { role, email, name }
      })
    } catch (err) {
      next(err)
    }
  }
  static async Logout(req, res, next) {
    try {
      //invalidate refreshToken and clear cookies
      await UserManager.invalidateRefreshToken(req.cookies.refreshToken)
      AuthCookies.clearCookies(res)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.USER_LOGGED_OUT
      })
    } catch (err) {
      next(err)
    }
  }
  static async refreshToken(req, res, next) {
    try {
      const { accessToken, refreshToken } =
        await UserManager.updateRefreshToken(req.user)
      AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.REFRESH_TOKEN_UPDATED
      })
    } catch (err) {
      next(err)
    }
  }
  static async verifyOtp(req, res, next) {
    try {
      await UserManager.verifyEmail(req.body)
      return res.status(HTTP_STATUS.CREATED).json({
        message: SUCCESS_MESSAGES.OTP_VERIFIED
      })
    } catch (err) {
      next(err)
    }
  }

  static async sendLoginOtp(req, res, next) {
    try {
      await UserManager.sendLoginOtp(req.body)
      return res.status(HTTP_STATUS.OK).json({
        message: SUCCESS_MESSAGES.OTP_SEND
      })
    } catch (err) {
      next(err)
    }
  }

  static async verifyLoginOtp(req, res, next) {
    try {
      const result = await UserManager.verifyLoginOtp(req.body)
      const { user, accessToken, refreshToken } = result
      const { role, email, name } = user
      AuthCookies.setAccessTokenCookie(res, accessToken, refreshToken)
      return res.status(HTTP_STATUS.CREATED).json({
        message: SUCCESS_MESSAGES.OTP_VERIFIED,
        user: { name, email, role }
      })
    } catch (err) {
      next(err)
    }
  }
}
export default AuthController
