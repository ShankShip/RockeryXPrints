// src/components/landing/BentoAbout.jsx
// Rebuilt as a premium asymmetric bento grid with:
// - Counter animations (useInView + spring)
// - Scroll-parallax layered frame silhouettes
// - Large quote cell, stat cells, textured accent cell
import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from 'framer-motion';
import Logo3 from '../../assets/Logo3.png';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const count = useMotionValue(0);
  const rounded = useSpring(count, { stiffness: 60, damping: 18 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) count.set(to);
  }, [inView, count, to]);

  useEffect(() => {
    const unsub = rounded.on('change', v => setDisplay(Math.round(v)));
    return unsub;
  }, [rounded]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}{suffix}
    </span>
  );
}

// ── Parallax Frame silhouette stack ─────────────────────────────────────────
function ParallaxFrames({ containerRef }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0,  -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0,  -120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0,  -200]);

  const frames = [
    { w: 120, h: 160, x: '10%',  top: '15%', y: y1, opacity: 0.12 },
    { w: 80,  h: 110, x: '60%',  top: '30%', y: y2, opacity: 0.08 },
    { w: 160, h: 210, x: '35%',  top: '50%', y: y3, opacity: 0.06 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {frames.map((f, i) => (
        <motion.div
          key={i}
          style={{ y: f.y, left: f.x, top: f.top }}
          className="absolute border-4 border-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: f.opacity }}
          transition={{ duration: 1.2, delay: i * 0.2 }}
          {...{ style: { y: f.y, left: f.x, top: f.top, width: f.w, height: f.h, opacity: f.opacity, position: 'absolute', borderWidth: 4, borderStyle: 'solid', borderColor: '#000' } }}
        />
      ))}
    </div>
  );
}

// ── Main BentoAbout ───────────────────────────────────────────────────────────
export default function BentoAbout() {
  const sectionRef = useRef(null);

  const pillars = [
    {
      num: '01',
      title: 'STRICT MONOCHROME',
      desc: 'Absolute black and white. Zero color bleeding. Optimized for brutalist, minimalist, and industrial spaces that demand visual authority.',
    },
    {
      num: '02',
      title: 'ULTRA-HEAVY GLASS',
      desc: '3mm gallery-grade glass. Solid hardwood structures — zero plastic, zero compromise. Built to outlast interior trends by decades.',
    },
    {
      num: '03',
      title: 'NUMBERED EDITIONS',
      desc: 'Exactly 100 prints per design. Metal engraved serial plate on every frame. When 100 is sold — the run closes forever.',
    },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="scroll-mt-20 bg-white border-b-4 border-black select-none relative overflow-hidden"
    >
      {/* Parallax depth frames (ambient) */}
      <ParallaxFrames containerRef={sectionRef} />


      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto relative z-10">

        {/* ─ Large quote cell ─ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.7 }}
          className="md:col-span-7 border-b-4 border-black md:border-r-4 p-8 md:p-14 flex flex-col justify-between bg-black text-white min-h-70"
        >
          <span className="font-space text-xs font-bold uppercase tracking-widest text-neutral-400">
            [ MANIFESTO ]
          </span>
          <div>
            <blockquote className="font-inter font-black text-3xl md:text-4xl xl:text-5xl leading-[1.05] tracking-tighter uppercase mt-6">
              "We don't make<br />
              <span className="bg-white text-black px-2">decoration.</span><br />
              We make<br />
              <span className="italic font-black">statements."</span>
            </blockquote>
            <p className="font-space text-xs text-neutral-400 mt-6 uppercase tracking-widest flex items-center gap-2">
              <img src={Logo3} alt="Logo" className="w-4 h-4 object-contain inline-block" />
              <span>— RockeryXPrints Studio, 2026</span>
            </p>
          </div>
        </motion.div>

        {/* ─ Stats cluster ─ */}
        <div className="md:col-span-5 grid grid-cols-2 border-b-4 border-black">
          {[
            { value: 100, suffix: '', label: 'prints per run', bg: 'bg-white' },
            { value: 20,  suffix: 'MM', label: 'frame depth', bg: 'bg-neutral-50' },
            { value: 3,   suffix: 'MM', label: 'gallery glass', bg: 'bg-neutral-50' },
            { value: 0,   suffix: '%', label: 'plastic used', bg: 'bg-white' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.55, delay: i * 0.08 }}
              className={`${stat.bg} border-black p-8 flex flex-col justify-between ${i % 2 === 0 ? 'border-r-2' : ''} ${i < 2 ? 'border-b-2' : ''}`}
            >
              <span className="font-inter font-black text-4xl md:text-5xl tracking-tighter leading-none">
                <Counter to={stat.value} suffix={stat.suffix} />
              </span>
              <span className="font-space text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-3 block">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ─ Three pillars ─ */}
        {pillars.map((p, i) => (
          <motion.div
            key={i}
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: i * 0.12 }}
            whileHover="hover"
            className={`md:col-span-4 flex flex-col justify-between p-8 md:p-12 group bg-white text-black relative overflow-hidden ${
              i < pillars.length - 1 ? 'border-b-4 md:border-b-0 md:border-r-4' : ''
            } border-black`}
          >
            {/* Hover fill */}
            <motion.div
              variants={{ hover: { scaleY: 1 } }}
              initial={{ scaleY: 0 }}
              className="absolute inset-0 bg-black origin-bottom z-0"
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            />

            <div className="relative z-10">
              <div className="font-space font-bold text-5xl md:text-6xl tracking-widest mb-10 text-black group-hover:text-white transition-colors duration-150">
                [{p.num}]
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="font-inter font-black text-xl md:text-2xl uppercase tracking-tighter mb-3 group-hover:text-white transition-colors duration-150">
                {p.title}
              </h3>
              <p className="font-space text-xs leading-relaxed text-neutral-600 group-hover:text-neutral-300 transition-colors duration-150">
                {p.desc}
              </p>
            </div>

            {/* Corner accent */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-black group-hover:bg-white transition-colors duration-150" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
