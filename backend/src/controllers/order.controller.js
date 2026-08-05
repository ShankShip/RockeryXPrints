import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../utils/email.service.js";

const createOrder = asyncHandler(async (req, res) => {
    if (!req.user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email address before placing an order.", [], "EMAIL_NOT_VERIFIED");
    }

    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country || !shippingAddress.phone) {
        throw new ApiError(400, "Complete shipping address is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.user._id).populate("cart.product").session(session);

        if (!user || !user.cart || user.cart.length === 0) {
            throw new ApiError(400, "Your cart is empty");
        }

        let totalMRP = 0;
        let totalSellingPrice = 0;
        const orderItems = [];

        for (const item of user.cart) {
            const product = item.product;

            // Atomic stock deduction check prevents overselling in high-concurrency environments
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: product._id, stock: { $gte: item.quantity } },
                {
                    $inc: {
                        stock: -item.quantity,
                        salesCount: item.quantity
                    }
                },
                { returnDocument: "after", session }
            );

            if (!updatedProduct) {
                throw new ApiError(400, `Product "${product.name}" does not have enough stock available.`);
            }

            totalMRP += updatedProduct.mrp * item.quantity;
            totalSellingPrice += updatedProduct.sellingPrice * item.quantity;

            orderItems.push({
                product: updatedProduct._id,
                name: updatedProduct.name,
                image: updatedProduct.images?.[0] || "",
                quantity: item.quantity,
                priceAtPurchase: updatedProduct.sellingPrice
            });
        }

        const shippingFee = paymentMethod === "cod" ? 50 : 0;
        const tax = Math.round(totalSellingPrice * 0.18);
        const finalTotal = totalSellingPrice + tax + shippingFee;

        const orderId = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

        const [order] = await Order.create([{
            user: req.user._id,
            orderId,
            orderItems,
            totalMRP,
            totalSellingPrice,
            tax,
            shippingFee,
            finalTotal,
            shippingAddress,
            paymentMethod: paymentMethod || "Online",
            paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid"
        }], { session });

        user.cart = [];
        await user.save({ session, validateBeforeSave: false });

        await session.commitTransaction();
        session.endSession();

        // Asynchronously dispatch order confirmation receipt email
        sendOrderConfirmationEmail({ order, user: req.user }).catch(err => {
            console.error(`[Email Service] Failed to send initial order confirmation email for #${order.orderId}:`, err);
        });

        return res
            .status(201)
            .json(new ApiResponse(201, order, "Order created successfully."));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Order history fetched successfully"));
});

const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .populate("user", "fullName email")
        .sort({ createdAt: -1 });

    let totalRevenue = 0;
    orders.forEach(order => {
        if (order.paymentStatus === "Paid") {
            totalRevenue += order.finalTotal;
        }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                totalOrders: orders.length,
                totalRevenue,
                orders
            }, "All orders fetched successfully")
        );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("user", "fullName email");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.orderStatus === "Delivered") {
        throw new ApiError(400, "You have already delivered this order");
    }

    // Restock inventory atomically if order is cancelled
    if (status === "Cancelled" && order.orderStatus !== "Cancelled") {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: {
                    stock: item.quantity,
                    salesCount: -item.quantity
                }
            });
        }
    } else if (order.orderStatus === "Cancelled" && status !== "Cancelled") {
        for (const item of order.orderItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                {
                    $inc: {
                        stock: -item.quantity,
                        salesCount: item.quantity
                    }
                },
                { returnDocument: true }
            );
            if (!updatedProduct) {
                throw new ApiError(400, `Cannot update order status. Product stock insufficient.`);
            }
        }
    }

    order.orderStatus = status;

    if (status === "Delivered") {
        order.deliveredAt = Date.now();
        if (order.paymentMethod === "cod") {
            order.paymentStatus = "Paid";
        }
    }

    await order.save({ validateBeforeSave: false });

    if (order.user && order.user.email) {
        sendOrderStatusEmail({ order, user: order.user, newStatus: status }).catch(err => {
            console.error(`[Email Service] Error sending order status update email for Order #${order.orderId}:`, err);
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order status updated to ${status}`));
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("user", "fullName email avatar");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const ownerIdStr = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const reqUserIdStr = req.user?._id ? req.user._id.toString() : '';

    if (ownerIdStr !== reqUserIdStr && req.user?.role !== 'admin') {
        throw new ApiError(403, "You are not authorized to view this order");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

const cancelMyOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to cancel this order");
    }

    if (order.orderStatus !== "Processing") {
        throw new ApiError(400, "Only orders in 'Processing' status can be cancelled");
    }

    for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: {
                stock: item.quantity,
                salesCount: -item.quantity
            }
        });
    }

    order.orderStatus = "Cancelled";
    await order.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

export { createOrder, getOrders, getAllOrders, updateOrderStatus, getOrderById, cancelMyOrder };