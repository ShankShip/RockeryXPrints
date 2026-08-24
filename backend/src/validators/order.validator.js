import { z } from 'zod';

// ─── Shipping address sub-schema (reused) ─────────────────────────────────────
const shippingAddressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.union([z.string(), z.number()]).transform((val) => String(val)),
    country: z.string().min(1, "Country is required"),
    phone: z.string().min(1, "Phone is required")
});

// ─── [ONLINE] Step 1: Initiate order ──────────────────────────────────────────
export const initiateOrderSchema = z.object({
    body: z.object({
        shippingAddress: shippingAddressSchema
    })
});

// ─── [ONLINE] Step 2: Verify Razorpay payment ─────────────────────────────────
export const verifyOrderSchema = z.object({
    body: z.object({
        razorpayOrderId: z.string().min(1, "razorpayOrderId is required"),
        razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
        razorpaySignature: z.string().min(1, "razorpaySignature is required"),
    })
});

// ─── [COD] Direct order creation ──────────────────────────────────────────────
export const createOrderSchema = z.object({
    body: z.object({
        paymentMethod: z.literal('cod'),
        shippingAddress: shippingAddressSchema
    })
});

// ─── Admin: update order status ───────────────────────────────────────────────
export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']),
        message: z.string().min(1, "Status update message is required")
    })
});
