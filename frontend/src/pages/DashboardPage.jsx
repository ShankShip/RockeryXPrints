// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Settings, LogOut, ChevronRight, ChevronDown, User, Shield, Check, Edit2, Upload, ShieldCheck, Lock, MapPin, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { logoutThunk, setUser } from '../store/authSlice';
import { updateDetails, changePassword, getOrders, getAllOrdersAPI, updateAvatarAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import Popup from '../components/landing/Popup';
import { SkeletonRow } from '../components/common/Skeleton';
import EmailVerificationModal from '../components/cart/EmailVerificationModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import { INDIAN_STATES } from '../utils/constants';
import { renderTextWithLinks } from '../utils/formatters';


const spring = { type: 'spring', bounce: 0, duration: 0.25 };

const STATUS_STYLES = {
  'Processing': 'border-neutral-400 text-neutral-500 bg-white',
  'Shipped': 'border-black text-black bg-neutral-100',
  'Out for Delivery': 'border-black text-white bg-neutral-700',
  'Delivered': 'border-black text-white bg-black',
  'Cancelled': 'border-neutral-300 text-neutral-400 line-through bg-white',
};

const PAYMENT_STYLES = {
  'Paid': 'text-black font-bold',
  'Pending': 'text-neutral-500',
  'Failed': 'text-neutral-400 line-through',
  'Refunded': 'text-neutral-400',
};

const STATUS_OPTIONS = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const getDefaultMessageForStatus = (status) => {
  switch (status) {
    case 'Processing':
      return "Your order has been confirmed and is currently being processed by our team. We will notify you once it has been shipped.";
    case 'Shipped':
      return "Your order has been shipped and is on its way to you! You can track your package using the provided tracking details.";
    case 'Out for Delivery':
      return "Good news! Your order is out for delivery today. Please ensure someone is available to receive the package.";
    case 'Delivered':
      return "Your order has been successfully delivered. Thank you for shopping with us!";
    case 'Cancelled':
      return "Your order has been cancelled. If you have any questions, please contact our support team.";
    default:
      return "Your order status has been updated.";
  }
};

/* ── Order card for mobile view ── */
function OrderCard({ order, idx, isAdmin }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: idx * 0.05 }}
      className="border-2 border-black bg-white"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation"
      >
        <div>
          <div className="font-space font-black text-xs uppercase">{order.orderId || `ORDER-${order._id.slice(-6)}`}</div>
          <div className="font-space text-[9px] text-neutral-500 mt-0.5 uppercase">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-space text-[9px] font-bold border-2 px-1.5 py-0.5 uppercase ${STATUS_STYLES[order.orderStatus] || ''}`}>
            {order.orderStatus}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring}>
            <ChevronDown size={14} />
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
            className="overflow-hidden border-t-2 border-black"
          >
            <div className="px-4 py-4 bg-neutral-50 space-y-3 font-space text-[10px] uppercase">
              {/* Buyer info (only for admin) */}
              {isAdmin && order.user && (
                <div className="border-b border-neutral-300 pb-2 mb-2">
                  <span className="text-neutral-400 font-bold block">BUYER:</span>
                  <span className="font-black text-black">{order.user.fullName || 'UNKNOWN'} ({order.user.email})</span>
                </div>
              )}

              {/* Order Message if present */}
              {order.message && !isAdmin && (
                <div className="border-2 border-black bg-yellow-50 p-2.5">
                  <span className="font-mono text-black normal-case block leading-tight whitespace-pre-wrap break-words">{renderTextWithLinks(order.message)}</span>
                </div>
              )}

              {/* Items */}
              <div className="space-y-1">
                <span className="text-neutral-400 font-bold block">ITEMS:</span>
                {order.orderItems.map((i) => (
                  <div key={i.name} className="flex justify-between font-bold text-black">
                    <span>{i.name} ×{i.quantity}</span>
                    <span>₹{(i.priceAtPurchase * i.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="pt-2 border-t border-neutral-200">
                <span className="text-neutral-400 font-bold block">SHIPPING COORDINATES:</span>
                <span className="text-neutral-600 block text-[9px] normal-case leading-relaxed">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode} ({order.shippingAddress?.country})
                </span>
              </div>

              {/* Total & Payment details */}
              <div className="border-t border-neutral-300 pt-2 flex justify-between font-black text-sm">
                <span>TOTAL</span>
                <span>₹{order.finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>PAYMENT METHOD</span>
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>STATUS</span>
                <span className={PAYMENT_STYLES[order.paymentStatus]}>{order.paymentStatus.toUpperCase()}</span>
              </div>
              <div className="pt-3 border-t border-neutral-300">
                <Link
                  to={`/orders/${order._id}`}
                  className="w-full flex items-center justify-center gap-1.5 bg-black text-white font-space font-bold uppercase text-[10px] py-2 border-2 border-black hover:bg-white hover:text-black transition-colors duration-75"
                >
                  VIEW FULL ORDER & DETAILS <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── User Orders Tab ── */
function OrdersTab({ orders, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter leading-none mb-4">ORDER HISTORY</h2>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter leading-none">
          ORDER<br />HISTORY
        </h2>
        <span className="font-space text-xs text-neutral-500 uppercase tracking-wider border-2 border-black px-3 py-1 bg-neutral-100">
          {orders.length} ORDERS
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="border-4 border-black p-12 text-center bg-white">
          <Package size={44} className="mx-auto mb-4 opacity-20" />
          <p className="font-space text-sm uppercase tracking-wider text-neutral-400 mb-6">NO ORDERS YET</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-black text-white font-space font-bold uppercase text-xs px-6 py-3 border-2 border-black hover:bg-white hover:text-black transition-colors duration-75 touch-manipulation">
            BROWSE INVENTORY <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-2">
            {orders.map((o, i) => <OrderCard key={o._id} order={o} idx={i} />)}
          </div>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto border-2 border-black bg-white">
            <table className="w-full border-collapse font-space text-xs">
              <thead>
                <tr className="bg-black text-white border-b-2 border-black">
                  {['ORDER ID', 'DATE', 'ITEMS', 'STATUS', 'PAYMENT', 'TOTAL'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left font-bold uppercase tracking-widest border-r border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {orders.map((order, idx) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: idx * 0.05 }}
                    className="hover:bg-neutral-50 transition-colors duration-75"
                  >
                    <td className="px-4 py-4 border-r-2 border-black font-bold">
                      <Link to={`/orders/${order._id}`} className="hover:underline hover:text-neutral-600 transition-colors">
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black text-neutral-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black">
                      {order.orderItems.map((i) => (
                        <div key={i.name} className="whitespace-nowrap">{i.name} ×{i.quantity}</div>
                      ))}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black">
                      <span className={`inline-block border-2 px-2 py-0.5 uppercase tracking-wider font-bold ${STATUS_STYLES[order.orderStatus] || ''}`}>
                        [ {order.orderStatus.toUpperCase()} ]
                      </span>
                    </td>
                    <td className={`px-4 py-4 border-r-2 border-black uppercase ${PAYMENT_STYLES[order.paymentStatus] || ''}`}>
                      {order.paymentStatus}
                    </td>
                    <td className="px-4 py-4 font-black text-sm">₹{order.finalTotal.toLocaleString('en-IN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Admin Orders Tab ── */
function AdminOrdersTab({ allOrders, loading }) {
  const [statusFilter, setStatusFilter] = useState('all');

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter leading-none mb-4">ALL SYSTEM ORDERS</h2>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  const filteredOrders = statusFilter === 'all'
    ? allOrders
    : allOrders.filter(o => o.orderStatus === statusFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter leading-none">
            SYSTEM<br />ORDERS
          </h2>
        </div>
        
        {/* Brutalist Filter Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-space text-[10px] font-black uppercase text-neutral-400">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-2 border-black bg-white font-space text-[10px] font-bold px-2 py-1.5 focus:outline-none focus:ring-0 focus:border-black cursor-pointer uppercase"
          >
            <option value="all">ALL STATUSES ({allOrders.length})</option>
            {STATUS_OPTIONS.map((opt) => {
              const count = allOrders.filter(o => o.orderStatus === opt).length;
              return (
                <option key={opt} value={opt}>{opt.toUpperCase()} ({count})</option>
              );
            })}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="border-4 border-black p-12 text-center bg-white">
          <Shield size={44} className="mx-auto mb-4 opacity-20" />
          <p className="font-space text-sm uppercase tracking-wider text-neutral-400">NO MATCHING ORDERS FOUND</p>
        </div>
      ) : (
        <>
          {/* Mobile view */}
          <div className="md:hidden flex flex-col gap-2">
            {filteredOrders.map((o, i) => (
              <OrderCard key={o._id} order={o} idx={i} isAdmin />
            ))}
          </div>

          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto border-2 border-black bg-white">
            <table className="w-full border-collapse font-space text-xs">
              <thead>
                <tr className="bg-black text-white border-b-2 border-black">
                  {['ORDER ID', 'BUYER', 'DATE', 'ITEMS', 'PAYMENT', 'STATUS', 'TOTAL'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-widest border-r border-neutral-700 last:border-r-0 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {filteredOrders.map((order, idx) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: idx * 0.04 }}
                    className="hover:bg-neutral-50 transition-colors duration-75"
                  >
                    <td className="px-4 py-4 border-r-2 border-black font-bold">
                      <Link to={`/orders/${order._id}`} className="hover:underline hover:text-neutral-600 transition-colors">
                        {order.orderId || order._id.slice(-6)}
                      </Link>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black">
                      <div className="font-bold">{order.user?.fullName || 'GUEST'}</div>
                      <div className="text-[10px] text-neutral-500 lowercase">{order.user?.email}</div>
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black text-neutral-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black">
                      {order.orderItems.map((i) => (
                        <div key={i.name} className="whitespace-nowrap">{i.name} ×{i.quantity}</div>
                      ))}
                    </td>
                    <td className={`px-4 py-4 border-r-2 border-black uppercase ${PAYMENT_STYLES[order.paymentStatus] || ''}`}>
                      {order.paymentStatus}
                    </td>
                    <td className="px-4 py-4 border-r-2 border-black">
                      <span className={`inline-block border-2 px-2 py-0.5 uppercase tracking-wider font-bold ${STATUS_STYLES[order.orderStatus] || ''}`}>
                        [ {order.orderStatus} ]
                      </span>
                    </td>
                    <td className="px-4 py-4 font-black text-sm">₹{order.finalTotal.toLocaleString('en-IN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}

/* ── Profile View Tab ── */
function ProfileTab({ user, onUpdateDetails }) {
  const [activeSection, setActiveSection] = useState(null); // 'name' | 'address' | null
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Name & Avatar state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarFile, setAvatarFile] = useState(null);

  // Address state
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Staged addresses list
  const [addressesList, setAddressesList] = useState(user?.addresses || []);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset fields on user change
  useEffect(() => {
    setFullName(user?.fullName || '');
    setAddressesList(user?.addresses || []);
    setEditingAddressIdx(null);
  }, [user]);

  const toggleSection = (section) => {
    setError('');
    setSuccess('');
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  // Address Handlers
  const handleRemoveAddressLocally = async (indexToRemove) => {
    const updatedList = addressesList.filter((_, idx) => idx !== indexToRemove);
    setAddressesList(updatedList);
    if (editingAddressIdx === indexToRemove) {
      setEditingAddressIdx(null);
      setStreet(''); setCity(''); setState(''); setZipCode(''); setPhone('');
    }
    try {
      setSubmitting(true);
      const res = await updateDetails({ fullName: user.fullName, addresses: updatedList });
      if (res.data?.data) onUpdateDetails({ ...user, ...res.data.data });
      setSuccess('ADDRESS REMOVED FROM PROFILE.');
    } catch (err) {
      setError('FAILED TO UPDATE ADDRESSES ON SERVER.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAddressLocally = (idx) => {
    const addr = addressesList[idx];
    setStreet(addr.street || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setZipCode(addr.zipCode || '');
    setPhone(addr.phone || '');
    setEditingAddressIdx(idx);
    setError('');
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!street.trim() || !city.trim() || !state || !zipCode || !phone.trim()) {
      setError('ADDRESS REQUIRES STREET, CITY, STATE, ZIPCODE, AND PHONE NUMBER.');
      return;
    }
    const newAddress = { street: street.trim(), city: city.trim(), state: state.trim(), zipCode: Number(zipCode), country: 'INDIA', phone: phone.trim() };
    
    let updatedList;
    if (editingAddressIdx !== null) {
      updatedList = [...addressesList];
      updatedList[editingAddressIdx] = newAddress;
    } else {
      updatedList = [...addressesList, newAddress];
    }
    
    setSubmitting(true);
    try {
      const res = await updateDetails({ fullName: user.fullName, addresses: updatedList });
      if (res.data?.data) {
        onUpdateDetails({ ...user, ...res.data.data });
      }
      setAddressesList(updatedList);
      setEditingAddressIdx(null);
      setStreet(''); setCity(''); setState(''); setZipCode(''); setPhone('');
      setSuccess(editingAddressIdx !== null ? 'ADDRESS UPDATED SUCCESSFULLY.' : 'NEW ADDRESS ADDED SUCCESSFULLY.');
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO SAVE ADDRESS.');
    } finally {
      setSubmitting(false);
    }
  };

  // Name & Avatar Handlers
  const handleSaveName = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim()) {
      setError('FULL NAME CANNOT BE EMPTY.');
      return;
    }

    setSubmitting(true);
    let updatedUser = { ...user };
    try {
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append('avatar', avatarFile);
        const avatarRes = await updateAvatarAPI(avatarData);
        if (avatarRes.data?.data) {
          updatedUser = { ...updatedUser, ...avatarRes.data.data };
        }
      }
      if (fullName.trim() !== user.fullName) {
        const detailsRes = await updateDetails({ fullName: fullName.trim(), addresses: user.addresses });
        if (detailsRes.data?.data) {
          updatedUser = { ...updatedUser, ...detailsRes.data.data };
        }
      }
      onUpdateDetails(updatedUser);
      setSuccess('PROFILE DETAILS UPDATED SUCCESSFULLY.');
      setActiveSection(null);
      setAvatarFile(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO UPDATE PROFILE DETAILS.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Tab Header bar */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter leading-none">
            USER<br />PROFILE
          </h2>
          <p className="font-space text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest mt-1">
            ACCOUNT DETAILS & SECURITY
          </p>
        </div>

        {/* Change Options - Top Right (Three separate buttons & Verify Email) */}
        <div className="flex flex-wrap items-center gap-2.5 md:self-start justify-start md:justify-end">
          {!user?.isEmailVerified && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="bg-black text-white border-2 border-black px-3.5 py-2 font-space font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-colors touch-manipulation cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000]"
            >
              <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
              [ VERIFY EMAIL ]
            </button>
          )}

          <button
            onClick={() => toggleSection('name')}
            className={`border-2 border-black px-3.5 py-2 font-space font-bold text-xs uppercase tracking-wider transition-colors touch-manipulation cursor-pointer shadow-[2px_2px_0px_0px_#000000] ${
              activeSection === 'name' ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            {activeSection === 'name' ? '[ CANCEL NAME ]' : 'CHANGE NAME'}
          </button>

          <button
            onClick={() => toggleSection('address')}
            className={`border-2 border-black px-3.5 py-2 font-space font-bold text-xs uppercase tracking-wider transition-colors touch-manipulation cursor-pointer shadow-[2px_2px_0px_0px_#000000] ${
              activeSection === 'address' ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            {activeSection === 'address' ? '[ CLOSE ADDRESSES ]' : 'EDIT/ADD ADDRESS'}
          </button>

          <div className="relative group inline-flex">
            <button
              type="button"
              aria-disabled={!user?.isEmailVerified}
              onClick={() => {
                if (user?.isEmailVerified) {
                  setShowPasswordModal(true);
                  setActiveSection(null);
                  setError('');
                  setSuccess('');
                } else {
                  setShowVerifyModal(true);
                }
              }}
              className={`border-2 px-3.5 py-2 font-space font-bold text-xs uppercase tracking-wider transition-all duration-150 touch-manipulation flex items-center gap-1.5 ${
                user?.isEmailVerified
                  ? 'border-black bg-white hover:bg-neutral-100 text-black cursor-pointer shadow-[2px_2px_0px_0px_#000000]'
                  : 'border-neutral-400 bg-neutral-200 text-neutral-500 cursor-not-allowed group-hover:bg-red-600 group-hover:text-white group-hover:border-black group-hover:shadow-[2px_2px_0px_0px_#000000]'
              }`}
            >
              {!user?.isEmailVerified && (
                <Lock size={13} className="shrink-0 transition-colors text-neutral-500 group-hover:text-white animate-pulse" />
              )}
              CHANGE PASSWORD
            </button>

            {/* Brutalist Hover Tooltip when unverified */}
            {!user?.isEmailVerified && (
              <div className="absolute right-0 top-full mt-2.5 z-50 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap bg-black text-white border-2 border-red-500 text-[10px] font-space font-bold uppercase px-3 py-2 shadow-[4px_4px_0px_0px_#ef4444] flex items-center gap-2">
                <span className="bg-red-600 text-white px-1.5 py-0.5 text-[9px] font-black">LOCKED</span>
                <span>VERIFY EMAIL TO UNLOCK KEY RESET (CLICK TO VERIFY)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="border-2 border-black bg-black text-white font-space text-[10px] md:text-xs font-bold uppercase px-4 py-3 mb-6 flex items-center gap-2">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="border-2 border-black bg-white text-black font-space text-[10px] md:text-xs font-bold uppercase px-4 py-3 mb-6 flex items-center gap-2">
          <Check size={14} className="text-emerald-600" /> {success}
        </div>
      )}

      {/* Decoupled Action Panels */}
      <AnimatePresence mode="wait">
        {activeSection === 'name' && (
          <motion.div
            key="name-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="border-4 border-black p-5 md:p-8 mb-8 bg-neutral-50 overflow-hidden font-space"
          >
            <form onSubmit={handleSaveName} className="flex flex-col gap-6 max-w-xl mx-auto">
              <div className="border-b-2 border-black pb-2">
                <h3 className="font-space font-black text-sm uppercase tracking-wider text-black">
                  🛠 UPDATE NAME & AVATAR PROFILE
                </h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black">REGISTERED FULL NAME</label>
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black">AVATAR IMAGE FILE</label>
                <div className="relative border-2 border-dashed border-black bg-white p-5 flex flex-col items-center justify-center text-center">
                  <input
                    type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={20} className="text-neutral-400 mb-1.5" />
                  {avatarFile ? (
                    <span className="text-[10px] font-bold text-black uppercase">{avatarFile.name} SELECTED</span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">CLICK OR DRAG TO SELECT NEW PROFILE IMAGE</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:bg-white hover:text-black transition-colors touch-manipulation cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'SAVING CHANGES...' : 'SAVE NAME DETAILS'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection(null)}
                  className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-6 py-4 text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeSection === 'address' && (
          <motion.div
            key="address-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="border-4 border-black p-5 md:p-8 mb-8 bg-neutral-50 overflow-hidden font-space"
          >
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <h3 className="font-space font-black text-sm uppercase tracking-wider text-black">
                  🛠 MANAGE INDIA SHIPPING COORDINATES ({addressesList.length})
                </h3>
              </div>

              {/* Staged Addresses list */}
              {addressesList.length > 0 ? (
                <div className="space-y-3">
                  {addressesList.map((addr, idx) => (
                    <div key={idx} className={`border-2 p-3.5 text-[10px] md:text-xs flex justify-between items-center gap-4 transition-colors ${editingAddressIdx === idx ? 'border-dashed border-neutral-500 bg-neutral-100' : 'border-black bg-white'}`}>
                      <div>
                        <span className="font-bold text-neutral-500 block mb-1 uppercase">COORDINATE #{idx + 1} {editingAddressIdx === idx && '(EDITING)'}</span>
                        <span className="font-black text-black block">{addr.street}, {addr.city}</span>
                        <span className="text-neutral-700">{addr.state} — {addr.zipCode} ({addr.country})</span>
                        <span className="block text-neutral-600 font-bold mt-1 uppercase">PHONE: {addr.phone || 'REQUIRED'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditAddressLocally(idx)}
                          className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-3 py-1.5 text-[9px] font-bold uppercase transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000000]"
                        >
                          [ EDIT ]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddressLocally(idx)}
                          disabled={submitting}
                          className="bg-black text-white hover:bg-white hover:text-black border-2 border-black px-3 py-1.5 text-[9px] font-bold uppercase transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                        >
                          [ REMOVE ]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-300 p-6 text-center text-neutral-400 text-xs uppercase">
                  NO SAVED ADDRESSES. USE THE FORM BELOW TO ADD AN INDIAN SHIPPING COORDINATE.
                </div>
              )}

              {/* Add / Edit Address form */}
              <form onSubmit={handleSaveAddress} className="border-t-2 border-dashed border-neutral-300 pt-6 mt-2">
                <span className="text-xs font-black uppercase text-black block mb-4">
                  {editingAddressIdx !== null ? `🛠 EDITING SHIPMENT COORDINATE (POSITION #${editingAddressIdx + 1})` : '+ ADD NEW INDIA SHIPPING ADDRESS'}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase">STREET ADDRESS *</label>
                    <input
                      type="text" required value={street} onChange={(e) => setStreet(e.target.value)}
                      placeholder="12/B Brutalist Avenue, Apartment / Suite" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">CITY *</label>
                    <input
                      type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="New Delhi / Mumbai / Bangalore" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">STATE / UNION TERRITORY *</label>
                    <select
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">-- SELECT STATE IN INDIA --</option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">ZIP / PIN CODE *</label>
                    <input
                      type="text" required value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                      placeholder="110001" maxLength="6" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none font-mono"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">PHONE NUMBER * (REQUIRED)</label>
                    <input
                      type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs font-bold focus:outline-none font-mono"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-neutral-500">COUNTRY (NON-CHANGEABLE)</label>
                    <input
                      type="text" value="INDIA" disabled
                      style={{ fontSize: '16px' }}
                      className="w-full bg-neutral-200 text-neutral-600 font-black border-2 border-neutral-400 px-3 py-2.5 text-xs cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-black text-white hover:bg-white hover:text-black font-space font-bold uppercase text-xs py-4 border-2 border-black shadow-[4px_4px_0px_0px_#000000] transition-colors touch-manipulation cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'SAVING...' : editingAddressIdx !== null ? '[ SAVE ADDRESS CHANGES ]' : '+ ADD & SAVE ADDRESS'}
                  </button>
                  {editingAddressIdx !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressIdx(null);
                        setStreet(''); setCity(''); setState(''); setZipCode(''); setPhone('');
                      }}
                      className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-6 py-4 text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      CANCEL EDIT
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveSection(null)}
                    className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-6 py-4 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 border-4 border-black p-6 bg-white shadow-solid">
        
        {/* Avatar View */}
        <div className="flex flex-col items-center justify-start w-full max-w-35 mx-auto md:mx-0 gap-2">
          {/* Square Box */}
          <div className="relative border-2 border-black aspect-square w-full overflow-hidden bg-stripes-light flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-black text-white font-inter font-black text-2xl flex items-center justify-center select-none border-2 border-black">
                {user?.fullName?.slice(0, 2).toUpperCase() || 'GP'}
              </div>
            )}
          </div>
          {/* Label underneath */}
          <span className="border-black text-white bg-black border-2 font-inter text-[9px] font-black uppercase select-none text-center w-full block py-0.5">
            {user?.role?.toUpperCase() || 'USER'}
          </span>
        </div>

        {/* Info View */}
        <div className="flex flex-col justify-between font-space">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-dashed border-neutral-300 pb-5 mb-5">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">FULL NAME</span>
              <span className="font-inter font-black text-lg md:text-xl text-black">{user?.fullName || 'USER'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">EMAIL ADDRESS</span>
              <span className="text-sm font-mono tracking-normal text-black break-all block">{user?.email || 'user@domain.com'}</span>
              {user?.isEmailVerified ? (
                <div className="inline-flex items-center gap-2 mt-2 bg-emerald-100 text-emerald-900 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  ✓ VERIFIED ACCOUNT
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-amber-100 text-amber-900 border border-amber-900 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                    ⚠ UNVERIFIED
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">SAVED SHIPPING ADDRESSES (INDIA ONLY)</span>
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-2.5">
                {user.addresses.map((addr, index) => (
                  <div key={index} className="border-2 border-black p-3.5 bg-neutral-50 text-[10px] md:text-xs leading-relaxed font-space flex justify-between items-center gap-3">
                    <div>
                      <span className="font-black text-black block text-xs">{addr.street}, {addr.city}</span>
                      <span className="text-neutral-700 font-bold">{addr.state} — {addr.zipCode} ({addr.country || 'INDIA'})</span>
                      {addr.phone && <span className="block font-black text-black mt-0.5">PHONE: {addr.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-300 p-5 text-center text-neutral-400 text-xs uppercase">
                NO SAVED ADDRESSES FOUND. CLICK 'EDIT/ADD ADDRESS' ABOVE TO ADD ONE.
              </div>
            )}
          </div>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onSuccess={() => {
          setShowVerifyModal(false);
          setSuccess('EMAIL ADDRESS VERIFIED SUCCESSFULLY. YOU MAY NOW CHANGE PASSWORD IF NEEDED.');
        }}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setShowPasswordModal(false);
          setSuccess('PASSWORD CHANGED SUCCESSFULLY.');
        }}
      />
    </div>
  );
}

/* ── Dashboard Root ── */
export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [alertPopup, setAlertPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    singleButton: true,
    onConfirm: null
  });

  const triggerAlert = (message, title = 'NOTIFICATION', onConfirm = null, singleButton = true, confirmText = 'OK') => {
    setAlertPopup({
      isOpen: true,
      title,
      message,
      confirmText,
      singleButton,
      onConfirm
    });
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Retrieve user's orders and all system orders if admin
  const fetchDashboardData = () => {
    if (!user) return;
    setLoading(true);

    const promises = [
      getOrders()
        .then((res) => {
          const data = res.data?.data;
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(() => {
          setOrders([]);
        })
    ];

    if (user.role === 'admin') {
      promises.push(
        getAllOrdersAPI()
          .then((res) => {
            const data = res.data?.data?.orders || res.data?.data || [];
            if (Array.isArray(data)) setAllOrders(data);
          })
          .catch(() => {
            setAllOrders([]);
          })
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  // Reset scroll to top when active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);



  const handleUpdateDetails = (updatedUser) => {
    dispatch(setUser({ user: updatedUser }));
  };

  if (!user) {
    return null; // Let the redirect useEffect handle it
  }

  // Define tabs dynamically based on user role
  const tabs = [
    { id: 'profile', label: 'PROFILE', fullLabel: 'PROFILE VIEW', Icon: User },
    { id: 'orders', label: 'ORDERS', fullLabel: 'ORDER HISTORY', Icon: Package },
    ...(user.role === 'admin' ? [{ id: 'all-orders', label: 'ALL ORDERS', fullLabel: 'ALL ORDERS', Icon: Shield }] : []),
  ];

  const handleLogout = () => {
    dispatch(logoutThunk()).then(() => {
      navigate('/auth');
    });
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <Navbar />

      <div className="pt-20 max-w-7xl mx-auto">

        {/* Dashboard Header Bar */}
        <div className="border-b-4 border-black px-4 md:px-12 py-5 flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <span className="font-space text-[9px] md:text-xs text-neutral-500 uppercase tracking-widest block">USER PROFILE</span>
            <h1 className="font-inter font-black text-xl md:text-2xl uppercase tracking-tighter leading-none truncate">
              {user.fullName}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <span className="hidden md:block font-space text-xs text-neutral-500 uppercase tracking-wider">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 border-2 border-black px-3 md:px-4 py-2.5 font-space font-bold text-[10px] md:text-xs uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation"
            >
              <LogOut size={12} /> <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab switcher pills */}
        <div className="lg:hidden flex border-b-4 border-black">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-space font-bold text-xs uppercase tracking-wider transition-colors duration-75 border-r-2 last:border-r-0 border-black touch-manipulation ${activeTab === id ? 'bg-black text-white' : 'bg-white text-black'
                }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-[calc(100vh-80px-74px)]">

          {/* Sidebar (Desktop Only) */}
          <div className="hidden lg:flex flex-col border-r-4 border-black py-8 px-4 bg-white">
            <nav className="space-y-1">
              {tabs.map(({ id, fullLabel, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 font-space font-bold text-xs uppercase tracking-wider transition-colors duration-75 border-2 ${activeTab === id
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-transparent hover:border-black hover:bg-neutral-50'
                    }`}
                >
                  <Icon size={14} />
                  {fullLabel}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content Panel */}
          <div className="p-4 md:p-8 lg:p-10">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              {activeTab === 'orders' && <OrdersTab orders={orders} loading={loading} />}
              {activeTab === 'all-orders' && user.role === 'admin' && (
                <AdminOrdersTab allOrders={allOrders} loading={loading} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab user={user} onUpdateDetails={handleUpdateDetails} />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* General Alert/Confirm Popup */}
      <Popup
        isOpen={alertPopup.isOpen}
        title={alertPopup.title}
        message={alertPopup.message}
        confirmText={alertPopup.confirmText}
        singleButton={alertPopup.singleButton}
        onConfirm={() => {
          alertPopup.onConfirm?.();
          setAlertPopup((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setAlertPopup((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
