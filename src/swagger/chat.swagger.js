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
