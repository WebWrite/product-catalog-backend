import Joi from "joi"
import { objectIdValidation } from "../utils/idValidation.js"

export const addCart = Joi.object({
  productId: Joi.custom(objectIdValidation, "Object ID Validation").required(),
  quantity: Joi.number().min(1).max(25).required(),
  size: Joi.string().trim().min(1).optional()
})

export const editCart = Joi.object({
  quantity: Joi.number().min(-25).max(25).required()
})

export const mergeCarts = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.custom(
        objectIdValidation,
        "Object ID Validation"
      ).required(),
      quantity: Joi.number().min(1).max(25).required(),
      size: Joi.string().trim().min(1).optional()
    })
  )
})
