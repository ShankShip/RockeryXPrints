// src/components/landing/Footer.jsx
import { motion } from 'framer-motion';
import { ArrowRight, Github, Twitter, Instagram, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => { setEmail(''); setSubmitted(false); }, 4000);
  };

  const links = [
    { name: 'Shop Inventory', href: '/shop' },
    { name: 'Browse Collections', href: '/categories' },
    { name: 'Custom Commissions', href: '#' },
    { name: 'Return Policy', href: '#' },
    { name: 'Shipping Info', href: '#' },
  ];

  const socials = [
    { icon: <Instagram size={18} />, label: 'Instagram', href: '#' },
    { icon: <Twitter size={18} />, label: 'Twitter', href: '#' },
    { icon: <Github size={18} />, label: 'GitHub', href: '#' },
  ];

  return (
    <footer id="contact" className="scroll-mt-20] bg-black text-white border-t-4 border-black select-none">

      {/* Edge-to-edge marquee typography */}
      <div className="w-full border-b-4 border-white overflow-hidden py-6 relative">
        <motion.h2
          initial={{ y: 80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          className="font-inter font-black uppercase text-[10vw] md:text-[11vw] leading-none text-center tracking-tighter select-none whitespace-nowrap"
        >
          ROCKERYXPRINTS
        </motion.h2>
        {/* Decorative rule */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-white to-transparent opacity-20" />
      </div>

      {/* Content grid */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
        className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16"
      >

        {/* Column 1: Manifesto & Socials */}
        <div className="flex flex-col justify-between border-b-2 lg:border-b-0 border-neutral-800 pb-8 lg:pb-0">
          <div>
            <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-500 mb-4">
              // THE MANIFESTO
            </h3>
            <p className="font-space text-xs md:text-sm text-neutral-400 leading-relaxed max-w-sm mb-6">
              We reject gradients, drop shadows, and soft edges.
              We believe in high-contrast spaces, industrial lines, and raw fandom print collections.
              Each print is built to dominate the room it occupies.
            </p>
            {/* Brand badge */}
            <div className="inline-flex items-center gap-2 border border-neutral-700 px-3 py-1.5">
              <div className="w-2 h-2 bg-white" />
              <span className="font-space text-[10px] uppercase tracking-widest text-neutral-300">EST. 2026</span>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex gap-3 mt-8">
            {socials.map(({ icon, label, href }) => (
              <motion.a
                key={label}
                href={href}
                whileHover={{ y: -4, backgroundColor: '#ffffff', color: '#000000' }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="w-10 h-10 border-2 border-white flex items-center justify-center text-white transition-colors duration-100"
                aria-label={label}
              >
                {icon}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Column 2: Navigation Index */}
        <div className="border-b-2 lg:border-b-0 border-neutral-800 pb-8 lg:pb-0">
          <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-500 mb-5">
            // INDEX
          </h3>
          <ul className="font-space text-xs md:text-sm font-bold uppercase space-y-3">
            {links.map((link, idx) => (
              <motion.li key={idx} whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <Link
                  to={link.href}
                  className="inline-flex items-center gap-3 text-neutral-300 hover:text-white transition-colors duration-100"
                >
                  <span className="text-[10px] font-normal text-neutral-600">[{String(idx + 1).padStart(2, '0')}]</span>
                  {link.name}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Column 3: Newsletter */}
        <div>
          <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-500 mb-4">
            // DISPATCH
          </h3>
          <p className="font-space text-xs md:text-sm text-neutral-400 leading-relaxed mb-6">
            New fandom drops, custom runs, and inventory restocks.
            Delivered directly. Zero spam. Unsubscribe instantly.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR@EMAIL.COM"
              disabled={submitted}
              className="bg-neutral-900 text-white border-2 border-neutral-600 focus:border-white p-3 font-space text-xs w-full placeholder:text-neutral-600 focus:outline-none transition-colors duration-150 uppercase disabled:opacity-50"
            />

            <motion.button
              type="submit"
              disabled={submitted}
              whileHover={!submitted ? { x: -3, y: -3, boxShadow: '5px 5px 0px 0px #ffffff' } : {}}
              whileTap={!submitted ? { x: 1, y: 1, boxShadow: '1px 1px 0px 0px #ffffff' } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={`border-2 p-3 font-space font-bold text-xs uppercase w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${submitted
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white hover:bg-white hover:text-black'
                }`}
            >
              {submitted ? (
                <>✓ SUBSCRIBED</>
              ) : (
                <>
                  <Send size={12} /> SUBSCRIBE
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800 py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="font-space text-[10px] text-neutral-600 uppercase tracking-widest">
          © {new Date().getFullYear()} ROCKERYXPRINTS — ALL BORDERS RESPECTED.
        </span>
        <span className="font-space text-[10px] text-neutral-700 uppercase tracking-wider">
          MADE WITH INDUSTRIAL PRECISION
        </span>
      </div>
    </footer>
  );
}
