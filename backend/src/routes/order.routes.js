import { Router } from "express";
import { jwtVerifier, optionalJwtVerifier } from "../middleware/jwt.middleware.js";
import { initiateOrder, verifyAndFinalizeOrder, createOrder, getAllOrders, getOrders, updateOrderStatus, getOrderById } from "../controllers/order.controller.js";
import { adminCheck } from "../middleware/admin.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { initiateOrderSchema, verifyOrderSchema, createOrderSchema, updateOrderStatusSchema } from "../validators/order.validator.js";

const orderRouter = Router();

// ─── Online Payment (Two-step Razorpay flow) ──────────────────────────────────
orderRouter.route('/initiate').post(jwtVerifier, validate(initiateOrderSchema), initiateOrder);
orderRouter.route('/verify').post(jwtVerifier, validate(verifyOrderSchema), verifyAndFinalizeOrder);

// ─── COD ──────────────────────────────────────────────────────────────────────
orderRouter.route('/create').post(jwtVerifier, validate(createOrderSchema), createOrder);

// ─── User order history ───────────────────────────────────────────────────────
orderRouter.route('/get-orders').get(jwtVerifier, getOrders);

// ─── Admin routes ─────────────────────────────────────────────────────────────
orderRouter.route('/get-all-orders').get(jwtVerifier, adminCheck, getAllOrders);
orderRouter.route('/update-status/:orderId').patch(jwtVerifier, adminCheck, validate(updateOrderStatusSchema), updateOrderStatus);

// ─── Public detail route — MUST be last so it doesn't swallow other routes ───
orderRouter.route('/:orderId').get(optionalJwtVerifier, getOrderById);

export { orderRouter };