import User from "../models/User.js"
import SellerProfile from "../models/seller.profile.model.js"

class UserRepository {
  static async findUserWithEmail(email) {
    return await User.findOne({ email })
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
  static async finUserbyId(id) {
    return await User.findOne({ _id: id })
  }
}
export default UserRepository
