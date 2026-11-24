/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *               items:
 *                 type: array
 *                 description: Optional guest cart items to merge after login
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *                     quantity: { type: number, minimum: 1, maximum: 25 }
 *                     size: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         description: Logged in successfully.
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     description: Invalidates the stored refresh token and clears authentication cookie.
 
 *
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *       401:
 *         description:  token is missing 
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Validates the refresh token and issues a new access and refresh token.
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token updated
 *       401:
 *         description:  token is missing
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/verify-email-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email using OTP
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: Invalid request or OTP
 *       404:
 *         description: User not found
 *       410:
 *         description: OTP expired
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/verify-login-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Login using OTP
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 example: "123456"
 *               items:
 *                 type: array
 *                 description: Optional guest cart items to merge after OTP login
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string, pattern: '^[a-fA-F0-9]{24}$' }
 *                     quantity: { type: number, minimum: 1, maximum: 25 }
 *                     size: { type: string, minLength: 1 }
 *     responses:
 *       201:
 *         description: OTP verified and user logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: HTTP-only access and refresh token cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Mateen
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *       400:
 *         description: Invalid request or OTP
 *       401:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/send-login-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Send login OTP
 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Login OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       403:
 *         description: Email is not verified
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/resend-email-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend OTP for email verification
 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email verification OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       403:
 *         description: Email is not verified
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/auth/register-customer:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: user1
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *     responses:
 *       200:
 *         description: User registered successfully
 */

/**
 * @swagger
 * /api/v1/auth/register-seller:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new seller
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - storeName
 *               - storeType
 *             properties:
 *               name:
 *                 type: string
 *                 example: user1
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user1@gmail.com
 *               password:
 *                 type: string
 *                 example: asd!9323
 *               role:
 *                  type: string
 *                  example: seller
 *               storeName:
 *                   type: string
 *                   example: store1
 *               storeType:
 *                   type: string
 *                   example: wholesale
 *     responses:
 *       200:
 *         description: User registered successfully
 */
