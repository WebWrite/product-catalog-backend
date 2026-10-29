import mongoose from "mongoose"
import ChatRepository from "../repositories/chat.repo.js"
import { ERROR_MESSAGES } from "../constants/errorMessages.js"
import { HTTP_STATUS } from "../constants/statusCodes.js"
import AppError from "../utils/AppError.js"

class ChatManager {
  static async createChat(user, payload = {}) {
    let otherUser

    if (user.role === "customer") {
      const { participantId } = payload

      if (!participantId || !mongoose.isValidObjectId(participantId)) {
        throw new AppError(
          ERROR_MESSAGES.INVALID_OBJECT_ID,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      otherUser = await ChatRepository.findSellerById(participantId)

      if (!otherUser) {
        throw new AppError(
          ERROR_MESSAGES.SELLER_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        )
      }
    } else if (user.role === "seller") {
      const { participantId } = payload

      if (!participantId || !mongoose.isValidObjectId(participantId)) {
        throw new AppError(
          ERROR_MESSAGES.INVALID_OBJECT_ID,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      otherUser = await ChatRepository.findUserById(participantId)

      if (!otherUser || otherUser.role !== "customer") {
        throw new AppError(
          ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        )
      }
    } else {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    const participantIds = [user.userId, otherUser._id.toString()]

    const conversation = await ChatRepository.findOrCreateConversation({
      type: "buyer_seller",
      participantIds
    })

    const roomId = conversation._id.toString()

    await ChatRepository.markMessagesAsSeen(roomId, user.userId)

    const messages = await ChatRepository.getMessages(roomId)

    return { roomId, messages }
  }

  static async joinRoom(user, roomId) {
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_OBJECT_ID,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const conversation = await ChatRepository.findConversationById(roomId)

    if (!conversation) {
      throw new AppError(
        ERROR_MESSAGES.RESOURCE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const isParticipant = conversation.participants.some(
      (participantId) => participantId.toString() === user.userId.toString()
    )

    if (!isParticipant) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    await ChatRepository.markMessagesAsSeen(roomId, user.userId)

    const messages = await ChatRepository.getMessages(roomId)

    return {
      roomId: conversation._id.toString(),
      messages
    }
  }

  static async getUserConversations(userId) {
    return ChatRepository.getUserConversations(userId)
  }

  static async sendMessage(
    user,
    { roomId, text = "", attachment = null } = {}
  ) {
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_OBJECT_ID,
        HTTP_STATUS.BAD_REQUEST
      )
    }
    if (typeof text !== "string" || text.trim().length > 5000) {
      throw new AppError(
        "Message cannot exceed 5000 characters",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const trimmedText = text.trim()
    if (!trimmedText && !attachment) {
      throw new AppError(
        "Message must contain text or an image",
        HTTP_STATUS.BAD_REQUEST
      )
    }

    if (
      attachment &&
      (attachment.type !== "image" ||
        typeof attachment.url !== "string" ||
        !attachment.url.trim() ||
        typeof attachment.publicId !== "string" ||
        !attachment.publicId.trim())
    ) {
      throw new AppError("Invalid image attachment", HTTP_STATUS.BAD_REQUEST)
    }

    const conversation = await ChatRepository.findConversationById(roomId)

    if (!conversation) {
      throw new AppError(
        ERROR_MESSAGES.RESOURCE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    const senderId = user.userId.toString()

    const isParticipant = conversation.participants.some(
      (participantId) => participantId.toString() === senderId
    )

    if (!isParticipant) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    const recipientId = conversation.participants.find(
      (participantId) => participantId.toString() !== senderId
    )

    if (!recipientId) {
      throw new AppError(
        ERROR_MESSAGES.RESOURCE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      )
    }

    return ChatRepository.createMessage({
      roomId: conversation._id,
      senderId,
      recipientId,
      text: trimmedText || null,
      attachment: attachment
        ? {
            type: "image",
            url: attachment.url,
            publicId: attachment.publicId
          }
        : null,
      seen: false
    })
  }

  static async markMessageAsSeen(user, messageId) {
    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      throw new AppError(
        ERROR_MESSAGES.INVALID_OBJECT_ID,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    const message = await ChatRepository.markMessageAsSeen(
      messageId,
      user.userId
    )

    return message
  }
  static async getTotalUnreadCount(userId) {
    return ChatRepository.getTotalUnreadCount(userId)
  }

  static async createAdminChat(user, { participantId } = {}) {
    let otherUser
    let type

    if (user.role === "admin") {
      if (!participantId || !mongoose.isValidObjectId(participantId)) {
        throw new AppError(
          ERROR_MESSAGES.INVALID_OBJECT_ID,
          HTTP_STATUS.BAD_REQUEST
        )
      }

      otherUser = await ChatRepository.findUserById(participantId)

      if (!otherUser || !["customer", "seller"].includes(otherUser.role)) {
        throw new AppError(
          ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        )
      }

      type = otherUser.role === "seller" ? "admin_seller" : "buyer_admin"
    } else if (["customer", "seller"].includes(user.role)) {
      otherUser = await ChatRepository.findAdmin()

      if (!otherUser) {
        throw new AppError(
          ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        )
      }

      type = user.role === "seller" ? "admin_seller" : "buyer_admin"
    } else {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    const participantIds = [user.userId, otherUser._id.toString()]

    const conversation = await ChatRepository.findOrCreateConversation({
      type,
      participantIds
    })

    const roomId = conversation._id.toString()

    await ChatRepository.markMessagesAsSeen(roomId, user.userId)

    const messages = await ChatRepository.getMessages(roomId)

    return { roomId, messages }
  }
}

export default ChatManager
