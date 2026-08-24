// src/utils/razorpay.js
// Returns the Razorpay SDK instance, initialised lazily on first use.
// This avoids the ESM top-level import ordering issue where env vars
// haven't been loaded yet when the module is first evaluated.
import Razorpay from 'razorpay';

let _instance = null;

const getRazorpay = () => {
    if (_instance) return _instance;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('[Razorpay] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables.');
    }

    _instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    return _instance;
};

export default getRazorpay;
