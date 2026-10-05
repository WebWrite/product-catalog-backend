import { Router } from "express";
import UserController from "../Controllers/UserController.js";
const router = Router();
router.post("/", UserController.registerUser);
export default router;
