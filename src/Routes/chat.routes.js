import { Router } from "express"
import ChatController from "../Controllers/chatController.js"
import { asyncHandler } from "../utils/wrapasync.js"
import authentication from "../middlewares/authentication.middleware.js"
import upload from "../middlewares/upload.js"
import { validateImageSignature } from "../middlewares/validate-image-signature.js"

const router = Router()

/**
 * @swagger
 * /api/v1/chat/conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Get the user's conversations
 *     security:
 *       - accessToken: []
 *     responses:
 *       200:
 *         description: User conversations
 */
router.get(
  "/conversations",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(ChatController.getConversations)
)

/**
 * @swagger
 * /api/v1/chat/unread-count:
 *   get:
 *     tags: [Chat]
 *     summary: Get the unread chat count
 *     security:
 *       - accessToken: []
 *     responses:
 *       200:
 *         description: Unread chat count
 */
router.get(
  "/unread-count",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  asyncHandler(ChatController.getTotalUnreadCount)
)

/**
 * @swagger
 * /api/v1/chat/upload:
 *   post:
 *     tags: [Chat]
 *     summary: Upload a chat attachment
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
 */
router.post(
  "/upload",
  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),
  upload.single("image"),
  validateImageSignature(true),
  asyncHandler(ChatController.UploadAttachment)
)

export default router
