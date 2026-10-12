import Joi from "joi"
import { objectIdValidation } from "../utils/idValidation.js"

export const addCart = Joi.object({
  productId: Joi.custom(objectIdValidation, "Object ID Validation").required(),
  quantity: Joi.number().min(1).max(25).required(),
  size: Joi.string().trim().min(1).required()
})
