// src/pages/NotFoundPage.jsx
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Logo3 from '../assets/Logo3.png';

const spring = { type: 'spring', bounce: 0, duration: 0.4 };

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden selection:bg-white selection:text-black">

      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Brand */}
      <Link to="/" className="absolute top-8 left-8 font-inter font-black text-sm uppercase tracking-tighter text-white hover:opacity-75 transition-opacity duration-75 flex items-center gap-2">
        <ArrowLeft size={14} />
        <img src={Logo3} alt="RockeryXPrints Logo" className="w-5 h-5 object-contain" />
        <span>ROCKERYXPRINTS</span>
      </Link>

      {/* 404 giant text */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        className="relative z-10 text-center"
      >
        <div
          className="font-inter font-black leading-none text-[28vw] md:text-[22vw] uppercase tracking-tighter text-white opacity-10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          404
        </div>

        <div className="relative z-10">
          <div className="font-space text-xs uppercase tracking-[0.4em] text-neutral-400 mb-4">
            SIGNAL LOST // ERROR 404
          </div>

          <motion.h1
            className="font-inter font-black text-[13vw] md:text-[9vw] uppercase tracking-tighter leading-none text-white mb-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.08 }}
          >
            PAGE<br />NOT<br />FOUND
          </motion.h1>

          <motion.p
            className="font-space text-sm text-neutral-400 uppercase tracking-wider max-w-xs mx-auto mb-10 leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.14 }}
          >
            THE COORDINATES YOU ENTERED DO NOT EXIST IN OUR SYSTEM.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ x: 2, y: 2, boxShadow: '4px 4px 0px 0px rgba(255,255,255,0.4)' }}
              whileTap={{ x: 6, y: 6, boxShadow: '0px 0px 0px 0px rgba(255,255,255,0)' }}
              transition={spring}
            >
              <Link
                to="/"
                className="flex items-center gap-2 bg-white text-black font-space font-bold uppercase text-sm px-8 py-4 border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] hover:bg-black hover:text-white transition-colors duration-75"
              >
                <ArrowLeft size={16} />
                RETURN HOME
              </Link>
            </motion.div>
            <Link
              to="/auth"
              className="flex items-center gap-2 bg-transparent text-white font-space font-bold uppercase text-sm px-8 py-4 border-2 border-white hover:bg-white hover:text-black transition-colors duration-75"
            >
              ACCESS SYSTEM
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white opacity-10" />
    </div>
  );
}
