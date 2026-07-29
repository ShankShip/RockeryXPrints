// src/components/landing/Hero.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ShoppingBag, Zap } from 'lucide-react';


const SPRING_CONFIG = { stiffness: 220, damping: 28, mass: 0.8 };
const CARD_SPRING = { type: 'spring', bounce: 0, duration: 0.7 };

// ─── Perspective Card ──────────────────────────────────────────────────────
function PerspectiveCard({ prod, index, isStackHovered, isHovered, screenSize, onEnter, onLeave, onClick }) {
  const ptrX = useMotionValue(0);
  const ptrY = useMotionValue(0);
  const rotateX = useSpring(useTransform(ptrY, [-1, 1], [12, -12]), SPRING_CONFIG);
  const rotateY = useSpring(useTransform(ptrX, [-1, 1], [-12, 12]), SPRING_CONFIG);
  const glareX = useTransform(ptrX, [-1, 1], [0, 100]);
  const glareY = useTransform(ptrY, [-1, 1], [0, 100]);

  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.18) 0%, transparent 65%)`
  );

  // Fan-out position logic
  let dist = 160;
  if (screenSize === 'mobile') dist = 70;
  if (screenSize === 'tablet') dist = 90;

  const cardId = index + 1; // 1 | 2 | 3
  const baseRotate = index === 0 ? -10 : index === 1 ? 0 : 10;

  let animTarget;
  if (!isStackHovered) {
    animTarget = {
      x: 0, y: 0, rotate: baseRotate, scale: 1,
      zIndex: cardId === 2 ? 12 : cardId === 3 ? 11 : 10,
    };
  } else {
    let xTarget = 0;
    if (cardId === 1) xTarget = -dist;
    if (cardId === 3) xTarget = dist;
    const scaleTarget = isHovered ? 1.0 : 0.76;
    const yTarget = isHovered ? -30 : 12;
    animTarget = {
      x: xTarget, y: yTarget, rotate: 0, scale: scaleTarget,
      // Middle card (2) prioritized when hovered, otherwise maintain strict visual order
      zIndex: isHovered ? 30 : cardId === 2 ? 22 : 15,
    };
  }

  return (
    <motion.div
      animate={animTarget}
      transition={CARD_SPRING}
      onMouseEnter={() => onEnter(cardId)}
      onMouseLeave={() => { onLeave(); ptrX.set(0); ptrY.set(0); }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        ptrX.set((e.clientX - cx) / (rect.width / 2));
        ptrY.set((e.clientY - cy) / (rect.height / 2));
      }}
      onClick={onClick}
      className="absolute w-full h-full cursor-pointer"
      style={{ zIndex: isHovered ? 30 : undefined }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 900, backgroundColor: 'white' }}
        className={`absolute inset-0 border-8 border-black shadow-solid select-none pointer-events-none ${!prod.name ? 'animate-pulse' : ''}`}
      >
      {/* Specular glare — always mounted, opacity animates */}
      <motion.div
        className="absolute inset-0 z-20"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ background: glareBackground }}
      />

      {/* Image matte */}
      <div className="relative flex flex-col justify-between p-6 w-full h-full">
        <div className="w-full h-[85%] border-2 border-black relative flex items-center justify-center overflow-hidden bg-neutral-100">
          {prod.images && prod.images[0] ? (
            <img
              src={prod.images[0]}
              alt={prod.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 font-space text-xs">NO IMAGE</div>
          )}
        </div>
        <div className="flex justify-center items-center font-space text-xs font-bold mt-2">
          <span className="truncate mr-2 uppercase">{prod.name}</span>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Hero ───────────────────────────────────────────────────────────────
export default function Hero({ products, loading }) {
  const navigate = useNavigate();
  const [screenSize, setScreenSize] = useState('desktop');
  const [isStackHovered, setIsStackHovered] = useState(false);
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (isStackHovered) {
      const timer = setTimeout(() => setIsUnwrapped(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsUnwrapped(false);
    }
  }, [isStackHovered]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setScreenSize(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayProducts = Array.isArray(products) ? products.slice(0, 3) : [];

  return (
    <section
      id="home"
      className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)] border-b-4 border-black bg-white select-none"
    >
      {/* ── Left: Copy & CTAs ── */}
      <div className="flex flex-col justify-center px-6 py-12 md:px-16 lg:px-20 border-b-4 lg:border-b-0 lg:border-r-4 border-black">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="font-space text-xs font-bold uppercase tracking-[0.25em] bg-black text-white px-3 py-1.5 border border-black shadow-solid-sm">
            EST. 2026
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.1 }}
          className="font-inter font-black text-5xl md:text-7xl xl:text-8xl leading-[0.88] tracking-tighter uppercase mb-6"
        >
          YOUR{' '}
          <span className="relative inline-block">
            FANDOM
          </span>
          <br />
          <span className="bg-black text-white px-3 py-1 inline-block mt-3">IN A BOX.</span>
        </motion.h1>

        {/* Body copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.2 }}
          className="font-space text-sm md:text-base text-neutral-600 leading-relaxed max-w-lg mb-10"
        >
          Heavyweight archival paper. Pure monochrome pigments. Encased in raw 20mm industrial frames.
          Limited to exactly 100 prints per fandom, hand-numbered.{' '}
          <strong className="text-black">No colors. No clutter. Just raw obsession.</strong>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-4"
        >
          <motion.div
            whileHover={{ x: -4, y: -4, boxShadow: '8px 8px 0px 0px #000000' }}
            whileTap={{ x: 2, y: 2, boxShadow: '2px 2px 0px 0px #000000' }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Link
              to="/shop"
              className="flex items-center gap-2 bg-black text-white font-space font-bold uppercase text-sm px-8 py-4 border-4 border-black shadow-solid"
            >
              Explore Inventory
              <ShoppingBag size={16} />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ x: -4, y: -4, boxShadow: '6px 6px 0px 0px #000000' }}
            whileTap={{ x: 2, y: 2, boxShadow: '1px 1px 0px 0px #000000' }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Link
              to="/categories"
              className="flex items-center gap-2 bg-white text-black font-space font-bold uppercase text-sm px-8 py-4 border-4 border-black shadow-solid"
            >
              Browse Fandoms
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex gap-8 mt-12 pt-8 border-t-2 border-dashed border-neutral-300"
        >
          {[['100', 'prints / run'], ['20mm', 'frame depth'], ['∞', 'fandoms']].map(([val, label]) => (
            <div key={label} className="flex flex-col">
              <span className="font-inter font-black text-2xl md:text-3xl tracking-tighter">{val}</span>
              <span className="font-space text-[10px] uppercase tracking-widest text-neutral-500">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right: CSS 3D Card Stack ── */}
      <div className="relative flex items-center justify-center bg-[#F5F5F5] bg-stripes-light px-8 py-16 overflow-hidden min-h-125 lg:min-h-0">

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }}
        />

        {/* Section label */}
        <div className="absolute top-6 left-6">
        </div>

        {/* CSS 3D Card Stack */}
        <div
          className="relative w-70 h-92.5 sm:w-[320px] sm:h-105 flex items-center justify-center cursor-pointer md:cursor-default before:absolute before:-inset-x-24 sm:before:-inset-x-48 before:-inset-y-16 before:z-0 before:content-['']"
          style={{ perspective: '1200px' }}
          onMouseEnter={() => setIsStackHovered(true)}
          onMouseLeave={() => { setIsStackHovered(false); setHoveredCard(null); }}
          onClick={() => {
            if (screenSize !== 'desktop') {
              setIsStackHovered(prev => !prev);
            }
          }}
        >
          {(loading ? [{}, {}, {}] : displayProducts).map((prod, index) => (
            <PerspectiveCard
              key={prod._id ?? index}
              prod={prod}
              index={index}
              isStackHovered={isStackHovered}
              isHovered={isUnwrapped && hoveredCard === index + 1}
              onEnter={setHoveredCard}
              onLeave={() => setHoveredCard(null)}
              onClick={() => {
                if (!loading && prod.slug) navigate(`/products/${prod.slug}`);
              }}
              screenSize={screenSize}
            />
          ))}
        </div>

        {/* Floating interaction hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isStackHovered ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none"
        >
          <span className="font-space text-[9px] uppercase tracking-[0.25em] text-neutral-400">
            {screenSize === 'desktop' ? '↑ hover to explore' : 'tap stack to fan out'}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
