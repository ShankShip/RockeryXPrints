// src/pages/OrderDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ArrowLeft, Package, Truck, Compass, CheckCircle, AlertOctagon, XOctagon } from 'lucide-react';
import { getOrderByIdAPI, cancelMyOrderAPI, updateOrderStatusAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import { SkeletonDetail } from '../components/common/Skeleton';

const spring = { type: 'spring', bounce: 0, duration: 0.25 };

const STATUS_OPTIONS = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const STATUS_METADATA = {
  'Processing': { color: 'bg-yellow-100 text-yellow-800 border-yellow-400', icon: Package, desc: 'WE ARE PREPARING AND PACKING YOUR ART PRINTS.' },
  'Shipped': { color: 'bg-blue-100 text-blue-800 border-blue-400', icon: Truck, desc: 'THE PACKAGE IS HANDED TO OUR CARRIER AND EN ROUTE.' },
  'Out for Delivery': { color: 'bg-purple-100 text-purple-800 border-purple-400', icon: Compass, desc: 'THE PACKAGE IS OUT WITH YOUR LOCAL COURIER FOR DELIVERY.' },
  'Delivered': { color: 'bg-green-100 text-green-800 border-green-400', icon: CheckCircle, desc: 'THE PACKAGE HAS BEEN SUCCESSFULLY DELIVERED. THANK YOU!' },
  'Cancelled': { color: 'bg-red-100 text-red-800 border-red-400', icon: XOctagon, desc: 'THIS ORDER HAS BEEN CANCELLED.' }
};

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrderByIdAPI(orderId);
      setOrder(res.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO FETCH ORDER DETAILS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrder();
  }, [orderId, user]);

  const handleCancelOrder = async () => {
    if (!window.confirm('ARE YOU SURE YOU WANT TO CANCEL THIS ORDER? THIS CANNOT BE UNDONE.')) return;
    setCancelling(true);
    setError('');
    try {
      const res = await cancelMyOrderAPI(orderId);
      setOrder(res.data?.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'FAILED TO CANCEL ORDER.');
    } finally {
      setCancelling(false);
    }
  };

  const handleAdminStatusChange = async (e) => {
    const newStatus = e.target.value;
    setUpdatingStatus(true);
    setError('');
    try {
      const res = await updateOrderStatusAPI(orderId, { status: newStatus });
      setOrder(res.data?.data);
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
        <p className="text-xs text-neutral-500 uppercase tracking-widest mb-6 max-w-sm">{error}</p>
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

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col">
      <Navbar />

      <div className="pt-24 max-w-5xl mx-auto w-full px-4 md:px-12 pb-20 flex-1">
        
        {/* Back Link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-space font-bold uppercase text-xs hover:text-neutral-500 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>

        {/* Header Block */}
        <div className="border-4 border-black p-6 md:p-8 bg-white shadow-solid mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div>
            <div className="font-space text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-1">
              ORDER COORDINATES
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-inter font-black text-base md:text-xl uppercase tracking-tighter truncate leading-tight">
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
            
            {/* Actions (Update status for Admins only) */}
            {user.role === 'admin' && (
              <div className="border-4 border-black p-5 bg-white shadow-solid space-y-4">
                <div className="font-space font-black text-xs uppercase tracking-widest text-neutral-400">
                  ORDER CONTROLS
                </div>

                {/* Admin Status Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="font-space text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    SET SYSTEM STATUS
                  </label>
                  <select
                    value={order.orderStatus}
                    onChange={handleAdminStatusChange}
                    disabled={updatingStatus}
                    className="w-full border-2 border-black bg-white font-space text-xs font-bold px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Shipping Coordinates */}
            <div className="border-4 border-black p-5 bg-white shadow-solid">
              <div className="font-space font-black text-xs uppercase tracking-widest text-neutral-400 mb-3">
                SHIPPING COORDINATES
              </div>
              <div className="font-space text-xs uppercase leading-relaxed text-black">
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
                  <span>TAX 18%</span>
                  <span>₹{order.tax.toLocaleString('en-IN')}</span>
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
    </div>
  );
}
