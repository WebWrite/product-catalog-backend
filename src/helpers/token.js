import jwt from "jsonwebtoken"
class Token {
  static getAccessToken(id, role) {
    const payload = { id: id, role: role }
    const secret = process.env.ACCESS_TOKEN_SECRET_KEY
    if (!secret) {
      console.log("access token key is missing in env file")
    }
    const token = jwt.sign(payload, secret, { expiresIn: "15m" })
    return token
  }
  static getRefreshToken(id, role) {
    const payload = { id: id, role: role }
    const secret = process.env.REFRESH_TOKEN_SECRET_KEY
    if (!secret) {
      console.log("refresh token key is missing in env file")
    }
    const token = jwt.sign(payload, secret, { expiresIn: "7d" })
    return token
  }
}

export default Token
