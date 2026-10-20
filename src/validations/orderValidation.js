import Joi from "joi"

const shippingAddressSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Enter a 10-digit Pakistani mobile number without +92.",
    }),

  address: Joi.string().trim().min(5).max(500).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  postalCode: Joi.string().trim().min(2).max(20).required(),
})
  .required()
  .unknown(false)

export const createCodOrderSchema = Joi.object({
  shippingAddress: shippingAddressSchema,
})
  .required()
  .unknown(false)