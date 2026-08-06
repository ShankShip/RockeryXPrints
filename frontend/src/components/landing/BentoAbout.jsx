// src/components/landing/BentoAbout.jsx
// Authentic Bento Grid Showcase (About Us & Manifesto) for Home Page
import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useSpring, useMotionValue } from 'framer-motion';
import Logo3 from '../../assets/Logo3.png';

// ── Animated counter for Bento Stats ─────────────────────────────────────────
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
    const unsub = rounded.on('change', (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [rounded]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}{suffix}
    </span>
  );
}

export default function BentoAbout() {
  const pillars = [
    {
      num: '01',
      title: 'PRESERVING STORIES',
      desc: 'The films that made us dream bigger, the anime that taught us resilience, the music that became our soundtrack, and the games that kept us awake until sunrise.',
    },
    {
      num: '02',
      title: 'OBSESSED WITH DETAILS',
      desc: 'Premium archival paper, precision pigment printing, 3mm gallery-grade glass, solid hardwood frames, and flat reinforced mailer packaging.',
    },
    {
      num: '03',
      title: 'BUILT AROUND FANDOMS',
      desc: 'More than a store. Built around communities and the idea that the things we love continue to inspire us long after the credits roll.',
    },
  ];

  return (
    <section id="about-bento" className="border-b-4 border-black bg-white text-black relative overflow-hidden select-none">
      {/* Bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-auto relative z-10">

        {/* ─ Large Quote Cell (Col 7) ─ */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.7 }}
          className="md:col-span-7 border-b-4 border-black md:border-r-4 p-8 md:p-14 flex flex-col justify-between bg-black text-white min-h-[340px]"
        >
          <span className="font-space text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
            MANIFESTO
          </span>
          <div>
            <blockquote className="font-inter font-black text-2xl sm:text-3xl md:text-4xl leading-[1.1] tracking-tighter uppercase mt-6 text-white">
              "The stories we grow up with never really end. They shape how we think, what we believe, and who we become. <span className="bg-white text-black px-2 inline-block">Rockery Prints</span> exists to give those stories a permanent place in the spaces we call our own."
            </blockquote>
            <p className="font-space text-xs text-neutral-400 mt-6 uppercase tracking-widest flex items-center gap-2">
              <img src={Logo3} alt="Logo" className="w-4 h-4 object-contain inline-block invert" />
              <span>— Rockery Prints Philosophy</span>
            </p>
          </div>
        </motion.div>

        {/* ─ Counter Stats Cluster (Col 5 - 2x2 grid) ─ */}
        <div className="md:col-span-5 grid grid-cols-2 border-b-4 border-black bg-white">
          {[
            { value: 100, suffix: '%', label: 'archival quality', bg: 'bg-white' },
            { value: 20, suffix: 'MM', label: 'solid frame depth', bg: 'bg-neutral-100' },
            { value: 3, suffix: 'MM', label: 'gallery glass', bg: 'bg-neutral-100' },
            { value: 0, suffix: '%', label: 'compromise', bg: 'bg-white' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.55, delay: i * 0.08 }}
              className={`${stat.bg} border-black p-6 md:p-8 flex flex-col justify-between ${
                i % 2 === 0 ? 'border-r-2' : ''
              } ${i < 2 ? 'border-b-2' : ''}`}
            >
              <span className="font-inter font-black text-4xl md:text-5xl tracking-tighter leading-none text-black">
                <Counter to={stat.value} suffix={stat.suffix} />
              </span>
              <span className="font-space text-[10px] uppercase tracking-[0.2em] text-neutral-600 mt-3 block font-bold">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* ─ Three Numbered Pillars (Col 4 each) ─ */}
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
            {/* Hover fill animation */}
            <motion.div
              variants={{ hover: { scaleY: 1 } }}
              initial={{ scaleY: 0 }}
              className="absolute inset-0 bg-black origin-bottom z-0"
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            />

            <div className="relative z-10">
              <div className="font-space font-bold text-5xl md:text-6xl tracking-widest mb-8 text-black group-hover:text-white transition-colors duration-150">
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
            <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-black group-hover:bg-white transition-colors duration-150" />
          </motion.div>
        ))}

      </div>

      {/* Signature Brand Quote Banner */}
      <div className="border-t-4 border-black bg-black text-white p-8 md:p-12 text-center relative overflow-hidden select-none">
        <blockquote className="font-inter font-black text-xl sm:text-3xl md:text-4xl uppercase tracking-tighter leading-snug text-white max-w-4xl mx-auto">
          "Rockery Prints exists to turn the stories that shaped you into the spaces that define you."
        </blockquote>
        <p className="font-space text-[10px] sm:text-xs font-bold tracking-[0.3em] text-neutral-400 uppercase mt-4">
          BRAND PHILOSOPHY · EST. 2026
        </p>
      </div>
    </section>
  );
}
