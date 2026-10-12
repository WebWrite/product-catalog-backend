
import Joi from "joi";
import { PRODUCT_CATEGORIES } from "../constants/productConstants.js";

export const createProductSchema = Joi.object({
  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .required()
    .messages({
      "string.base": "Category must be a string.",
      "any.required": "Category is required.",
      "any.only": `Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}.`,
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      "string.base": "Product name must be a string.",
      "string.empty": "Product name is required.",
      "string.min": "Product name must be at least 2 characters.",
      "string.max": "Product name cannot exceed 200 characters.",
      "any.required": "Product name is required.",
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      "string.base": "Description must be a string.",
      "string.empty": "Description is required.",
      "string.min": "Description must be at least 10 characters.",
      "string.max": "Description cannot exceed 5000 characters.",
      "any.required": "Description is required.",
    }),

  price: Joi.number()
    .min(0.01)
    .max(1000000)
    .precision(2)
    .required()
    .messages({
      "number.base": "Price must be a number.",
      "number.min": "Price must be greater than zero.",
      "number.max": "Price cannot exceed 1,000,000.",
      "number.precision": "Price cannot have more than 2 decimal places.",
      "any.required": "Price is required.",
    }),

  sizes: Joi.array()
    .items(Joi.string().valid("S", "M", "L", "XL"))
    .unique()
    .default([])
    .messages({
      "array.base": "Sizes must be an array.",
      "any.only": "Each size must be one of: S, M, L, XL.",
      "array.unique": "Duplicate sizes are not allowed.",
    }),

  stock: Joi.number()
    .integer()
    .min(0)
    .max(100000)
    .required()
    .messages({
      "number.base": "Stock must be a number.",
      "number.integer": "Stock must be a whole number.",
      "number.min": "Stock cannot be negative.",
      "number.max": "Stock cannot exceed 100,000.",
      "any.required": "Stock is required.",
    }),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active")
    .messages({
      "any.only": "Status must be active or inactive.",
    }),
}).unknown(false);
