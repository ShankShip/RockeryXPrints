// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Package, Settings, LogOut, ChevronRight, ChevronDown, User, Shield, Check, Edit2, Upload } from 'lucide-react';
import { logoutThunk, setUser } from '../store/authSlice';
import { updateDetails, changePassword, getOrders, getAllOrdersAPI, updateOrderStatusAPI, updateAvatarAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import Popup from '../components/landing/Popup';
import { SkeletonRow } from '../components/common/Skeleton';

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

/* ── Order card for mobile view ── */
function OrderCard({ order, idx, isAdmin, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatusSelect = async (e) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await onStatusChange(order._id, newStatus);
    } catch (err) {
      // handled parent
    } finally {
      setUpdating(false);
    }
  };

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

              {/* Status Update (Admin Only) */}
              {isAdmin && (
                <div className="pt-3 border-t border-neutral-300 flex items-center gap-2">
                  <span className="text-neutral-500 font-bold">SET STATUS:</span>
                  <select
                    value={order.orderStatus}
                    onChange={handleStatusSelect}
                    disabled={updating}
                    className="border-2 border-black bg-white font-space text-[10px] font-bold px-2 py-1 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  VIEW FULL DETAILS <ChevronRight size={12} />
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
function AdminOrdersTab({ allOrders, onStatusChange, loading }) {
  const [updatingId, setUpdatingId] = useState(null);
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

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await onStatusChange(orderId, newStatus);
    } catch (err) {
      // handled by parent
    } finally {
      setUpdatingId(null);
    }
  };

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
              <OrderCard key={o._id} order={o} idx={i} isAdmin onStatusChange={handleStatusChange} />
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
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                        className="border-2 border-black bg-white font-space text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-0 focus:border-black cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                      </select>
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
  const [formOpen, setFormOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);

  // Address state
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('INDIA');
  const [phone, setPhone] = useState('');

  // Staged addresses list
  const [addressesList, setAddressesList] = useState(user?.addresses || []);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset fields on user change or form close
  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setAddressesList(user?.addresses || []);
    setEditingAddressIdx(null);
  }, [user]);

  const handleRemoveAddressLocally = (indexToRemove) => {
    setAddressesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (editingAddressIdx === indexToRemove) {
      setEditingAddressIdx(null);
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setPhone('');
      setCountry('INDIA');
    }
  };

  const handleEditAddressLocally = (idx) => {
    const addr = addressesList[idx];
    setStreet(addr.street || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setZipCode(addr.zipCode || '');
    setCountry(addr.country || 'INDIA');
    setPhone(addr.phone || '');
    setEditingAddressIdx(idx);
  };

  const handleAddAddressLocally = (e) => {
    e.preventDefault();
    setError('');
    if (!street || !city || !state || !zipCode) {
      setError('ADDRESS REQUIRES STREET, CITY, STATE AND ZIPCODE.');
      return;
    }
    const newAddress = { street, city, state, zipCode: Number(zipCode), country, phone };
    
    if (editingAddressIdx !== null) {
      setAddressesList((prev) => {
        const copy = [...prev];
        copy[editingAddressIdx] = newAddress;
        return copy;
      });
      setEditingAddressIdx(null);
    } else {
      setAddressesList((prev) => [...prev, newAddress]);
    }
    
    // Reset address inputs
    setStreet('');
    setCity('');
    setState('');
    setZipCode('');
    setPhone('');
    setCountry('INDIA');
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords if filled
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setError('ALL KEY/PASSWORD FIELDS MUST BE FILLED.');
        return;
      }
      if (newPassword.length < 8) {
        setError('NEW PASSWORD MUST BE AT LEAST 8 CHARACTERS.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('CONFIRMATION KEY/PASSWORD DOES NOT MATCH.');
        return;
      }
    }

    setSubmitting(true);
    let updatedUser = { ...user };

    try {
      // 1. Update Avatar
      if (avatarFile) {
        const avatarData = new FormData();
        avatarData.append('avatar', avatarFile);
        const avatarRes = await updateAvatarAPI(avatarData);
        if (avatarRes.data?.data) {
          updatedUser = { ...updatedUser, ...avatarRes.data.data };
        }
      }

      // 2. Update Password
      if (oldPassword && newPassword) {
        await changePassword({ oldPassword, newPassword });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      // 3. Update Details & Addresses (directly set the complete staged array)
      const detailsRes = await updateDetails({
        fullName,
        email,
        addresses: addressesList
      });

      if (detailsRes.data?.data) {
        updatedUser = { ...updatedUser, ...detailsRes.data.data };
      }

      // Dispatch and update
      onUpdateDetails(updatedUser);
      setSuccess('PROFILE UPDATED SUCCESSFULLY.');
      setFormOpen(false);
      setAvatarFile(null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'FAILED TO SAVE PROFILE CHANGES.');
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
            ACCOUNT DETAILS
          </p>
        </div>

        {/* Change Options - Top Right (Single unified Edit button) */}
        <div className="flex flex-wrap gap-2 md:self-start justify-start md:justify-end">
          <button
            onClick={() => { setFormOpen(!formOpen); setError(''); setSuccess(''); }}
            className={`border-2 border-black px-4 py-2 font-space font-bold text-xs uppercase tracking-wider transition-colors touch-manipulation cursor-pointer ${formOpen ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100'}`}
          >
            {formOpen ? '[ CANCEL EDIT ]' : '[ EDIT PROFILE ]'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="border-2 border-black bg-black text-white font-space text-[10px] md:text-xs font-bold uppercase px-4 py-3 mb-6">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="border-2 border-black bg-white text-black font-space text-[10px] md:text-xs font-bold uppercase px-4 py-3 mb-6 flex items-center gap-2">
          <Check size={14} className="text-emerald-600" /> {success}
        </div>
      )}

      {/* Unified Edit Form Panel (Admin Style Slide Down) */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="border-4 border-black p-5 md:p-8 mb-8 bg-neutral-50 overflow-hidden font-space"
          >
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              <div className="border-b-2 border-black pb-2">
                <h3 className="font-space font-black text-sm uppercase tracking-wider text-black">
                  🛠 UPDATE SYSTEM REGISTRATION PROFILE
                </h3>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black">REGISTERED FULL NAME</label>
                  <input
                    type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black">EMAIL COORDINATE</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Avatar Image Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black">AVATAR IMAGE FILE</label>
                <div className="relative border-2 border-dashed border-black bg-white p-4 flex flex-col items-center justify-center text-center">
                  <input
                    type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={16} className="text-neutral-400 mb-1" />
                  {avatarFile ? (
                    <span className="text-[10px] font-bold text-black uppercase">{avatarFile.name} SELECTED</span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 uppercase">DRAG OR SELECT NEW PROFILE IMAGE</span>
                  )}
                </div>
              </div>

              {/* Password change section */}
              <div className="border-t border-dashed border-neutral-300 pt-4">
                <span className="text-[10px] font-black uppercase text-neutral-400 block mb-3">CHANGE ACCESS KEY/PASSWORD (OPTIONAL)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase block mb-1">CURRENT KEY</label>
                    <input
                      type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                      style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase block mb-1">NEW KEY</label>
                    <input
                      type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase block mb-1">CONFIRM NEW KEY</label>
                    <input
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ fontSize: '16px' }} className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Staged Addresses list */}
              <div className="border-t border-dashed border-neutral-300 pt-4">
                <span className="text-[10px] font-black uppercase text-neutral-400 block mb-3">MANAGE SHIPMENT COORDINATES ({addressesList.length})</span>
                {addressesList.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {addressesList.map((addr, idx) => (
                      <div key={idx} className={`border-2 p-3 text-[10px] md:text-xs uppercase flex justify-between items-center gap-4 transition-colors ${editingAddressIdx === idx ? 'border-dashed border-neutral-500 bg-neutral-100' : 'border-black bg-white'}`}>
                        <div>
                          <span className="font-bold text-neutral-500 block">COORDINATE #{idx + 1} {editingAddressIdx === idx && '(EDITING)'}</span>
                          {addr.street}, {addr.city}, {addr.state} — {addr.zipCode} ({addr.country})
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditAddressLocally(idx)}
                            className="bg-white hover:bg-neutral-100 text-black border-2 border-black px-2.5 py-1 text-[9px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            [ EDIT ]
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddressLocally(idx)}
                            className="bg-black text-white hover:bg-white hover:text-black border-2 border-black px-2.5 py-1 text-[9px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            [ REMOVE ]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-300 p-4 text-center text-neutral-400 text-xs uppercase mb-4">
                    NO STAGED COORDINATES. USE FORM BELOW TO ADD.
                  </div>
                )}
              </div>

              {/* Add Address section */}
              <div className="border-t border-dashed border-neutral-300 pt-4">
                <span className="text-[10px] font-black uppercase text-neutral-400 block mb-3">
                  {editingAddressIdx !== null ? `🛠 EDIT SHIPMENT COORDINATE (POSITION #${editingAddressIdx + 1})` : 'ADD NEW SHIPMENT COORDINATE'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">STREET ADDRESS</label>
                    <input
                      type="text" value={street} onChange={(e) => setStreet(e.target.value)}
                      placeholder="12/B BRUTALIST AVENUE" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">CITY</label>
                    <input
                      type="text" value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="NEW DELHI" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">STATE</label>
                    <input
                      type="text" value={state} onChange={(e) => setState(e.target.value)}
                      placeholder="DELHI" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">ZIP/POSTAL CODE</label>
                    <input
                      type="number" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                      placeholder="110001" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">PHONE NUMBER</label>
                    <input
                      type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase">COUNTRY</label>
                    <input
                      type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                      placeholder="INDIA" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddAddressLocally}
                    className="flex-1 bg-white hover:bg-neutral-100 text-black font-space font-bold uppercase text-[10px] py-3.5 border-2 border-black transition-colors touch-manipulation cursor-pointer"
                  >
                    {editingAddressIdx !== null ? '[ SAVE ADDRESS CHANGES ]' : '+ STAGE & ADD ADDRESS TO PROFILE'}
                  </button>
                  {editingAddressIdx !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressIdx(null);
                        setStreet(''); setCity(''); setState(''); setZipCode(''); setPhone(''); setCountry('INDIA');
                      }}
                      className="bg-black text-white hover:bg-white hover:text-black border-2 border-black px-4 py-3.5 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      [ CANCEL ]
                    </button>
                  )}
                </div>
              </div>

              {/* Main Submit Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitProfile}
                className="w-full bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors touch-manipulation mt-4 cursor-pointer"
              >
                {submitting ? 'SAVING CHANGES...' : 'SAVE PROFILE DETAILS'}
              </button>
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
          <span className="border-black text-white bg-black border-2 font-inter text-[9px] font-black uppercase select-none text-center">
            {user?.role?.toUpperCase() || 'USER'}
          </span>
        </div>

        {/* Info View */}
        <div className="flex flex-col justify-between font-space">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-2 border-dashed border-neutral-300 pb-5 mb-5">
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">FULL NAME</span>
              <span className="font-inter font-black text-lg md:text-xl uppercase text-black">{user?.fullName || 'USER'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">EMAIL ADDRESS</span>
              <span className="text-sm font-bold uppercase text-black break-all">{user?.email || 'user@domain.com'}</span>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">SAVED SHIPPING ADDRESSES</span>
            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-2">
                {user.addresses.map((addr, index) => (
                  <div key={index} className="border-2 border-black p-3 bg-neutral-50 text-[10px] md:text-xs uppercase leading-relaxed font-space">
                    {addr.street}, {addr.city}, {addr.state} — {addr.zipCode}<br />
                    {addr.country} {addr.phone && `· PHONE: ${addr.phone}`}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-300 p-4 text-center text-neutral-400 text-xs uppercase">
                NO SAVED ADDRESSES FOUND
              </div>
            )}
          </div>
        </div>
      </div>
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

  // Handler to update status (Admin only)
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusAPI(orderId, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      triggerAlert('FAILED TO UPDATE ORDER STATUS ON DATABASE.', 'ERROR OCCURRED');
    }
  };

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
                <AdminOrdersTab allOrders={allOrders} onStatusChange={handleOrderStatusChange} loading={loading} />
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
