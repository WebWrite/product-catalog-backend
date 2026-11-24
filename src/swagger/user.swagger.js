/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     tags: [User]
 *     summary: Get the authenticated user
 *     security:
 *       - accessToken: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Authentication token is missing or invalid
 */
