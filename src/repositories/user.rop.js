import User from "../schemas/User.js"
import SellerProfile from "../schemas/seller.profile.schema.js"

class UserRepository {
  static async findUserWithEmail(email) {
    return await User.findOne({ email })
  }
  static async createUser(data) {
    return await User.create(data)
  }
  static async createUser(data, session) {
    const user = await User.create([data], session ? { session } : undefined)
    return Array.isArray(user) ? user[0] : user
  }
  static async createSellerProfile(profileData, session) {
    const sellerProfile = await SellerProfile.create(
      [profileData],
      session ? { session } : undefined
    )
    return sellerProfile[0]
  }
  static async invalidateRefreshToken(refreshToken) {
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: null })
  }
  static async updateRefreshToken(id, refreshToken) {
    await User.findOneAndUpdate({ id }, { refreshToken: refreshToken })
  }
  static async updateVerifyStatus(email) {
    await User.findOneAndUpdate({ email }, { isVerified: true })
  }
}
export default UserRepository
