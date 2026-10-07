import Joi from "joi";


const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/)
    .required()
    .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password must not exceed 128 characters",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "any.required": "Password is required"
    })

export const signupSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: passwordSchema
}).options({ abortEarly: false, allowUnknown: false });

export const sellerSignUpSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: passwordSchema,
    role: Joi.string()
        .valid("user", "seller")
        .required(),
    storeName: Joi.string()
        .required(),
    storeType: Joi.string()

}).options({ abortEarly: false, allowUnknown: false });

export const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: Joi.string()
        .min(1)
        .max(128)
        .required()
}).options({
    abortEarly: false,
    allowUnknown: false
})
