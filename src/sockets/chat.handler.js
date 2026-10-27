import ChatSocketController from "../Controllers/chatController.js"

const registerChatHandlers = (io, socket) => {
  socket.on("create_chat", (payload, callback) => {
    ChatSocketController.createChat(socket, payload, callback)
  })

  socket.on("join_room", (payload, callback) => {
    ChatSocketController.joinRoom(socket, payload, callback)
  })
  socket.on("send_message", (payload, callback) => {
    ChatSocketController.sendMessage(io, socket, payload, callback)
  })

  socket.on("mark_seen", (payload, callback) => {
    ChatSocketController.markMessageAsSeen(socket, payload, callback)
  })
  socket.on("typing", (payload) => {
    ChatSocketController.typing(socket, payload)
  })
}

export default registerChatHandlers
