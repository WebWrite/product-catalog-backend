import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ERROR_MESSAGES } from "./constants/errorMessages.js";
import { HTTP_STATUS } from "./constants/statusCodes.js";
import errorHandler from "./middlewares/error.middleware.js";
import userRoutes from "./Routes/user.routes.js";
export const app = express();
const baseURL = "/api/v1";
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`${baseURL}/users`, userRoutes);
//page not found
app.use("/", (req, res, next) => {
  console.log(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    message: ERROR_MESSAGES.RESOURCE_NOT_FOUND
  });
});
//centralized error handling;
app.use(errorHandler);
