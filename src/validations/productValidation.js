import Joi from "joi"
import {
  DEFAULT_PRODUCT_SIZES,
  PRODUCT_CATEGORIES,
  PRODUCT_SIZES
} from "../constants/productConstants.js"

export const createProductSchema = Joi.object({
  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .required()
    .messages({
      "string.base": "Category must be a string.",
      "any.required": "Category is required.",
      "any.only": `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`
    }),

  name: Joi.string().trim().min(2).max(200).required().messages({
    "string.base": "Product name must be a string.",
    "string.empty": "Product name is required.",
    "string.min": "Product name must be at least 2 characters.",
    "string.max": "Product name cannot exceed 200 characters.",
    "any.required": "Product name is required."
  }),

  description: Joi.string().trim().min(10).max(5000).required().messages({
    "string.base": "Description must be a string.",
    "string.empty": "Description is required.",
    "string.min": "Description must be at least 10 characters.",
    "string.max": "Description cannot exceed 5000 characters.",
    "any.required": "Description is required."
  }),

  price: Joi.number().integer().min(1).max(1000000).required()
  .messages({
    "number.base": "Price must be a number.",
    "number.integer": "Price must be a whole number.",
    "number.min": "Price must be at least 1.",
    "number.max": "Price cannot exceed 1,000,000.",
    "any.required": "Price is required."
  }),

  sizes: Joi.array()
    .items(Joi.string().valid(...PRODUCT_SIZES))
    .unique()
    .default(DEFAULT_PRODUCT_SIZES)
    .messages({
      "array.base": "Sizes must be an array.",
      "any.only": `Each size must be one of: ${PRODUCT_SIZES.join(", ")}.`,
      "array.unique": "Duplicate sizes are not allowed."
    }),

  stock: Joi.number().integer().min(1).max(100000).required().messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be a whole number.",
    "number.min": "Stock cannot be negative.",
    "number.max": "Stock cannot exceed 100,000.",
    "any.required": "Stock is required."
  }),

  status: Joi.string().valid("active", "inactive").default("active").messages({
    "any.only": "Status must be active or inactive."
  })
}).unknown(false)

export const bulkDeleteProductsSchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .max(100)
    .unique()
    .required()
})

export const updateProductStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required().messages({
    "any.required": "Product stock is required.",
    "number.base": "Product stock must be a number.",
    "number.integer": "Product stock must be an integer.",
    "number.min": "Product stock cannot be negative."
  })
})

export const updateProductSchema = Joi.object({
  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .messages({
      "string.base": "Category must be a string.",
      "any.only": `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`
    }),

  name: Joi.string().trim().min(2).max(200).messages({
    "string.base": "Product name must be a string.",
    "string.empty": "Product name cannot be empty.",
    "string.min": "Product name must be at least 2 characters.",
    "string.max": "Product name cannot exceed 200 characters."
  }),

  description: Joi.string().trim().min(10).max(5000).messages({
    "string.base": "Description must be a string.",
    "string.empty": "Description cannot be empty.",
    "string.min": "Description must be at least 10 characters.",
    "string.max": "Description cannot exceed 5000 characters."
  }),

  price: Joi.number().min(1).max(1000000).integer().messages({
    "number.base": "Price must be a number.",
    "number.min": "Price must be greater than zero.",
    "number.max": "Price cannot exceed 1,000,000.",
    "number.precision": "Price cannot have more than 2 decimal places."
  }),

  sizes: Joi.array()
    .items(Joi.string().valid(...PRODUCT_SIZES))
    .unique()
    .messages({
      "array.base": "Sizes must be an array.",
      "any.only": `Each size must be one of: ${PRODUCT_SIZES.join(", ")}.`,
      "array.unique": "Duplicate sizes are not allowed."
    }),

  stock: Joi.number().integer().min(1).max(100000).messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be a whole number.",
    "number.min": "Stock cannot be negative.",
    "number.max": "Stock cannot exceed 100,000."
  }),

  status: Joi.string().valid("active", "inactive").messages({
    "any.only": "Status must be active or inactive."
  })
}).unknown(false)
