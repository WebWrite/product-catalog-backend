import { HTTP_STATUS } from "../constants/statusCodes.js"
import ChatManager from "../managers/chatManager.js"

class ChatSocketController {
  static async createChat(socket, payload, callback) {
    try {
      const { roomId, messages } = await ChatManager.createChat(
        socket.data.user,
        payload
      )

      await socket.join(roomId)
      callback?.({ success: true, roomId, messages })
      console.log("room joined successfully ")
    } catch (error) {
      callback?.({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.isOperational ? error.message : "Unable to create chat"
      })
    }
  }

  static async joinRoom(socket, payload, callback) {
    try {
      const { roomId, messages } = await ChatManager.joinRoom(
        socket.data.user,
        payload?.roomId
      )

      await socket.join(roomId)

      socket.to(roomId).emit("messages_seen")

      callback?.({ success: true, roomId, messages })
    } catch (error) {
      callback?.({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.isOperational ? error.message : "Unable to join room"
      })
    }
  }

  static async getConversations(req, res) {
    const conversations = await ChatManager.getUserConversations(req.user.id)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: conversations
    })
  }

  static async sendMessage(io, socket, payload, callback) {
    try {
      const message = await ChatManager.sendMessage(socket.data.user, payload)

      const savedMessage = message.toObject()
      const roomId = savedMessage.roomId.toString()

      const recipientId = savedMessage.recipientId.toString()

      io.to(roomId).emit("new_message", savedMessage)

      io.to(`user:${recipientId}`).emit("new_message_notification", {
        roomId,
        messageId: savedMessage._id.toString(),
        senderId: savedMessage.senderId.toString(),
        text: savedMessage.text
      })

      callback?.({
        success: true,
        message: savedMessage
      })
    } catch (error) {
      callback?.({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.isOperational ? error.message : "Unable to send message"
      })
    }
  }

  static async markMessageAsSeen(socket, payload, callback) {
    try {
      const message = await ChatManager.markMessageAsSeen(
        socket.data.user,
        payload?.messageId
      )

      if (message) {
        socket.to(message.roomId.toString()).emit("message_seen", {
          messageId: message._id.toString()
        })
      }

      callback?.({ success: true })
    } catch (error) {
      callback?.({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.isOperational
          ? error.message
          : "Unable to mark message as seen"
      })
    }
  }
  static typing(socket, { roomId, isTyping }) {
    if (typeof isTyping !== "boolean" || !socket.rooms.has(roomId)) {
      return
    }
    socket.to(roomId).emit("typing", {
      userId: socket.data.user.userId,
      isTyping
    })
  }

  static async getTotalUnreadCount(req, res) {
    const unreadCount = await ChatManager.getTotalUnreadCount(req.user.id)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { unreadCount }
    })
  }

  static async createAdminChat(socket, payload, callback) {
    try {
      const { roomId, messages } = await ChatManager.createAdminChat(
        socket.data.user,
        payload
      )

      await socket.join(roomId)

      callback?.({ success: true, roomId, messages })
    } catch (error) {
      callback?.({
        success: false,
        statusCode: error.statusCode || 500,
        message: error.isOperational
          ? error.message
          : "Unable to create admin chat"
      })
    }
  }
}

export default ChatSocketController
