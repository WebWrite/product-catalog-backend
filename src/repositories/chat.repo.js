import User from "../models/User.js"
import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"
import mongoose from "mongoose"

class ChatRepository {
  static findSellerById(sellerId) {
    return User.findOne({ _id: sellerId, role: "seller" })
      .select("_id role")
      .lean()
  }

  static findConversationById(roomId) {
    return Conversation.findById(roomId).select("_id type participants").lean()
  }

  static async findOrCreateConversation({ type, participantIds }) {
    let conversation = await Conversation.findOne({
      type,
      participants: { $all: participantIds }
    })

    if (!conversation) {
      conversation = await Conversation.create({
        type,
        participants: participantIds
      })
    }

    return conversation
  }

  static async getMessages(roomId, limit = 50) {
    return Message.find({ roomId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .then((messages) => messages.reverse())
  }

  static async getUserConversations(userId) {
    const conversations = await Conversation.aggregate([
      {
        $match: {
          participants: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: "participants",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                role: 1
              }
            }
          ],
          as: "participants"
        }
      },
      {
        $project: {
          _id: 1,
          participants: 1
        }
      }
    ])

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipientId: new mongoose.Types.ObjectId(userId),
          seen: false,
          roomId: { $in: conversations.map(({ _id }) => _id) }
        }
      },
      {
        $group: {
          _id: "$roomId",
          unreadCount: { $sum: 1 }
        }
      }
    ])

    return conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      )

      return {
        roomId: conversation._id,
        otherParticipant: otherParticipant
          ? {
              name: otherParticipant.name,
              role: otherParticipant.role
            }
          : null,
        unreadCount:
          unreadCounts.find(
            (item) => item._id.toString() === conversation._id.toString()
          )?.unreadCount || 0
      }
    })
  }

  static markMessagesAsSeen(roomId, userId) {
    return Message.updateMany(
      {
        roomId,
        recipientId: userId,
        seen: false
      },
      {
        $set: { seen: true }
      }
    )
  }

  static findConversationByParticipants(type, participantIds) {
    return Conversation.findOne({
      type,
      participants: { $all: participantIds }
    })
      .select("_id type participants")
      .lean()
  }
  static createMessage(messageData) {
    return Message.create(messageData)
  }

  static markMessageAsSeen(messageId, userId) {
    return Message.findOneAndUpdate(
      {
        _id: messageId,
        recipientId: userId,
        seen: false
      },
      {
        $set: { seen: true }
      },
      { returnDocument: "after" }
    )
      .select("_id roomId")
      .lean()
  }

  static getTotalUnreadCount(userId) {
    return Message.countDocuments({
      recipientId: userId,
      seen: false
    })
  }
  static findAdmin() {
    return User.findOne({ role: "admin" }).select("_id role").lean()
  }

  static findUserById(userId) {
    return User.findById(userId).select("_id role").lean()
  }
}

export default ChatRepository
