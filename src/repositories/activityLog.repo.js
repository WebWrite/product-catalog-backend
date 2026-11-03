import ActivityLog from "../models/AcitivtyLog.js"

class ActivityLogRepository {
  static async findSellerActivityLogs(sellerId, filters) {
    const { page, limit, target, search } = filters

    const query = {
      userId: sellerId,
      role: "seller"
    }

    if (target) {
      query.target = target
    }

    if (search) {
      const regex = new RegExp(RegExp.escape(search), "i")

      query.$or = [{ action: regex }, { message: regex }]
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .select("action target status message requestId createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      ActivityLog.countDocuments(query)
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

export default ActivityLogRepository
