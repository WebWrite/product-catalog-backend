import SellerProfile from "../models/seller.profile.model.js"

class SellerProfileRepository {
  static async updateByUserId(userId, changes, session) {
    const query = SellerProfile.findOneAndUpdate(
      { userId },
      { $set: changes },
      {
        returnDocument: "after",
        runValidators: true,
        session
      }
    )

    return query.lean()
  }
}

export default SellerProfileRepository
