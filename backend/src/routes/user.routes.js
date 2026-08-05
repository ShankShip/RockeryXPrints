import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { addToCart, changePassword, getCurrentUser, getUserCart, loginUser, logoutUser, refreshAccessToken, registerUser, removeFromCart, updateAccountDetails, updateAvatar, updateCartQuantity, sendVerificationOtp, verifyEmailOtp, sendPasswordChangeOtp, changePasswordWithOtp } from "../controllers/user.controller.js";
import { jwtVerifier, optionalJwtVerifier } from "../middleware/jwt.middleware.js";

const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
);

userRouter.route('/login').post(loginUser);

// Logout should always succeed regardless of whether token is valid or expired
userRouter.route('/logout').get(optionalJwtVerifier, logoutUser);
userRouter.route('/logout').post(optionalJwtVerifier, logoutUser);

userRouter.use(jwtVerifier);

userRouter.route('/change-password').post(changePassword);

userRouter.route('/refresh-token').post(refreshAccessToken);

userRouter.route('/current-user').get(getCurrentUser);

userRouter.route('/update-details').post(updateAccountDetails);

userRouter.route('/update-avatar').post(
    upload.fields([{
        name: "avatar",
        maxCount: 1
    }]),
    updateAvatar
);

userRouter.route('/cart').get(getUserCart);

userRouter.route('/add-cart').post(addToCart);

userRouter.route('/update-cart-qty').post(updateCartQuantity);

userRouter.route('/remove-cart/:productId').delete(removeFromCart);

userRouter.route('/send-verification-otp').post(sendVerificationOtp);

userRouter.route('/verify-otp').post(verifyEmailOtp);

userRouter.route('/send-password-change-otp').post(sendPasswordChangeOtp);

userRouter.route('/change-password-with-otp').post(changePasswordWithOtp);

export { userRouter };