import User from "../schemas/user.schema.js"
import SellerProfile from "../schemas/seller.profile.schema.js"
class UserRepository {
  static async findUserWithEmail(email) {
    return await User.findOne({ email })
  }

  static async createUser(data) {
    return await User.create(data)
  }
  static async createSellerProfile(profileData) {
    return await SellerProfile.create(profileData)
  }
  static async invalidateRefreshToken(refreshToken) {
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: null })
  }
  static async updateRefreshToken(id, refreshToken) {
    await User.findOneAndUpdate({ id }, { refreshToken: refreshToken })
  }
}
export default UserRepository
