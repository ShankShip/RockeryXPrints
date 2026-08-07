// src/pages/OrderDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ArrowLeft, Package, Truck, Compass, CheckCircle, AlertOctagon, XOctagon, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { getOrderByIdAPI, updateOrderStatusAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import { SkeletonDetail } from '../components/common/Skeleton';
import { renderTextWithLinks } from '../utils/formatters';

const spring = { type: 'spring', bounce: 0, duration: 0.25 };

const STATUS_OPTIONS = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const STATUS_METADATA = {
  'Processing': { color: 'bg-yellow-100 text-yellow-800 border-yellow-400', icon: Package, desc: 'WE ARE PREPARING AND PACKING YOUR ART PRINTS.' },
  'Shipped': { color: 'bg-blue-100 text-blue-800 border-blue-400', icon: Truck, desc: 'THE PACKAGE IS HANDED TO OUR CARRIER AND EN ROUTE.' },
  'Out for Delivery': { color: 'bg-purple-100 text-purple-800 border-purple-400', icon: Compass, desc: 'THE PACKAGE IS OUT WITH YOUR LOCAL COURIER FOR DELIVERY.' },
  'Delivered': { color: 'bg-green-100 text-green-800 border-green-400', icon: CheckCircle, desc: 'THE PACKAGE HAS BEEN SUCCESSFULLY DELIVERED. THANK YOU!' },
  'Cancelled': { color: 'bg-red-100 text-red-800 border-red-400', icon: XOctagon, desc: 'THIS ORDER HAS BEEN CANCELLED.' }
};

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

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin update state
  const [pendingStatus, setPendingStatus] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrderByIdAPI(orderId);
      const data = res.data?.data;
      setOrder(data);
      if (data) {
        setPendingStatus(data.orderStatus);
        setAdminMessage(data.message || '');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO FETCH ORDER DETAILS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleConfirmStatusChange = async () => {
    if (!adminMessage.trim()) {
      setError('A status message is mandatory for order updates.');
      setShowConfirmModal(false);
      return;
    }
    setUpdatingStatus(true);
    setError('');
    try {
      const res = await updateOrderStatusAPI(orderId, {
        status: pendingStatus,
        message: adminMessage
      });
      const updated = res.data?.data;
      setOrder(updated);
      if (updated) {
        setPendingStatus(updated.orderStatus);
        setAdminMessage(updated.message || '');
      }
      setShowConfirmModal(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO UPDATE ORDER STATUS.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-space flex flex-col p-6">
        <Navbar />
        <div className="pt-24 max-w-5xl mx-auto w-full">
          <SkeletonDetail />
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-white text-black font-space flex flex-col items-center justify-center p-6 text-center">
        <Navbar />
        <AlertOctagon size={48} className="mb-4 text-black" />
        <h2 className="font-inter font-black text-2xl uppercase tracking-tighter mb-2">ERROR OCCURRED</h2>
        <p className="text-xs text-neutral-500 tracking-widest mb-6 max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-black text-white font-space font-bold uppercase text-xs px-6 py-3.5 border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          GO TO DASHBOARD
        </button>
      </div>
    );
  }

  const meta = STATUS_METADATA[order.orderStatus] || STATUS_METADATA['Processing'];
  const StatusIcon = meta.icon;

  const currentStepIndex = STATUS_OPTIONS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <div className="pt-24 max-w-5xl mx-auto w-full px-4 md:px-12 pb-20 flex-1">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="flex items-center gap-2 font-space font-bold uppercase text-xs hover:text-neutral-500 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} /> {user ? 'BACK TO DASHBOARD' : 'BACK TO HOME'}
        </button>

        {/* Header Block */}
        <div className="border-4 border-black p-6 md:p-8 bg-white shadow-solid mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div>
            <div className="font-space text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">
              ORDER DETAILS
            </div>
            <h1 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-3">
              {order.orderId || `ORDER-${order._id.slice(-6)}`}
            </h1>
            <div className="font-space text-xs text-neutral-500 uppercase tracking-wider">
              PLACED ON: {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:text-right">
            <span className={`inline-flex items-center gap-1.5 border-2 px-3 py-1 font-space text-xs font-bold uppercase tracking-wider ${meta.color}`}>
              <StatusIcon size={14} /> {order.orderStatus}
            </span>
            <span className="font-space text-[10px] text-neutral-400 uppercase tracking-wider">
              PAYMENT: <span className="font-bold text-black">{order.paymentStatus.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="border-2 border-black bg-black text-white font-space font-bold text-xs uppercase p-4 mb-8 leading-relaxed">
            ⚠ {error}
          </div>
        )}

        {/* Order Message Callout for Customers / Guests */}
        {order.message && (
          <div className="border-4 border-black bg-yellow-50 p-6 shadow-solid font-space mb-8">
            <p className="text-sm font-bold text-black tracking-wide leading-relaxed whitespace-pre-wrap break-words">
              {renderTextWithLinks(order.message)}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
          
          {/* Left Column: Items, Status Timeline */}
          <div className="space-y-8">
            
            {/* Timeline Progress Bar (only if not Cancelled) */}
            {!isCancelled ? (
              <div className="border-4 border-black p-6 bg-white shadow-solid font-space">
                <div className="font-bold text-xs uppercase tracking-wider mb-6 text-neutral-500">DELIVERY PROGRESSION</div>
                
                {/* Horizontal steps on md+, vertical on mobile */}
                <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
                  
                  {/* Progress Line */}
                  <div className="absolute top-4 left-4 md:left-[10%] md:right-[10%] md:top-3.5 h-[calc(100%-32px)] md:h-1 bg-neutral-200 z-0 hidden md:block">
                    <div 
                      className="bg-black h-full transition-all duration-300"
                      style={{ width: `${(currentStepIndex / (STATUS_OPTIONS.length - 2)) * 100}%` }}
                    />
                  </div>

                  {STATUS_OPTIONS.slice(0, 4).map((status, idx) => {
                    const isActive = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const StepIcon = STATUS_METADATA[status].icon;

                    return (
                      <div key={status} className="relative z-10 flex md:flex-col items-center md:text-center gap-3 md:gap-2 flex-1">
                        <div 
                          className={`w-8 h-8 rounded-none border-2 flex items-center justify-center transition-colors duration-150 shrink-0 ${
                            isActive ? 'bg-black text-white border-black' : 'bg-white text-neutral-300 border-neutral-300'
                          } ${isCurrent ? 'ring-4 ring-neutral-200' : ''}`}
                        >
                          <StepIcon size={14} />
                        </div>
                        <div>
                          <div className={`font-bold text-[10px] md:text-xs uppercase tracking-wider ${isActive ? 'text-black' : 'text-neutral-300'}`}>
                            {status}
                          </div>
                          {isCurrent && order.deliveredAt && (
                            <div className="text-[9px] text-neutral-400 mt-0.5 normal-case font-mono">
                              {new Date(order.deliveredAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-dashed border-neutral-200 text-xs text-neutral-500 uppercase tracking-widest leading-relaxed">
                  // {meta.desc}
                </div>
              </div>
            ) : (
              <div className="border-4 border-red-500 bg-red-50 p-6 shadow-solid text-red-900 font-space">
                <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest mb-2">
                  <XOctagon size={18} /> ORDER IS CANCELLED
                </div>
                <p className="text-xs uppercase tracking-wide leading-relaxed">
                  THIS TRANSACTION WAS CANCELLED. PREVIOUSLY COMMITTED STOCK HAS BEEN RETURNED TO THE STORES INVENTORY.
                </p>
              </div>
            )}

            {/* Order Items List */}
            <div className="border-4 border-black bg-white shadow-solid">
              <div className="border-b-4 border-black px-5 py-4 bg-neutral-100 flex justify-between items-center">
                <span className="font-space font-black text-xs uppercase tracking-widest">ORDER ITEMS</span>
                <span className="font-space text-xs font-bold border-2 border-black px-2 py-0.5 bg-white uppercase">
                  {order.orderItems.reduce((acc, i) => acc + i.quantity, 0)} UNITS
                </span>
              </div>
              
              <div className="divide-y-2 divide-black">
                {order.orderItems.map((item) => (
                  <div key={item._id || item.name} className="p-5 flex gap-4 items-start">
                    {/* Thumb */}
                    <div className="w-16 h-22 shrink-0 border-2 border-black bg-neutral-50 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="opacity-25" size={24} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-inter font-black text-base md:text-xl tracking-tighter truncate leading-tight">
                        {item.name}
                      </h3>
                      <div className="font-space text-[10px] text-neutral-400 uppercase mt-1">
                        PRICE AT PURCHASE: ₹{item.priceAtPurchase.toLocaleString('en-IN')}
                      </div>
                      <div className="font-space text-[10px] text-black font-bold uppercase mt-0.5">
                        QUANTITY: {item.quantity}
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="font-space font-black text-sm md:text-base text-right shrink-0">
                      ₹{(item.priceAtPurchase * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Address, Actions, Summary */}
          <div className="space-y-8">
            
            {/* Admin Controls (Update status & message) */}
            {isAdmin && (
              <div className="border-4 border-black p-5 bg-white shadow-solid space-y-4 font-space">
                <div className="font-black text-xs uppercase tracking-widest text-neutral-400">
                  ORDER CONTROLS (ADMIN)
                </div>

                {/* Admin Status Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    SET SYSTEM STATUS
                  </label>
                  <select
                    value={pendingStatus}
                    onChange={(e) => {
                      setPendingStatus(e.target.value);
                      setAdminMessage(getDefaultMessageForStatus(e.target.value));
                    }}
                    disabled={updatingStatus}
                    className="w-full border-2 border-black bg-white text-xs font-bold px-3 py-2 focus:outline-none cursor-pointer uppercase"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                  {/* Alert if empty message */}
                {!adminMessage.trim() && (
                  <div className="bg-red-50 border-2 border-red-500 p-3 mb-4">
                    <div className="flex gap-2">
                      <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] font-space text-red-900 leading-tight">
                        <span className="font-bold">MESSAGE REQUIRED:</span> You must attach a message to update the status.
                      </div>
                    </div>
                  </div>
                )}
                </div>

                {/* Admin Message Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex justify-between">
                    <span>ATTACH MESSAGE / NOTE</span>
                    <span className="text-black font-black">REQUIRED</span>
                  </label>
                  <textarea
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    rows={3}
                    placeholder="ENTER ORDER UPDATE NOTES, TRACKING URL, OR MESSAGES..."
                    className="w-full border-2 border-black bg-white text-sm font-mono p-2.5 focus:outline-none focus:ring-0 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={updatingStatus || !adminMessage.trim()}
                  className="w-full bg-black text-white font-bold uppercase text-xs py-3 border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  APPLY CHANGES & NOTIFY CUSTOMER
                </button>
              </div>
            )}

            {/* Shipping Coordinates */}
            <div className="border-4 border-black p-5 bg-white shadow-solid">
              <div className="font-space font-black text-xs uppercase tracking-widest text-neutral-400 mb-3">
                SHIPPING COORDINATES
              </div>
              <div className="font-space text-sm leading-relaxed text-black">
                <div className="font-bold border-b border-dashed border-neutral-300 pb-2 mb-2">
                  RECIPIENT PHONE: {order.shippingAddress?.phone || 'N/A'}
                </div>
                <div>{order.shippingAddress?.street}</div>
                <div>{order.shippingAddress?.city}, {order.shippingAddress?.state}</div>
                <div>{order.shippingAddress?.zipCode} · {order.shippingAddress?.country}</div>
              </div>
            </div>

            {/* Billing Breakdown */}
            <div className="border-4 border-black p-5 bg-black text-white shadow-[6px_6px_0_0_#999999]">
              <h3 className="font-inter font-black text-lg uppercase tracking-tighter mb-4 pb-2 border-b border-neutral-700">
                BILLING STATEMENT
              </h3>
              
              <div className="font-space text-xs space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>EST. RETAIL MRP</span>
                  <span className="line-through">₹{order.totalMRP?.toLocaleString('en-IN') || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>SUBTOTAL</span>
                  <span>₹{order.totalSellingPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>SHIPPING FEE ({order.paymentMethod.toUpperCase()})</span>
                  <span>{order.shippingFee > 0 ? `₹${order.shippingFee}` : 'FREE'}</span>
                </div>

                <div className="border-t border-neutral-800 pt-3 mt-3 flex justify-between items-baseline">
                  <span className="font-bold uppercase tracking-wider text-[10px]">TOTAL CHARGED</span>
                  <span className="font-black text-2xl text-white">₹{order.finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Admin Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-space">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white border-4 border-black p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_#000000] relative"
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-black hover:opacity-50 transition-opacity cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="font-inter font-black text-2xl uppercase tracking-tighter mb-2">
                CONFIRM ORDER STATUS UPDATE
              </h2>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-6">
                ORDER ID: <span className="font-bold text-black">{order.orderId}</span>
              </p>

              {/* Status Change Overview */}
              <div className="border-2 border-black p-4 bg-neutral-50 mb-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase font-bold">CURRENT STATUS:</span>
                  <span className="font-black uppercase">{order.orderStatus}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 pt-2">
                  <span className="text-neutral-500 uppercase font-bold">NEW TARGET STATUS:</span>
                  <span className="font-black uppercase text-blue-600">{pendingStatus}</span>
                </div>
              </div>

              {/* Message Preview */}
              <div className="border-2 border-black p-4 bg-neutral-50 mb-4 font-space">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">ATTACHED MESSAGE:</span>
                {adminMessage.trim() ? (
                  <p className="text-sm font-mono font-bold text-black whitespace-pre-wrap break-words">
                    {renderTextWithLinks(adminMessage.trim())}
                  </p>
                ) : (
                  <p className="text-xs font-mono italic text-neutral-400">
                    [ NO MESSAGE ATTACHED ]
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-white text-black border-2 border-black px-4 py-3 font-bold uppercase text-xs hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                    onClick={handleConfirmStatusChange}
                    disabled={updatingStatus || !adminMessage.trim()}
                    className="flex-1 bg-black text-white font-space font-bold uppercase text-xs py-3 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingStatus ? 'UPDATING...' : 'CONFIRM UPDATE'}
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
