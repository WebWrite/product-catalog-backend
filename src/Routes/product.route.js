import { Router } from "express";
import upload from "../middlewares/upload.js";
import { validateImageSignature } from "../middlewares/validate-image-signature.js";
import { bulkDeleteProductsSchema, createProductSchema, updateProductSchema, updateProductStockSchema } from "../validations/productValidation.js";
import { addProduct, bulkDeleteProducts, deleteProduct, getAllProducts, getProductById, getSellerProducts, updateProduct, updateProductStock } from "../Controllers/productController.js";
import authentication from "../middlewares/authentication.middleware.js";
import allowedRoles from "../middlewares/allowedRoles.js";
import validate from '../middlewares/validate.js'
import { asyncHandler } from "../utils/wrapasync.js";
import validateObjectId from "../middlewares/validateObjectId.js";


const router = Router();

router.post("/add-product", authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"), upload.single("image"),validateImageSignature(true),validate(createProductSchema),asyncHandler(addProduct));

router.get("/products",  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),asyncHandler(getSellerProducts));

router.delete("/delete-product/:id",  authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),asyncHandler(deleteProduct));

router.delete("/bulk-delete",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),validate(bulkDeleteProductsSchema),asyncHandler(bulkDeleteProducts));

router.patch("/update-stock/:id",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),validateObjectId,validate(updateProductStockSchema),asyncHandler(updateProductStock))

router.patch("/update-product/:id",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),validateObjectId,upload.single("image"),validateImageSignature(false),validate(updateProductSchema),asyncHandler(updateProduct));

//public
router.get("/", asyncHandler(getAllProducts));
router.get("/:id", asyncHandler(getProductById));

export default router;