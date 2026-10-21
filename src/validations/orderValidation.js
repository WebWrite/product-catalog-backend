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


  export const updateSellerOrderItemStatusSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  itemId: Joi.string().hex().length(24).required(),
  status: Joi.string()
    .valid("pending","confirmed", "processing", "shipped", "delivered", "cancelled")
    .required(),
}).required().unknown(false);

export const cancelOrderItemSchema = Joi.object({
  orderId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Order ID must be a valid MongoDB ObjectId.",
      "string.length": "Order ID must be exactly 24 characters long.",
      "any.required": "Order ID is required.",
      "string.empty": "Order ID cannot be empty.",
    }),

  itemId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "Order item ID must be a valid MongoDB ObjectId.",
      "string.length": "Order item ID must be exactly 24 characters long.",
      "any.required": "Order item ID is required.",
      "string.empty": "Order item ID cannot be empty.",
    }),
})
  .required()
  .unknown(false)
  .messages({
    "object.unknown": "Unexpected field is not allowed.",
    "object.base": "Request body must be a valid object.",
    "any.required": "Request body is required.",
  });