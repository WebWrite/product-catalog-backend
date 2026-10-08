import { ERROR_MESSAGES } from '../constants/errorMessages.js';
import { HTTP_STATUS } from '../constants/statusCodes.js';
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: `${ERROR_MESSAGES.VALIDATION_FAILED}`,
                errors: error.details.map((detail) => detail.message),
            });
        }

        req.body = value;

        next();
    };
};

export default validate;