import { Router } from "express";
import allowedRoles from "../middlewares/allowedRoles.js";
import authentication from "../middlewares/authentication.middleware.js";
import validate from "../middlewares/validate.js";
import OrderController from "../Controllers/orderController.js";
import { cancelOrderItemSchema, createCodOrderSchema, updateSellerOrderItemStatusSchema } from "../validations/orderValidation.js";

const router = Router();

router.post("/orders/cod",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("customer"),validate(createCodOrderSchema),OrderController.createOrder);

router.get("/orders/my-orders", authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("customer"),OrderController.getMyOrdersController )

router.patch("/orders/cancel-item",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("customer"),validate(cancelOrderItemSchema),OrderController.cancelMyOrderItemController)


//seller orders
router.get("/seller/orders",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),OrderController.getMySellerOrdersController )
router.patch("/seller/orders/item-status",authentication("accessToken", process.env.ACCESS_TOKEN_SECRET_KEY),allowedRoles("seller"),validate(updateSellerOrderItemStatusSchema),OrderController.updateSellerOrderItemStatusController);
export default router;