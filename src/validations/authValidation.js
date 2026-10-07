import Joi from "joi";

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

    password: Joi.string()
        .min(6)
        .max(128)
        .required(),
});

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

    password: Joi.string()
        .min(6)
        .max(128)
        .required(),
    role: Joi.string()
        .required(),
    storeName: Joi.string()
        .required(),
    storeType: Joi.string()
       
});
