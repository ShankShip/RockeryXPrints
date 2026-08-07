// src/pages/CartPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ChevronDown } from 'lucide-react';
import { removeFromCart, clearCart, updateQuantity } from '../store/cartSlice';
import { createOrder } from '../services/api';

import Navbar from '../components/landing/Navbar';
import EmailVerificationModal from '../components/cart/EmailVerificationModal';
import { INDIAN_STATES } from '../utils/constants';

const spring = { type: 'spring', bounce: 0, duration: 0.3 };

const STEPS = ['CART', 'SHIP', 'CONFIRM'];

// Single form field
const Field = ({ label, id, type = 'text', value, onChange, required, placeholder }) => (
  <div>
    <label htmlFor={id} className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-black block mb-1">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      style={{ fontSize: '16px', paddingTop: '0.625rem', paddingBottom: '0.625rem', paddingLeft: 0, paddingRight: 0 }} /* prevent iOS zoom */
      className="input-brutal"
    />
  </div>
);

// Collapsible order summary for mobile
function MobileOrderSummary({ subtotal, mrpTotal, shippingFee, finalTotal }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden border-t-4 border-black bg-white sticky bottom-0 z-30 shadow-[0_-4px_0_0_#000]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 font-space font-bold uppercase text-xs bg-black text-white touch-manipulation"
      >
        <span>ORDER TOTAL</span>
        <div className="flex items-center gap-3">
          <span className="text-base font-black">₹{finalTotal.toLocaleString('en-IN')}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring}>
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-black text-white space-y-2 font-space text-xs border-t border-neutral-700">
              <div className="flex justify-between"><span className="text-neutral-400 uppercase">MRP</span><span className="line-through text-neutral-400">₹{mrpTotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400 uppercase">SUBTOTAL</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400 uppercase">SHIPPING</span><span className="font-bold">{shippingFee > 0 ? `₹${shippingFee}` : 'FREE'}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products: cartItems } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);

  const [step, setStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const [selectedAddressIdx, setSelectedAddressIdx] = useState('new');
  const [address, setAddress] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'INDIA', phone: '',
  });
  const setAddr = (field) => (e) => setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  // Checkout states
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Pre-fill address if user has saved addresses
  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      setSelectedAddressIdx(0);
      const saved = user.addresses[0];
      setAddress({
        street: saved.street || '',
        city: saved.city || '',
        state: saved.state || '',
        zipCode: saved.zipCode || '',
        country: saved.country || 'INDIA',
        phone: saved.phone || '',
      });
    } else {
      setSelectedAddressIdx('new');
    }
  }, [user]);

  const displayItems = cartItems;

  const subtotal  = displayItems.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0);
  const mrpTotal  = displayItems.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
  const shippingFee = paymentMethod === 'cod' ? 50 : 0;
  const finalTotal = subtotal + shippingFee;

  const handleProceedToShipping = () => {
    if (!user) {
      navigate('/auth?redirect=/cart');
    } else if (!user.isEmailVerified) {
      setShowVerificationModal(true);
    } else {
      setStep(1);
    }
  };

  const handleConfirm = () => {
    if (!user) {
      navigate('/auth?redirect=/cart');
      return;
    }
    if (!user.isEmailVerified) {
      setShowVerificationModal(true);
      return;
    }
    setSubmittingOrder(true);
    setOrderError('');
    createOrder({
      shippingAddress: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: Number(address.zipCode),
        country: 'INDIA',
        phone: address.phone
      },
      paymentMethod
    })
    .then((res) => {
      const order = res.data?.data;
      if (order) {
        setConfirmedOrder(order);
        dispatch(clearCart());
        setOrderPlaced(true);
      }
    })
    .catch((err) => {
      if (err.response?.status === 403 && err.response?.data?.errors === "EMAIL_NOT_VERIFIED") {
        setShowVerificationModal(true);
      } else {
        setOrderError(err.response?.data?.message || 'FAILED TO PLACE ORDER. PLEASE TRY AGAIN.');
      }
    })
    .finally(() => {
      setSubmittingOrder(false);
    });
  };

  /* ── ORDER CONFIRMED ── */
  if (orderPlaced) {
    return (
      <div className="min-h-dvh bg-black text-white flex flex-col items-center justify-center px-5 py-20 selection:bg-white selection:text-black">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring}
          className="text-center pt-20"
        >
          <div className="font-space text-[10px] md:text-xs uppercase tracking-[0.4em] text-neutral-400 mb-5">ORDER COMPLETED</div>
          <h1 className="font-inter font-black text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-none mb-7">
            ORDER<br />CONFIRMED
          </h1>
          <div className="border-2 border-white px-6 py-5 font-space text-xs md:text-sm text-neutral-300 leading-relaxed max-w-sm mx-auto mb-8">
            THANK YOU FOR YOUR PURCHASE!<br />
            {confirmedOrder?.orderId && (
              <span className="font-bold text-white block mt-1 uppercase tracking-wider">// ORDER ID: {confirmedOrder.orderId}</span>
            )}
            WE HAVE SENT YOUR RECEIPT AND SHIPPING DETAILS TO YOUR EMAIL ADDRESS.
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-black font-space font-bold uppercase text-sm px-7 py-4 border-2 border-white hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation"
          >
            VIEW ORDERS <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ── MAIN CART PAGE ── */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-dvh bg-white text-black selection:bg-black selection:text-white flex flex-col">
        <Navbar />
        <div className="pt-20 flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingBag size={48} className="mb-4 text-neutral-300" />
          <h2 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tighter mb-2">
            YOUR CART IS EMPTY
          </h2>
          <p className="font-space text-xs text-neutral-500 uppercase tracking-widest mb-6">
            YOUR SHOPPING CART IS CURRENTLY EMPTY.
          </p>
          <Link
            to="/shop"
            className="bg-black text-white font-space font-bold uppercase text-xs px-6 py-3.5 border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            GO TO SHOP
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-black selection:bg-black selection:text-white flex flex-col">
      <Navbar />
      <div className="pt-20 flex-1 flex flex-col">

        {/* Step bar */}
        <div className="border-b-4 border-black flex shrink-0">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 py-3 md:py-4 text-center font-space font-bold text-[9px] md:text-xs uppercase tracking-widest border-r-2 last:border-r-0 border-black transition-colors duration-75 ${
                i === step ? 'bg-black text-white' : i < step ? 'bg-neutral-100 text-neutral-400' : 'bg-white text-neutral-300'
              }`}
            >
              <span className="hidden sm:inline">[{i + 1}] </span>{s}
            </div>
          ))}
        </div>

        {/* Content + sidebar */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-12 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">

          {/* ── STEP CONTENT ── */}
          <AnimatePresence mode="wait">

            {/* STEP 0 — Cart */}
            {step === 0 && (
              <motion.div key="cart" initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 16, opacity: 0 }} transition={spring}>
                <h2 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-6">
                  YOUR<br />CART
                </h2>

                {displayItems.length === 0 ? (
                  <div className="border-4 border-black p-10 text-center">
                    <ShoppingBag size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="font-space text-sm uppercase tracking-wider text-neutral-400 mb-5">YOUR CART IS EMPTY</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-black text-white font-space font-bold uppercase text-xs px-6 py-3 border-2 border-black hover:bg-white hover:text-black transition-colors duration-75 touch-manipulation">
                      CONTINUE SHOPPING <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className="border-t-4 border-black divide-y-2 divide-black">
                    {displayItems.map((item) => (
                      <div key={item.product._id} className="flex gap-3 md:gap-5 py-5 items-start">
                        {/* Thumb */}
                        <div className="w-16 h-22 md:w-24 md:h-32 shrink-0 border-2 border-black bg-stripes-light flex items-center justify-center overflow-hidden" style={{height:'clamp(88px,22vw,128px)'}}>
                          {item.product.images && item.product.images[0] ? (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 md:w-8 md:h-8 bg-black opacity-20" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <span className="font-space text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">
                            {item.product.category?.name || 'PRINTS'}
                          </span>
                          <h3 className="font-inter font-black text-lg md:text-2xl uppercase tracking-tighter leading-tight mt-0.5">
                            {item.product.name}
                          </h3>
                          <p className="font-space text-[9px] md:text-xs text-neutral-400 mt-0.5 hidden sm:block">SKU: {item.product.sku}</p>
                          {/* Controls row */}
                          <div className="flex items-center gap-2 md:gap-3 mt-3">
                            <div className="flex items-center border-2 border-black">
                              <button
                                onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity - 1 }))}
                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border-r-2 border-black hover:bg-black hover:text-white transition-colors touch-manipulation cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-7 md:w-8 text-center font-space font-bold text-xs">{item.quantity}</span>
                              <button
                                onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity + 1 }))}
                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border-l-2 border-black hover:bg-black hover:text-white transition-colors touch-manipulation cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <button
                              onClick={() => dispatch(removeFromCart(item.product._id))}
                              className="font-space text-[9px] md:text-xs uppercase text-neutral-400 hover:text-black flex items-center gap-1 transition-colors touch-manipulation cursor-pointer"
                            >
                              <Trash2 size={11} />
                              <span className="hidden sm:inline">REMOVE</span>
                            </button>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="text-right shrink-0">
                          <div className="font-space font-black text-base md:text-xl text-black">
                            ₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}
                          </div>
                          {item.quantity > 1 && (
                            <div className="font-space text-[9px] md:text-xs text-neutral-400">
                              ₹{item.product.sellingPrice.toLocaleString('en-IN')} ea
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-5 mb-28 lg:mb-0">
                  <motion.button
                    onClick={handleProceedToShipping}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className="flex items-center gap-2 bg-black text-white font-space font-bold uppercase text-sm px-6 md:px-8 py-4 border-2 border-black shadow-solid hover:bg-white hover:text-black transition-colors duration-75 touch-manipulation w-full md:w-auto justify-center cursor-pointer"
                  >
                    PROCEED TO SHIPPING <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 1 — Shipping */}
            {step === 1 && (
              <motion.div key="shipping" initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 16, opacity: 0 }} transition={spring}>
                <h2 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-6">
                  SHIPPING<br />ADDRESS
                </h2>

                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-6">
                  
                  {/* Saved Address Chooser */}
                  {user?.addresses && user.addresses.length > 0 && (
                    <div className="mb-2">
                      <label className="font-space text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">
                        CHOOSE A SHIPPING ADDRESS:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {user.addresses.map((addr, idx) => {
                          const isSelected = selectedAddressIdx === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedAddressIdx(idx);
                                setAddress({
                                  street: addr.street || '',
                                  city: addr.city || '',
                                  state: addr.state || '',
                                  zipCode: addr.zipCode || '',
                                  country: addr.country || 'INDIA',
                                  phone: addr.phone || '',
                                });
                              }}
                              className={`border-2 p-4 cursor-pointer text-left font-space text-[10px] md:text-xs uppercase transition-colors duration-75 ${
                                isSelected ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-neutral-50'
                              }`}
                            >
                              <div className="font-bold flex items-center justify-between mb-2 pb-1 border-b border-dashed border-neutral-300">
                                <span>SAVED ADDRESS #{idx + 1}</span>
                                {isSelected && <span className="bg-white text-black border-2 border-white px-1.5 py-0.5 text-[8px] font-bold">SELECTED</span>}
                              </div>
                              <div className="leading-relaxed">
                                {addr.street}<br />
                                {addr.city}, {addr.state} — {addr.zipCode}<br />
                                {addr.country} {addr.phone && `· PHONE: ${addr.phone}`}
                              </div>
                            </div>
                          );
                        })}

                        {/* Option to use a custom address */}
                        <div
                          onClick={() => {
                            setSelectedAddressIdx('new');
                            setAddress({ street: '', city: '', state: '', zipCode: '', country: 'INDIA', phone: '' });
                          }}
                          className={`border-2 p-4 cursor-pointer text-left font-space text-[10px] md:text-xs uppercase flex flex-col justify-center items-center gap-1.5 transition-colors duration-75 min-h-24 ${
                            selectedAddressIdx === 'new' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-neutral-50'
                          }`}
                        >
                          <span className="font-black text-base">+</span>
                          <span className="font-bold">ADD NEW ADDRESS</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAddressIdx === 'new' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={spring}
                      className="space-y-6"
                    >
                      <Field label="STREET ADDRESS" id="street" value={address.street} onChange={setAddr('street')} required placeholder="44 BRUTALIST LANE" />

                      {/* Two-col on md+ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Field label="CITY *" id="city" value={address.city} onChange={setAddr('city')} required placeholder="NEW DELHI / MUMBAI" />
                        <div>
                          <label htmlFor="state" className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-black block mb-1">
                            STATE / UNION TERRITORY *
                          </label>
                          <select
                            id="state"
                            value={address.state}
                            onChange={setAddr('state')}
                            required
                            style={{ fontSize: '16px' }}
                            className="w-full bg-white border-2 border-black p-3 font-space text-xs font-bold uppercase focus:outline-none cursor-pointer"
                          >
                            <option value="">-- SELECT STATE IN INDIA --</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <Field label="ZIP / POSTAL CODE *" id="zip" value={address.zipCode} onChange={setAddr('zipCode')} required placeholder="110001" />
                        <div>
                          <label htmlFor="country" className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 block mb-1">
                            COUNTRY (NON-CHANGEABLE)
                          </label>
                          <input
                            id="country"
                            type="text"
                            value="INDIA"
                            disabled
                            style={{ fontSize: '16px' }}
                            className="w-full bg-neutral-200 text-neutral-600 border-2 border-neutral-400 p-3 font-space text-xs font-bold cursor-not-allowed select-none"
                          />
                        </div>
                      </div>

                      <Field label="PHONE NUMBER (REQUIRED) *" id="phone" type="tel" value={address.phone} onChange={setAddr('phone')} required placeholder="+91 98765 43210" />
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-2 mb-28 lg:mb-0">
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="btn-brutal bg-white text-black hover:bg-black hover:text-white px-6 py-4"
                    >
                      ← BACK
                    </button>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      className="btn-brutal flex-1 px-8 py-4 shadow-solid"
                    >
                      REVIEW ORDER <ArrowRight size={16} />
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Confirm */}
            {step === 2 && (
              <motion.div key="confirm" initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 16, opacity: 0 }} transition={spring}>
                <h2 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-6">
                  REVIEW &<br />CONFIRM
                </h2>

                <div className="border-2 border-black mb-5">
                  <div className="border-b-2 border-black px-4 py-3 font-space text-[10px] font-bold uppercase tracking-wider bg-neutral-100">
                    ORDER ITEMS
                  </div>
                  {displayItems.map((item) => (
                    <div key={item.product._id} className="flex justify-between items-center px-4 py-3 border-b border-neutral-200 font-space text-[10px] md:text-xs">
                      <span className="font-bold uppercase truncate mr-2">{item.product.name} <span className="text-neutral-400 font-normal">×{item.quantity}</span></span>
                      <span className="font-bold shrink-0">₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-black p-4 font-space text-[10px] md:text-xs mb-5">
                  <div className="font-bold uppercase tracking-wider mb-2 text-neutral-500">SHIPPING ADDRESS</div>
                  <div className="uppercase leading-relaxed text-[10px] md:text-xs">
                    {address.street || '44 BRUTALIST LANE'}, {address.city || 'NEW DELHI'}, {address.state || 'DELHI'} — {address.zipCode || '110001'}<br />
                    {address.country || 'INDIA'} · {address.phone || '+91 98765 43210'}
                  </div>
                </div>

                {/* Brutalist Payment Selector */}
                <div className="border-2 border-black p-4 font-space mb-6">
                  <div className="font-bold uppercase tracking-wider text-[10px] md:text-xs text-neutral-500 mb-3">SELECT PAYMENT METHOD</div>
                  <div className="flex flex-col gap-2">
                    <label className={`flex items-center justify-between p-3 border-2 border-black cursor-pointer transition-colors duration-75 text-xs font-bold uppercase ${paymentMethod === 'online' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="accent-black" />
                        ONLINE PAYMENT (FREE SHIPPING)
                      </span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </label>
                    <label className={`flex items-center justify-between p-3 border-2 border-black cursor-pointer transition-colors duration-75 text-xs font-bold uppercase ${paymentMethod === 'cod' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-50'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-black" />
                        CASH ON DELIVERY (+₹50 COD FEE)
                      </span>
                      <span>₹{(subtotal + 50).toLocaleString('en-IN')}</span>
                    </label>
                  </div>
                </div>

                {orderError && (
                  <div className="border-2 border-black bg-black text-white font-space font-bold text-xs uppercase p-4 mb-6 leading-relaxed">
                    ⚠ {orderError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 mb-28 lg:mb-0">
                  <button
                    onClick={() => setStep(1)}
                    disabled={submittingOrder}
                    className="flex items-center justify-center gap-2 bg-white text-black font-space font-bold uppercase text-sm px-6 py-4 border-2 border-black hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation cursor-pointer disabled:opacity-50"
                  >
                    ← BACK
                  </button>
                  <motion.button
                    onClick={handleConfirm}
                    disabled={submittingOrder}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className="flex-1 flex items-center justify-center gap-2 bg-black text-white font-space font-bold uppercase text-sm px-8 py-4 border-2 border-black shadow-solid hover:bg-white hover:text-black transition-colors duration-75 touch-manipulation cursor-pointer disabled:opacity-50"
                  >
                    {submittingOrder ? 'PLACING ORDER...' : <>PLACE ORDER <ArrowRight size={16} /></>}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DESKTOP ORDER SUMMARY ── */}
          <div className="hidden lg:block sticky top-25">
            <div className="border-4 border-black bg-black text-white p-6 shadow-[6px_6px_0px_0px_#666666]">
              <h3 className="font-inter font-black text-2xl uppercase tracking-tighter mb-6 pb-4 border-b-2 border-white">
                ORDER TOTAL
              </h3>
              <div className="space-y-3 font-space text-sm">
                <div className="flex justify-between"><span className="text-neutral-400 uppercase">MRP</span><span className="line-through text-neutral-400">₹{mrpTotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400 uppercase">SUBTOTAL</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400 uppercase">SHIPPING</span><span className="font-bold">{shippingFee > 0 ? `₹${shippingFee}` : 'FREE'}</span></div>
              </div>
              <div className="border-t-2 border-white mt-5 pt-5 flex justify-between items-baseline">
                <span className="font-space font-bold uppercase tracking-widest text-xs">FINAL TOTAL</span>
                <span className="font-space font-black text-3xl">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-5 font-space text-[10px] text-neutral-400 uppercase tracking-wider border-t border-neutral-700 pt-4">
                Secured payment · Free returns 7 days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <MobileOrderSummary subtotal={subtotal} mrpTotal={mrpTotal} shippingFee={shippingFee} finalTotal={finalTotal} />

      {/* Inline Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSuccess={() => {
          setShowVerificationModal(false);
          if (step === 0) setStep(1);
        }}
      />
    </div>
  );
}
