import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import getRazorpay from "../utils/razorpay.js";
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendAdminNewOrderNotificationEmail } from "../utils/email.service.js";

// ─── Helper: generate a unique internal order ID ─────────────────────────────
const generateOrderId = () =>
    `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

// ─── Helper: validate shipping address ───────────────────────────────────────
const validateShippingAddress = (addr) => {
    if (!addr || !addr.street || !addr.city || !addr.state || !addr.zipCode || !addr.country || !addr.phone) {
        throw new ApiError(400, "Complete shipping address is required");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// [ONLINE] Step 1: Initiate — create a Razorpay order & a pending DB record
// POST /orders/initiate
// ─────────────────────────────────────────────────────────────────────────────
const initiateOrder = asyncHandler(async (req, res) => {
    if (!req.user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email address before placing an order.", [], "EMAIL_NOT_VERIFIED");
    }

    const { shippingAddress } = req.body;
    validateShippingAddress(shippingAddress);

    const user = await User.findById(req.user._id).populate("cart.product");

    if (!user || !user.cart || user.cart.length === 0) {
        throw new ApiError(400, "Your cart is empty");
    }

    // Calculate totals (stock NOT deducted yet — only on successful payment)
    let totalMRP = 0;
    let totalSellingPrice = 0;
    const orderItems = [];

    for (const item of user.cart) {
        const product = item.product;

        // Verify stock is available but don't deduct yet
        if (!product || product.stock < item.quantity) {
            throw new ApiError(400, `Product "${product?.name || 'Unknown'}" does not have enough stock available.`);
        }

        totalMRP += product.mrp * item.quantity;
        totalSellingPrice += product.sellingPrice * item.quantity;

        orderItems.push({
            product: product._id,
            name: product.name,
            image: product.images?.[0] || "",
            quantity: item.quantity,
            priceAtPurchase: product.sellingPrice
        });
    }

    // Online payment always has free shipping
    const shippingFee = 0;
    const finalTotal = totalSellingPrice + shippingFee;

    // Create the Razorpay order (amount in paise)
    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(finalTotal * 100), // paise
        currency: "INR",
        receipt: generateOrderId(),
        notes: {
            userId: String(req.user._id),
            userEmail: req.user.email,
        }
    });

    // Persist a pending DB order so we can verify against it later
    const orderId = razorpayOrder.receipt;

    const [order] = await Order.create([{
        user: req.user._id,
        orderId,
        orderItems,
        totalMRP,
        totalSellingPrice,
        shippingFee,
        finalTotal,
        shippingAddress,
        paymentMethod: "online",
        paymentStatus: "Pending",
        razorpayOrderId: razorpayOrder.id,
    }]);

    return res.status(201).json(new ApiResponse(201, {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,       // paise
        currency: razorpayOrder.currency,
        orderId: order.orderId,             // our internal ID
        dbOrderId: order._id,              // MongoDB _id
    }, "Order initiated. Proceed to payment."));
});

// ─────────────────────────────────────────────────────────────────────────────
// [ONLINE] Step 2: Verify — check HMAC, deduct stock, mark order Paid
// POST /orders/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyAndFinalizeOrder = asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // 1. Verify HMAC signature
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    if (expectedSignature !== razorpaySignature) {
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // 2. Find the pending order linked to this Razorpay order
    const order = await Order.findOne({
        razorpayOrderId,
        user: req.user._id,
        paymentStatus: "Pending"
    });

    if (!order) {
        throw new ApiError(404, "Order not found or already processed.");
    }

    // 3. Atomically deduct stock now that payment is confirmed
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of order.orderItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                {
                    $inc: {
                        stock: -item.quantity,
                        salesCount: item.quantity
                    }
                },
                { returnDocument: "after", session }
            );

            if (!updatedProduct) {
                throw new ApiError(400, `Insufficient stock for "${item.name}". Please contact support.`);
            }
        }

        // 4. Finalize the order
        order.paymentStatus = "Paid";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        order.transactionID = razorpayPaymentId;
        await order.save({ session, validateBeforeSave: false });

        // 5. Clear the user's cart
        await User.findByIdAndUpdate(req.user._id, { cart: [] }, { session });

        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }

    // 6. Asynchronously fire confirmation emails
    sendOrderConfirmationEmail({ order, user: req.user }).catch(err => {
        console.error(`[Email Service] Failed to send order confirmation email for #${order.orderId}:`, err);
    });
    sendAdminNewOrderNotificationEmail({ order, user: req.user }).catch(err => {
        console.error(`[Email Service] Failed to send admin new order notification email for #${order.orderId}:`, err);
    });

    return res.status(200).json(new ApiResponse(200, order, "Payment verified. Order confirmed."));
});

// ─────────────────────────────────────────────────────────────────────────────
// [COD] Create order directly (Cash on Delivery only)
// POST /orders/create
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
    if (!req.user.isEmailVerified) {
        throw new ApiError(403, "Please verify your email address before placing an order.", [], "EMAIL_NOT_VERIFIED");
    }

    const { shippingAddress } = req.body;
    validateShippingAddress(shippingAddress);

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

        const shippingFee = 50; // COD always has a ₹50 fee
        const finalTotal = totalSellingPrice + shippingFee;

        const orderId = generateOrderId();

        const [order] = await Order.create([{
            user: req.user._id,
            orderId,
            orderItems,
            totalMRP,
            totalSellingPrice,
            shippingFee,
            finalTotal,
            shippingAddress,
            paymentMethod: "cod",
            paymentStatus: "Pending"
        }], { session });

        user.cart = [];
        await user.save({ session, validateBeforeSave: false });

        await session.commitTransaction();
        session.endSession();

        // Asynchronously dispatch emails
        sendOrderConfirmationEmail({ order, user: req.user }).catch(err => {
            console.error(`[Email Service] Failed to send order confirmation email for #${order.orderId}:`, err);
        });
        sendAdminNewOrderNotificationEmail({ order, user: req.user }).catch(err => {
            console.error(`[Email Service] Failed to send admin new order notification email for #${order.orderId}:`, err);
        });

        return res
            .status(201)
            .json(new ApiResponse(201, order, "COD order created successfully."));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Get orders for the current user
// ─────────────────────────────────────────────────────────────────────────────
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    if (!orders) {
        throw new ApiError(404, "No orders found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Order history fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// Get all orders (admin)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Update order status (admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, message } = req.body;

    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).populate("user", "fullName email");
    }
    if (!order) {
        order = await Order.findOne({ orderId }).populate("user", "fullName email");
    }

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (message === undefined || message.trim() === "") {
        throw new ApiError(400, "A status message is mandatory for order updates.");
    }
    
    order.message = message.trim();

    if (status && status !== order.orderStatus) {
        if (order.orderStatus === "Delivered" && status !== "Delivered") {
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
    }

    await order.save({ validateBeforeSave: false });

    if (order.user && order.user.email) {
        sendOrderStatusEmail({ order, user: order.user, newStatus: order.orderStatus }).catch(err => {
            console.error(`[Email Service] Error sending order status update email for Order #${order.orderId}:`, err);
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order updated successfully`));
});

// ─────────────────────────────────────────────────────────────────────────────
// Get single order by ID (public / authenticated)
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    let order;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).populate("user", "fullName email avatar");
    }
    if (!order) {
        order = await Order.findOne({ orderId }).populate("user", "fullName email avatar");
    }

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

export { initiateOrder, verifyAndFinalizeOrder, createOrder, getOrders, getAllOrders, updateOrderStatus, getOrderById };