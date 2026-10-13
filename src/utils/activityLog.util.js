import logger from "../config/logger.js";
import ActivityLog from "../models/AcitivtyLog.js";




export const logActivity = async ({userId,action,target,role,status = "success",message,requestId,metadata,}) => {
  const activity = {userId,action,target,role,status,message,requestId,metadata,};

  logger.info(message, activity);

  try {
    await ActivityLog.create(activity);
  } catch (error) {
    logger.error("Failed to save activity log", { action,requestId,error: error.message,});
  }
};
