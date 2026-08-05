import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/product.model.js";
import crypto from "crypto";
import { sendOtpEmail, sendPasswordChangeOtpEmail } from "../utils/email.service.js";

const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
}

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        if (user.refreshToken.length >= 5) {
            user.refreshToken.shift() // Drop oldest session token
        }
        user.refreshToken.push(refreshToken)
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {email, fullName, password} = req.body

    if (!email?.trim() || !fullName?.trim() || !password?.trim()) {
        throw new ApiError(400, "User credentials are missing")
    }

    const existedUser = await User.findOne({email})

    if (existedUser) {
        throw new ApiError(400, "User exists with this Email")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path

    let avatar = ""

    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath)
    }

    if (!avatar && avatarLocalPath) {
        console.log("Error uploading Avatar.")
    }

    const user = await User.create({
        email,
        fullName,
        password,
        avatar: avatar ? avatar.url : "",
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error while registering the user.")
    }

    const {accessToken, refreshToken} = await generateToken(user._id)

    return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(201, {
        user: createdUser,
        accessToken,
        refreshToken
    }, "User registered successfully!!"))
})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if (!email || !password) {
        throw new ApiError(400, "Enter User credentials.")
    }

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "Email is not registered.")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid User credentials")
    }

    const {accessToken, refreshToken} = await generateToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken
    }, "User logged in Successfully"))
})

const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $pull: {
                    refreshToken: refreshToken
                }
            }
        ).catch(() => {});
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const changePassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Enter password")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Enter correct password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(400, "User is not authenticated.")
    }
    
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token.")
        }
    
        const isRefreshTokenValid = user.refreshToken.some((item) => item === incomingRefreshToken)
    
        if (!isRefreshTokenValid) {
            throw new ApiError(401, "Refresh Token have been expired.")
        }

        await User.findByIdAndUpdate(user._id, {
            $pull: { refreshToken: incomingRefreshToken }
        })
    
        const {accessToken, refreshToken} = await generateToken(user?._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, {accessToken, refreshToken}, "Tokens have been refreshed."))
    } catch (error) {
        throw new ApiError(400, error || "Error occurred while refreshing tokens")
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    let {email, fullName, addresses} = req.body

    if (!email && !fullName && !addresses) {
        throw new ApiError(400, "Enter a valid credential")
    }

    const updateFields = {};
    if (email) updateFields.email = email;
    if (fullName) updateFields.fullName = fullName;
    if (addresses) updateFields.addresses = addresses;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateFields
        },
        {
            returnDocument: 'after'
        }
    ).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(500, "Internal Error Occurred.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated."))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Upload avatar file.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar.")
    }

    await deleteOnCloudinary(req.user?.avatar)

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200, "Avatar file uploaded successfully."))
})

const getUserCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).populate(
        "cart.product", 
        "name sellingPrice mrp images slug stock"
    )

    return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Cart fetched successfully"));
})

const addToCart = asyncHandler(async (req, res) => {
    const {productId, quantity = 1} = req.body

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.stock < quantity) {
        throw new ApiError(400, "Not enough stock available");
    }

    const user = await User.findById(req.user._id);

    const existingCartItemIndex = user.cart.findIndex((item) => item.product.toString() === productId.toString())

    if (existingCartItemIndex > -1) {
        user.cart[existingCartItemIndex].quantity += Number(quantity);
        
        if (user.cart[existingCartItemIndex].quantity > product.stock) {
            user.cart[existingCartItemIndex].quantity = product.stock;
        }
    } else {
        user.cart.push({ product: productId, quantity: Number(quantity) });
    }

    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Item added to cart"));
})

const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $pull: { cart: { product: productId } }
        },
        { 
            returnDocument: 'after'
        }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user.cart, "Item removed from cart"));
})

const updateCartQuantity = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productId || qty === undefined || qty < 0) {
        throw new ApiError(400, "Invalid product or quantity");
    }

    const user = await User.findById(req.user._id);
    const existingCartItemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId.toString()
    );

    if (existingCartItemIndex > -1) {
        if (qty === 0) {
            user.cart.splice(existingCartItemIndex, 1);
        } else {
            const product = await Product.findById(productId);
            if (!product) {
                throw new ApiError(404, "Product not found");
            }
            user.cart[existingCartItemIndex].quantity = Math.min(qty, product.stock);
        }
    } else if (qty > 0) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new ApiError(404, "Product not found");
        }
        user.cart.push({ product: productId, quantity: Math.min(qty, product.stock) });
    }

    await user.save({ validateBeforeSave: false });
    
    // Fetch populated cart to return
    const populatedUser = await User.findById(req.user._id).populate(
        "cart.product",
        "name sellingPrice mrp images slug stock"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, populatedUser.cart, "Cart quantity updated"));
});

const sendVerificationOtp = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Your email address is already verified.");
    }

    // Generate cryptographically secure 6-digit random code
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Set expiry to 15 minutes from now
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send email via Brevo service
    const emailSent = await sendOtpEmail({
        to: user.email,
        name: user.fullName,
        otp
    });

    // Even if BREVO_API_KEY is not configured in dev, print OTP to server console for testing convenience
    if (!emailSent) {
        console.log(`[Dev Mode / OTP Notice] Email Verification OTP for ${user.email}: ${otp}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Verification OTP has been sent to your email address."));
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp || !otp.trim()) {
        throw new ApiError(400, "Please provide the verification code.");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        const updatedUser = await User.findById(user._id).select("-password -refreshToken");
        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, "Your email is already verified."));
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpiry) {
        throw new ApiError(400, "No verification OTP found. Please click 'Send OTP' to generate a new code.");
    }

    if (new Date() > new Date(user.emailVerificationOtpExpiry)) {
        user.emailVerificationOtp = null;
        user.emailVerificationOtpExpiry = null;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(400, "Verification code has expired. Please click 'Send OTP' again.");
    }

    if (user.emailVerificationOtp !== otp.trim()) {
        throw new ApiError(400, "Invalid verification code. Please check and try again.");
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpiry = null;
    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Email verified successfully!"));
});

const sendPasswordChangeOtp = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(400, "You must verify your email address before changing password via OTP.");
    }

    // Generate secure 6-digit code
    const otp = crypto.randomInt(100000, 1000000).toString();

    user.passwordChangeOtp = otp;
    user.passwordChangeOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendPasswordChangeOtpEmail({
        to: user.email,
        name: user.fullName,
        otp
    });

    if (!emailSent) {
        console.log(`[Dev Mode / OTP Notice] Password Change OTP for ${user.email}: ${otp}`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Authorization code has been sent to your registered email address."));
});

const changePasswordWithOtp = asyncHandler(async (req, res) => {
    const { otp, newPassword } = req.body;

    if (!otp || !otp.trim()) {
        throw new ApiError(400, "Please provide the authorization code.");
    }

    if (!newPassword || newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters long.");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(400, "Your email address must be verified to change password via OTP.");
    }

    if (!user.passwordChangeOtp || !user.passwordChangeOtpExpiry) {
        throw new ApiError(400, "No password authorization code found. Please click resend to generate a new code.");
    }

    if (new Date() > new Date(user.passwordChangeOtpExpiry)) {
        user.passwordChangeOtp = null;
        user.passwordChangeOtpExpiry = null;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(400, "Authorization code has expired. Please request a new code.");
    }

    if (user.passwordChangeOtp !== otp.trim()) {
        throw new ApiError(400, "Invalid authorization code. Please check and try again.");
    }

    // Update password (pre-save hook hashes the new password)
    user.password = newPassword;
    user.passwordChangeOtp = null;
    user.passwordChangeOtpExpiry = null;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Password changed successfully!"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    refreshAccessToken,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    getUserCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    sendVerificationOtp,
    verifyEmailOtp,
    sendPasswordChangeOtp,
    changePasswordWithOtp
}