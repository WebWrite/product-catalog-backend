import Joi from "joi"
import { passwordSchema } from "./authValidation.js"

export const updateSellerSchema = Joi.object({
  storeName: Joi.string().trim().min(1).max(100).optional(),
  storeType: Joi.string().trim().max(100).allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
  password: passwordSchema.optional(),
  name: Joi.string().trim().min(3).max(50).optional()
})
  .min(1)
  .options({ abortEarly: false, allowUnknown: false })
