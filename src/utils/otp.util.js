import { randomInt } from "crypto"
import redis from "../config/redis.config.js"
import transport from "../config/mailer.config.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import AppError from "./AppError.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"

class OtpUtils {
  static generateOtp() {
    return randomInt(100000, 1000000).toString()
  }
  static async sendOtp(name, email, key) {
    const otp = this.generateOtp()
    const redisKey = `otp:${key}:${email}`
    await redis.del(redisKey)
    await redis.set(redisKey, otp, {
      EX: 300
    })
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your verification OTP",

      html: `
        <h2>Email Verification</h2>

        <p>Hello ${name},</p>

        <p>Your verification OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP will expire in 5 minutes.</p>
      `
    })
  }

  static async verifyOtp(email, otp, key) {
    const redisKey = `otp:${key}:${email}`
    const storeOtp = await redis.get(redisKey)
    if (!storeOtp) {
      throw new AppError(ERROR_MESSAGES.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST)
    }

    if (storeOtp != otp) {
      throw new AppError(ERROR_MESSAGES.OTP_INVALID, HTTP_STATUS.BAD_REQUEST)
    }
    await redis.del(redisKey)
  }
}

export default OtpUtils
