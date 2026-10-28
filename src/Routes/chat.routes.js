import { Router } from "express"
import ChatController from "../Controllers/chatController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import authentication from "../middlewares/authentication.middleware.js"

const router = Router()

router.get(
  "/conversations",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(ChatController.getConversations)
)

router.get(
  "/unread-count",
  authentication,
  asyncHandler(ChatController.getTotalUnreadCount)
)

export default router
