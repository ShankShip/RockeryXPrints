import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { addToCart } from '../../store/cartSlice';

const spring = { type: 'spring', stiffness: 300, damping: 25 };

export default function ProductCard({ product, idx }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [isAdded, setIsAdded] = useState(false);

  const isSoldOut = product.stock === 0;

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...spring, delay: (idx % 4) * 0.06 }}
      whileHover={{ x: -4, y: -4, boxShadow: '6px 6px 0px 0px #000000' }}
      className="bg-black border-2 border-black h-full flex flex-col"
    >
      <div className="h-full flex flex-col bg-white">
        {/* Image area */}
        <Link to={`/products/${product.slug}`} className="block relative">
          <div className="w-full bg-stripes border-b-2 border-black relative flex items-center justify-center overflow-hidden"
               style={{ aspectRatio: '3/4' }}>
            {/* Cloudinary Image or Fallback SVG */}
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-space text-neutral-400">
                NO IMAGE
              </div>
            )}
            {/* Status badge */}
            {isSoldOut && (
              <div className="absolute top-0 left-0 font-space font-bold text-[8px] sm:text-[9px] md:text-[10px] px-2 py-1 uppercase tracking-wider border-r-2 border-b-2 border-black">
                <span className="bg-neutral-500 text-white px-2 py-0.5 inline-block">SOLD OUT</span>
              </div>
            )}
          </div>
        </Link>
        {/* Card body */}
        <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
          <Link to={`/products/${product.slug}`}>
            <span className="font-space text-[8px] sm:text-[9px] font-bold tracking-widest text-neutral-400 block mb-0.5">
              {product.category?.name}
            </span>
            <h3 className="font-space font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-tight hover:text-neutral-500 transition-colors duration-75">
              {product.name}
            </h3>
          </Link>
          {Boolean(product.totalRatings && product.totalRatings > 0 && product.rating && product.rating > 0) ? (
            <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
              {'█'.repeat(Math.round(product.rating))}{'░'.repeat(5 - Math.round(product.rating))}
              {user?.role === 'admin' ? ` ${product.salesCount || 0} SOLD` : ''}
            </div>
          ) : user?.role === 'admin' && product.salesCount > 0 ? (
            <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
              {product.salesCount} SOLD
            </div>
          ) : null}
          <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-dashed border-neutral-200">
            <div>
              <div className="font-space font-black text-sm sm:text-base md:text-lg text-black leading-none">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </div>
            </div>
            <button
              onClick={(e) => !isSoldOut && handleAdd(e)}
              disabled={isSoldOut}
              className={`flex items-center gap-1 font-space font-bold uppercase text-[8px] sm:text-[9px] md:text-xs px-2 sm:px-3 py-2 border-2 border-black transition-colors duration-100 touch-manipulation ${
                isSoldOut
                  ? 'opacity-40 cursor-not-allowed bg-neutral-100'
                  : isAdded
                    ? 'bg-black text-white'
                    : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            >
              <Plus size={10} />
              {isSoldOut ? 'OUT' : isAdded ? '✓' : 'ADD'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
