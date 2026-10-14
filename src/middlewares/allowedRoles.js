import { HTTP_STATUS } from "../constants/statusCodes.js";

const allowedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "You are not authorized to perform this action.",
      });
    }

    next();
  };
};

export default allowedRoles;
