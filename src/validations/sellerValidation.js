import Joi from "joi"

export const updateSellerSchema = Joi.object({
  storeName: Joi.string().trim().min(1).max(100),
  storeType: Joi.string().trim().max(100).allow(""),
  status: Joi.string().valid("active", "blocked", "suspended")
})
  .min(1)
  .options({ abortEarly: false, allowUnknown: false })
