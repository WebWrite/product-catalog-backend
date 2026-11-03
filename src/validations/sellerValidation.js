import Joi from "joi"

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
  storeName: Joi.string().trim().min(1).max(100),
  storeType: Joi.string().trim().max(100).allow(""),
  status: Joi.string().valid("active", "inactive")
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

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 128 characters",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    "any.required": "Password is required"
  })

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
