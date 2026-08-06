// src/components/landing/Footer.jsx
// Clean Brutalist Footer Component for Rockery Prints
import { motion } from 'framer-motion';
import { ArrowUp, Instagram, Mail, MessageCircle, Send, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import Logo3 from '../../assets/Logo3.png';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => { setEmail(''); setSubmitted(false); }, 4000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('shankship01@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const links = [
    { name: 'Shop Inventory', href: '/shop' },
    { name: 'Browse Universes', href: '/categories' },
    { name: 'Return Policy', href: '/return-policy' },
    { name: 'Terms & Conditions', href: '/terms-and-conditions' },
  ];

  const socials = [
    {
      icon: <Instagram size={18} />,
      label: 'Visit our Instagram Page',
      href: 'https://www.instagram.com/rockeryxprints/',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      icon: <Mail size={18} />,
      label: 'Contact us on Email',
      href: 'mailto:shankship01@gmail.com',
    },
    {
      icon: <MessageCircle size={18} />,
      label: 'Contact us on Whatsapp',
      href: `https://wa.me/918829801018?text=${encodeURIComponent('Hello Rockery Prints! I would like to inquire about your fandom art prints, custom orders, or assistance.')}`,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  ];

  return (
    <footer id="contact" className="scroll-mt-20 bg-black text-white border-t-4 border-black select-none">
      
      {/* ── Section 1: Edge-to-Edge Marquee Header ── */}
      <div className="w-full border-b-4 border-neutral-800 overflow-hidden py-8 px-6 relative bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={Logo3} alt="Rockery Prints Logo" className="w-6 h-6 object-contain invert opacity-90" />
            <span className="font-space text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
              ROCKERY PRINTS STUDIO
            </span>
          </div>
          <span className="font-space text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1">
            EST. 2026 · ALL BORDERS RESPECTED
          </span>
        </div>
        <motion.h2
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          className="font-inter font-black uppercase text-[11vw] leading-none text-center tracking-tighter select-none whitespace-nowrap mt-4 text-white opacity-95"
        >
          ROCKERYXPRINTS
        </motion.h2>
      </div>

      {/* ── Section 2: Navigation, Support & Newsletter Grid ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        
        {/* Column 1: Support & Social Connections */}
        <div className="lg:col-span-4 flex flex-col justify-between border-b-2 lg:border-b-0 border-neutral-800 pb-10 lg:pb-0">
          <div>
            <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-white inline-block" />
              SUPPORT & COMMUNITY
            </h3>
            <p className="font-space text-xs text-neutral-400 leading-relaxed mb-6">
              Need assistance with your order or have custom fandom requests? Contact our team directly.
            </p>

            {/* Email Support Box */}
            <div className="border-2 border-neutral-800 bg-neutral-950 p-4 mb-6">
              <span className="font-space text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">
                OFFICIAL SUPPORT EMAIL
              </span>
              <div className="flex items-center justify-between gap-2">
                <a
                  href="mailto:shankship01@gmail.com"
                  className="font-space text-xs md:text-sm font-bold text-white hover:underline truncate"
                >
                  shankship01@gmail.com
                </a>
                <button
                  onClick={handleCopyEmail}
                  title="Copy email to clipboard"
                  className="p-1.5 border border-neutral-700 bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedEmail ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Social Icons Row with Tooltips */}
          <div>
            <span className="font-space text-[10px] text-neutral-500 uppercase tracking-widest block mb-3">
              CONNECT WITH US
            </span>
            <div className="flex items-center gap-3">
              {socials.map(({ icon, label, href, target, rel }) => (
                <div key={label} className="relative group">
                  <motion.a
                    href={href}
                    target={target}
                    rel={rel}
                    title={label}
                    whileHover={{ y: -4, backgroundColor: '#ffffff', color: '#000000' }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="w-12 h-12 border-2 border-white flex items-center justify-center text-white transition-colors duration-100 cursor-pointer"
                    aria-label={label}
                  >
                    {icon}
                  </motion.a>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none whitespace-nowrap">
                    <div className="bg-white text-black border-2 border-black font-space font-bold text-[10px] px-3 py-1 uppercase shadow-solid-sm">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Quick Index Links */}
        <div className="lg:col-span-4 border-b-2 lg:border-b-0 border-neutral-800 pb-10 lg:pb-0">
          <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-white inline-block" />
            INDEX & POLICIES
          </h3>
          <ul className="font-space text-xs md:text-sm font-bold uppercase space-y-4">
            {links.map((link, idx) => (
              <motion.li key={idx} whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <Link
                  to={link.href}
                  className="inline-flex items-center justify-between w-full border-b border-neutral-900 pb-2.5 text-neutral-300 hover:text-white transition-colors duration-100 group"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-normal text-neutral-600">[{String(idx + 1).padStart(2, '0')}]</span>
                    {link.name}
                  </span>
                  <span className="text-neutral-600 group-hover:text-white transition-colors">→</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Column 3: Newsletter Dispatch */}
        <div className="lg:col-span-4">
          <h3 className="font-space font-bold uppercase text-xs tracking-[0.25em] text-neutral-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-white inline-block" />
            DISPATCH NEWSLETTER
          </h3>
          <p className="font-space text-xs text-neutral-400 leading-relaxed mb-6">
            Exclusive fandom drops, custom runs, and inventory restocks. Delivered directly to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR@EMAIL.COM"
              disabled={submitted}
              className="bg-neutral-950 text-white border-2 border-neutral-700 focus:border-white p-3.5 font-space text-xs w-full placeholder:text-neutral-600 focus:outline-none transition-colors duration-150 uppercase disabled:opacity-50"
            />

            <motion.button
              type="submit"
              disabled={submitted}
              whileHover={!submitted ? { x: -3, y: -3, boxShadow: '5px 5px 0px 0px #ffffff' } : {}}
              whileTap={!submitted ? { x: 1, y: 1, boxShadow: '1px 1px 0px 0px #ffffff' } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={`border-2 p-3.5 font-space font-bold text-xs uppercase w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                submitted
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-white hover:bg-white hover:text-black'
              }`}
            >
              {submitted ? <>✓ SUBSCRIBED TO DISPATCH</> : <><Send size={14} /> SUBSCRIBE TO DISPATCH</>}
            </motion.button>
          </form>
        </div>

      </div>

      {/* ── Section 3: Bottom Copyright & Back-to-Top Bar ── */}
      <div className="border-t border-neutral-800 py-6 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left bg-black">
        <span className="font-space text-[10px] text-neutral-500 uppercase tracking-widest">
          © {new Date().getFullYear()} ROCKERY PRINTS — ALL RIGHTS RESERVED.
        </span>
        
        <div className="flex items-center gap-6">
          <span className="font-space text-[10px] text-neutral-400 uppercase tracking-wider hidden md:inline">
            STORIES THAT SHAPED YOU · SPACES THAT DEFINE YOU
          </span>
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 border border-neutral-700 bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 px-3 py-1.5 font-space text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp size={12} />
          </button>
        </div>
      </div>

    </footer>
  );
}
