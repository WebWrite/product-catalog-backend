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

  static async updateRefreshToken(userId, refreshToken) {
    return User.findOneAndUpdate(
      { _id: userId },
      { refreshToken },
      { new: true, runValidators: true }
    )
  }

  static async updateVerifyStatus(email) {
    return await User.findOneAndUpdate({ email }, { isVerified: true })
  }
  static async finUserbyId(id) {
    return await User.findOne({ _id: id })
  }
  static async findSellerWithProfile(userId, session) {
    const query = User.findById(userId)
      .select("name email role createdAt")
      .populate({
        path: "sellerProfile",
        select: "storeName storeType"
      })

    if (session) query.session(session)

    return query.lean()
  }

  static async updateSellerById(userId, changes, session) {
    return User.findByIdAndUpdate(
      userId,
      { $set: changes },
      {
        new: true,
        runValidators: true,
        session
      }
    )
      .select("name email role createdAt")
      .lean()
  }

  static async updatePasswordById(userId, hashedPassword) {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: {
          password: hashedPassword
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
      .select("_id")
      .lean()
  }
  static async UpdateUser(id, data) {
    return await User.findByIdAndUpdate(
      id,
      {
        password: data.newPassword,
        name: data.name
      },
      { returnDocument: "after" }
    )
  }
}
export default UserRepository
