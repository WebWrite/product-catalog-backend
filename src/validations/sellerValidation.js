import Joi from "joi"
import { passwordSchema } from "./authValidation.js"

const STORE_TYPES = [
  "Clothing",
  "Electronics",
  "Beauty",
  "Furniture",
  "Sports",
  "Toys",
  "Food"
]

export const updateSellerSchema = Joi.object({
  storeName: Joi.string().trim().min(1).max(100).optional(),
  storeType: Joi.string().trim().max(100).allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  password: passwordSchema.optional(),
  name: Joi.string().trim().min(3).max(50).optional()
})
  .min(1)
  .options({ abortEarly: false, allowUnknown: false })

export const updateSellerProfileValidation = Joi.object({
  name: Joi.string().trim().min(3).max(50),

  storeName: Joi.string().trim().min(2).max(60),

  storeType: Joi.string().valid(...STORE_TYPES)
})
  .or("name", "storeName", "storeType")
  .unknown(false)

export const changeSellerPasswordValidation = Joi.object({
  newPassword: passwordSchema,

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
      "any.required": "Confirm password is required"
    })
}).unknown(false)

export const sellerActivityLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  target: Joi.string().trim().max(50).empty(""),

  search: Joi.string().trim().max(100).empty("")
}).unknown(false)
