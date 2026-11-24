import { Router } from "express"
import ChatController from "../Controllers/chatController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import authentication from "../middlewares/authentication.middleware.js"
import upload from "../middlewares/upload.js"
import { validateImageSignature } from "../middlewares/validate-image-signature.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()

router.get(
  "/conversations",
  authLimiter(1, 60),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(ChatController.getConversations)
)

router.get(
  "/unread-count",
  authLimiter(1, 60),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(ChatController.getTotalUnreadCount)
)

router.post(
  "/upload",
  authLimiter(1, 30),
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  upload.single("image"),
  validateImageSignature(true),
  asyncHandler(ChatController.UploadAttachment)
)

export default router
