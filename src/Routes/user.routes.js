import { Router } from "express"
import UserController from "../Controllers/UserController.js"
import validate from "../middlewares/validate.js"
import { sellerSignUpSchema, signupSchema } from "../validations/authValidation.js"
import authLimiter from "../middlewares/rateLimiting.js"

const router = Router()

/**
 * @openapi
 * /api/v1/users:
 *   post:
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

router.post("/", validate(signupSchema), authLimiter, UserController.registerUser)
/**
 * @openapi
 * /api/v1/users/register-seller:
 *   post:
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

router.post("/register-seller", validate(sellerSignUpSchema), authLimiter, UserController.registerSeller)

export default router
