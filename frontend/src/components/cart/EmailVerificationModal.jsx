// src/components/cart/EmailVerificationModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { ShieldCheck, Mail, X, ArrowRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { sendVerificationOtpAPI, verifyEmailOtpAPI } from '../../services/api';
import { setUser, fetchCurrentUser } from '../../store/authSlice';

const spring = { type: 'spring', bounce: 0, duration: 0.25 };

export default function EmailVerificationModal({ isOpen, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState('idle'); // 'idle' | 'sent' | 'verified'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect for resending OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Automatically trigger sending OTP when modal opens for smooth UX
  useEffect(() => {
    if (isOpen && step === 'idle' && user && !user.isEmailVerified) {
      handleSendOtp();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await sendVerificationOtpAPI();
      setStep('sent');
      setSuccessMsg(`A 6-digit verification code has been sent to ${user?.email}`);
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await verifyEmailOtpAPI(otp.trim());
      setStep('verified');
      const updatedUser = res.data?.data;
      if (updatedUser) {
        dispatch(setUser(updatedUser));
      } else {
        dispatch(fetchCurrentUser());
      }
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs selection:bg-white selection:text-black">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 16 }}
        transition={spring}
        className="relative w-full max-w-md bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-hidden"
      >
        {/* Header Bar */}
        <div className="bg-black text-white px-5 py-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-white shrink-0" />
            <span className="font-space font-bold text-xs md:text-sm uppercase tracking-widest">
              // EMAIL VERIFICATION REQUIRED
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={loading || step === 'verified'}
            className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <h3 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tighter leading-tight mb-3">
            VERIFY YOUR<br />EMAIL ADDRESS
          </h3>

          <p className="font-space text-xs md:text-sm text-neutral-600 uppercase leading-relaxed mb-6">
            BEFORE PLACING AN ORDER, WE MUST VERIFY YOUR ACCOUNT TO PREVENT FRAUD AND ENSURE DELIVERY OF ORDER RECEIPT & SHIPPING UPDATES.
          </p>

          {/* User Email Box */}
          <div className="border-2 border-black p-3.5 bg-neutral-100 font-space text-xs md:text-sm font-bold flex items-center gap-3 mb-6">
            <Mail size={18} className="shrink-0 text-black" />
            <div className="truncate">
              <span className="text-[10px] uppercase block text-neutral-400 font-normal">REGISTERED EMAIL:</span>
              <span className="font-mono tracking-normal text-black">{user?.email || 'user@domain.com'}</span>
            </div>
          </div>

          {/* Status Notifications */}
          {error && (
            <div className="border-2 border-black bg-black text-white p-3.5 font-space font-bold text-xs uppercase mb-5 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && step !== 'verified' && (
            <div className="border-2 border-black bg-neutral-100 text-black p-3.5 font-space font-bold text-xs uppercase mb-5 flex items-start gap-2.5 leading-relaxed">
              <Mail size={16} className="shrink-0 text-green-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step content */}
          {step === 'verified' ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="border-4 border-black bg-black text-white p-6 text-center font-space uppercase"
            >
              <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
              <h4 className="text-xl font-black mb-1">VERIFICATION COMPLETE</h4>
              <p className="text-xs text-neutral-300">RETURNING TO CHECKOUT...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label htmlFor="otp-input" className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-black block mb-2">
                  ENTER 6-DIGIT VERIFICATION CODE
                </label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                  }}
                  disabled={loading}
                  placeholder="000000"
                  style={{ fontSize: '24px', letterSpacing: '0.4em' }}
                  className="w-full text-center font-mono font-black border-2 border-black p-3 focus:outline-none focus:bg-neutral-50 transition-colors uppercase disabled:bg-neutral-100"
                />
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white font-space font-bold uppercase text-sm py-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-white hover:text-black transition-colors duration-75 cursor-pointer disabled:opacity-40"
                >
                  {loading ? 'VERIFYING...' : <>VERIFY & CONTINUE <ArrowRight size={16} /></>}
                </motion.button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || cooldown > 0}
                  className="w-full flex items-center justify-center gap-2 bg-white text-neutral-600 hover:text-black font-space font-bold uppercase text-xs py-3 border-2 border-neutral-300 hover:border-black transition-colors cursor-pointer disabled:opacity-50 disabled:hover:border-neutral-300"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {cooldown > 0 ? `RESEND CODE IN ${cooldown}S` : 'RESEND CODE'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-dashed border-neutral-300 pt-4 text-center font-space text-[10px] text-neutral-400 uppercase tracking-wider">
            CAN'T FIND THE EMAIL? PLEASE CHECK YOUR SPAM / JUNK FOLDER.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
