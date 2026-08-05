import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },

    refreshToken: [String],

    cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, min: 1, default: 1 }
        }
    ],

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    addresses: [{
        street: String,
        city: String,
        state: String,
        zipCode: Number,
        country: String,
        phone: String
    }],

    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOtp: {
        type: String,
        default: null
    },
    emailVerificationOtpExpiry: {
        type: Date,
        default: null
    },
    passwordChangeOtp: {
        type: String,
        default: null
    },
    passwordChangeOtpExpiry: {
        type: Date,
        default: null
    }
}, { timestamps: true })

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)