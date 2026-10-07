import jwt from "jsonwebtoken"
const authentication = (requestToken, secretKey) => {
  return (req, res, next) => {
    const token = req.cookies[requestToken]
    if (!token) {
      throw new Error("token is missing")
    }
    try {
      const payload = jwt.verify(token, secretKey)
      req.user = payload
      next()
    } catch (err) {
      next(err)
    }
  }
}
export default authentication
