import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderItems: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Product",
            required: true 
        },
        name: { 
            type: String, 
            required: true
        },
        image: {
            type: String, 
            required: true
        },
        quantity: { 
            type: Number, 
            required: true,
            min: 1 
        },
        priceAtPurchase: { 
            type: Number, 
            required: true
        }
    }],

    totalMRP: {
        type: Number,
        required: true
    },
    totalSellingPrice: {
        type: Number,
        required: true
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0
    },
    finalTotal: {
        type: Number,
        required: true
    },
    // Razorpay Integration Prep
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },

    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true }
    },
    
    paymentMethod: {
        type: String,
        required: true,
        default: "Online"
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    orderStatus: {
        type: String,
        enum: ["Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
        default: "Processing"
    },
    transactionID: {
        type: String,
        default: ""
    },

    deliveredAt: {
        type: Date
    },
    message: {
        type: String,
        default: ""
    }
}, { timestamps: true })

export const Order = mongoose.model("Order", orderSchema)