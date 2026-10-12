import { Router } from "express";
import upload from "../middlewares/upload.js";
import { validateImageSignature } from "../middlewares/validate-image-signature.js";
import { createProductSchema } from "../validations/productValidation.js";
import { addProduct, deleteProduct, getSellerProducts } from "../Controllers/productController.js";
import authentication from "../middlewares/authentication.middleware.js";
import allowedRoles from "../middlewares/allowedRoles.js";
import validate from '../middlewares/validate.js'
import { asyncHandler } from "../utils/wrapasync.js";
import validateObjectId from "../middlewares/validateObjectId.js";


const router = Router();

router.post("/add-product",  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"), upload.single("image"),validateImageSignature,validate(createProductSchema),addProduct);

router.get("/products",  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),asyncHandler(getSellerProducts));

router.delete("/delete-product/:id",  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),asyncHandler(deleteProduct));



export default router;