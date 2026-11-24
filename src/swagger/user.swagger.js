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
 * /api/v1/user:
 *   patch:
 *     tags: [User]
 *     summary: Update the authenticated user's profile
 *     description: Updates profile information. If the password is changed, the user is logged out from all active sockets and authentication cookies are cleared.
 *     security:
 *       - accessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *             example:
 *               name: John Doe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input or incorrect current password
 *       401:
 *         description: Authentication token is missing or invalid
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
