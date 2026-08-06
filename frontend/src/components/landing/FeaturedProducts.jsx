import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Plus, Check } from 'lucide-react';
import { addToCart } from '../../store/cartSlice';


const SPRING = { stiffness: 280, damping: 26, mass: 0.8 };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white p-6 h-full flex flex-col justify-between animate-pulse">
      <div>
        <div className="w-full aspect-3/4 bg-neutral-200 mb-6" />
        <div className="h-3 bg-neutral-200 rounded w-1/3 mb-2" />
        <div className="h-5 bg-neutral-200 rounded w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-neutral-200 mt-4">
        <div className="h-5 bg-neutral-200 rounded w-1/4" />
        <div className="h-9 bg-neutral-200 rounded w-16" />
      </div>
    </div>
  );
}

function ProductHoverMedia({ coverImage, hoverVideo, alt, fallbackSvg, isMobile }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const videoSrc = hoverVideo || '';

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (videoSrc && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black"
    >
      {!isMobile && videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : null}

      {coverImage ? (
        <img
          src={coverImage}
          alt={alt || 'Product Image'}
          className={`w-full h-full object-cover transition-all duration-500 relative z-10 ${
            !isMobile && isHovered && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center relative z-10 ${
            !isMobile && isHovered && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {fallbackSvg}
        </div>
      )}
    </div>
  );
}

// ── Mouse-tracked tilt product card ──────────────────────────────────────────
function ProductCard({ product, index, onAdd, isAdded, isMobile }) {
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [8, -8]), SPRING);
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), SPRING);
  const glareX = useTransform(mouseX, [-1, 1], [0, 100]);
  const glareY = useTransform(mouseY, [-1, 1], [0, 100]);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.14) 0%, transparent 60%)`
  );
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = useCallback((e) => {
    if (isMobile || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2));
    mouseY.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2));
  }, [isMobile, mouseX, mouseY]);

  const handleLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const isSoldOut = product.stock === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ y: isMobile ? 0 : 50, opacity: isMobile ? 1 : 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={isMobile ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.6, delay: index * 0.1 }}
      onMouseMove={!isMobile ? handleMove : undefined}
      onMouseEnter={!isMobile ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isMobile ? handleLeave : undefined}
      style={{ zIndex: !isMobile && isHovered ? 10 : undefined }}
      className="relative w-72 sm:w-[320px] md:w-auto shrink-0 snap-center md:snap-align-none"
    >
      <motion.div
        style={!isMobile ? { rotateX, rotateY, transformPerspective: 900 } : {}}
        className="bg-black relative overflow-hidden h-full w-full border-2 border-black md:border-0 shadow-solid md:shadow-none"
      >
      {/* Glare — always rendered, opacity driven by isHovered */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-30"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: glareBackground }}
      />

      <div className="bg-white p-6 h-full flex flex-col justify-between relative z-10">

        {/* Image */}
        <div>
          <Link to={`/products/${product.slug}`} className="block">
            <div className="w-full aspect-3/4 bg-neutral-100 border-2 border-black relative flex items-center justify-center mb-6 overflow-hidden">
              <ProductHoverMedia
                coverImage={product.images && product.images[0]}
                hoverVideo={product.hoverVideo}
                alt={product.name}
                fallbackSvg={<div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-space text-xs">NO IMAGE</div>}
                isMobile={isMobile}
              />
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <span className="font-space font-bold text-white text-xs uppercase tracking-widest border border-white px-3 py-1">
                    SOLD OUT
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Metadata */}
          <Link to={`/products/${product.slug}`} className="block font-space">
            <span className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] block mb-1">
              {product.categoryDetails?.name || 'CATEGORY'}
            </span>
            <h3 className="font-space font-extrabold text-base md:text-lg tracking-tight text-black mb-1 hover:text-neutral-500 transition-colors duration-75">
              {product.name}
            </h3>
          </Link>
        </div>


        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-dashed border-neutral-300">
          <div className="flex flex-col">
            <span className="font-space font-black text-lg text-black leading-none">
              ₹{product.sellingPrice?.toLocaleString('en-IN')}
            </span>
            {product.mrp && product.mrp > product.sellingPrice && (
              <span className="font-space text-[10px] text-neutral-400 line-through">
                ₹{product.mrp?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <motion.button
            onClick={(e) => !isSoldOut && onAdd(product, e)}
            disabled={isSoldOut}
            whileTap={!isSoldOut ? { scale: 0.92 } : {}}
            className={`flex items-center gap-1.5 font-space font-bold uppercase text-xs px-4 py-2.5 border-2 border-black transition-colors duration-100 cursor-pointer ${isSoldOut
              ? 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400'
              : isAdded
                ? 'bg-black text-white'
                : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
          >
            {isAdded ? <Check size={13} /> : <Plus size={13} />}
            <span>{isSoldOut ? 'OUT' : isAdded ? 'DONE' : 'ADD'}</span>
          </motion.button>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main FeaturedProducts ─────────────────────────────────────────────────────
export default function FeaturedProducts({ products, loading = false }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState({});
  const isMobile = useIsMobile();

  const handleAdd = (product, e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    setAdded((prev) => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product._id]: false })), 1800);
  };

  const displayProducts = Array.isArray(products) ? products.slice(0, 4) : [];

  return (
    <section id="collections" className="scroll-mt-20 bg-white border-b-4 border-black select-none overflow-hidden">

      {/* Header */}
      <motion.div
        initial={{ y: isMobile ? 0 : 30, opacity: isMobile ? 1 : 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={isMobile ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.5 }}
        className="border-b-4 border-black px-6 py-8 md:px-12 bg-white flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <span className="font-space text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 mb-2 block">
            COLLECTIBLE FRAME INVENTORY
          </span>
          <h2 className="font-inter font-black text-4xl md:text-6xl tracking-tighter uppercase leading-none">
            INVENTORY
          </h2>
        </div>
        <Link to="/shop">
          <motion.div
            whileHover={!isMobile ? { x: -4, y: -4, boxShadow: '6px 6px 0px 0px #000000' } : undefined}
            whileTap={!isMobile ? { x: 1, y: 1, boxShadow: '1px 1px 0px 0px #000000' } : undefined}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="font-space text-sm font-bold uppercase border-2 border-black px-5 py-2.5 bg-white flex items-center gap-2 cursor-pointer shadow-solid-sm"
          >
            <motion.div
              className="w-3 h-3 bg-black"
              whileHover={!isMobile ? { rotate: 45 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            />
            <span>VIEW ALL</span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Horizontal Scroll on Mobile */}
      <div
        id="collections-grid"
        className="flex md:grid overflow-x-auto overflow-y-hidden md:overflow-hidden snap-x snap-mandatory md:snap-none gap-6 md:gap-0.5 p-6 md:p-0.5 bg-white md:bg-black md:grid-cols-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          #collections-grid::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white w-72 sm:w-[320px] md:w-auto shrink-0 snap-center md:snap-align-none border-2 border-black md:border-0">
              <SkeletonCard />
            </div>
          ))
          : displayProducts.map((product, index) => (
            <ProductCard
              key={product._id ?? index}
              product={product}
              index={index}
              isAdded={!!added[product._id]}
              onAdd={handleAdd}
              isMobile={isMobile}
            />
          ))}
      </div>
    </section>
  );
}
