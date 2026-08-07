import { Router } from "express";
import { jwtVerifier, optionalJwtVerifier } from "../middleware/jwt.middleware.js";
import { createOrder, getAllOrders, getOrders, updateOrderStatus, getOrderById } from "../controllers/order.controller.js";
import { adminCheck } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/order.validator.js";

const orderRouter = Router()

// Protected routes requiring authentication
orderRouter.route('/create').post(jwtVerifier, validate(createOrderSchema), createOrder)
orderRouter.route('/get-orders').get(jwtVerifier, getOrders)

// Admin-specific routes
orderRouter.route('/get-all-orders').get(jwtVerifier, adminCheck, getAllOrders)
orderRouter.route('/update-status/:orderId').patch(jwtVerifier, adminCheck, validate(updateOrderStatusSchema), updateOrderStatus)

// Public detail route (guests or authenticated users can view by order ID)
// MUST BE AT THE BOTTOM so it doesn't match /get-all-orders, etc.
orderRouter.route('/:orderId').get(optionalJwtVerifier, getOrderById)

export {orderRouter}