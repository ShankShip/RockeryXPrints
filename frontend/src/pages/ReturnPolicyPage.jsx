// src/pages/ReturnPolicyPage.jsx
// Official Return Policy Page for Rockery Prints
import { Link } from 'react-router';
import { ShieldCheck, Clock, AlertTriangle, CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        <Navbar />

        {/* ── Page Banner Header ── */}
        <div className="pt-24 pb-12 md:py-16 border-b-4 border-black px-6 md:px-12 bg-neutral-100">
          <div className="max-w-4xl mx-auto">
            <span className="font-space text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 mb-3 block">
              SUPPORT & SATISFACTION GUARANTEE
            </span>
            <h1 className="font-inter font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-none mb-4">
              RETURN POLICY
            </h1>
            <p className="font-space text-lg md:text-xl font-bold tracking-tight text-black max-w-2xl">
              Crafted for You. Protected by Us.
            </p>
          </div>
        </div>

        {/* ── Main Policy Content ── */}
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 font-space">
          
          {/* Introductory Statement */}
          <div className="border-b-4 border-black pb-12 mb-12">
            <p className="text-sm md:text-base leading-relaxed text-neutral-800 font-medium">
              Every order from Rockery Prints is carefully produced, inspected, and packed before it leaves our studio. We want every product to arrive exactly as intended.
            </p>
            <p className="text-base md:text-lg font-bold text-black mt-4">
              If something isn't right, we'll make it right.
            </p>
          </div>

          {/* 1. Returns & Replacements */}
          <div className="border-b-4 border-black pb-12 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-black shrink-0" size={24} />
              <h2 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tight">
                RETURNS & REPLACEMENTS
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-neutral-600 mb-4 font-bold">
              We gladly offer a replacement or refund if your order arrives:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <li className="border-2 border-black p-4 bg-neutral-50 font-bold text-xs uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" /> Damaged during shipping
              </li>
              <li className="border-2 border-black p-4 bg-neutral-50 font-bold text-xs uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" /> Defective or incorrectly manufactured
              </li>
              <li className="border-2 border-black p-4 bg-neutral-50 font-bold text-xs uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" /> Different from what you ordered
              </li>
              <li className="border-2 border-black p-4 bg-neutral-50 font-bold text-xs uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" /> Missing items from your order
              </li>
            </ul>

            {/* 48-Hour Notice Requirement */}
            <div className="border-4 border-black p-6 bg-black text-white shadow-solid-sm">
              <h3 className="font-inter font-black text-base uppercase tracking-wider mb-2 flex items-center gap-2">
                <Clock size={18} /> REPORT WITHIN 48 HOURS OF DELIVERY
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                To help us resolve the issue quickly, please contact us within <strong className="text-white">48 hours of delivery</strong> with:
              </p>
              <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside font-bold">
                <li>Your order number</li>
                <li>A brief description of the issue</li>
                <li>Clear photos or a short video of the product and packaging</li>
              </ul>
            </div>
          </div>

          {/* 2. Products That Can't Be Returned */}
          <div className="border-b-4 border-black pb-12 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="text-neutral-500 shrink-0" size={24} />
              <h2 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tight">
                PRODUCTS THAT CAN'T BE RETURNED
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-neutral-600 mb-6 leading-relaxed">
              Because many of our products are printed and prepared specifically for each order, we cannot accept returns or exchanges for:
            </p>

            <ul className="space-y-3 mb-6">
              <li className="border-2 border-dashed border-neutral-300 p-4 text-xs font-bold uppercase text-neutral-700">
                ✕ Change of mind
              </li>
              <li className="border-2 border-dashed border-neutral-300 p-4 text-xs font-bold uppercase text-neutral-700">
                ✕ Incorrect size or design selected during purchase
              </li>
              <li className="border-2 border-dashed border-neutral-300 p-4 text-xs font-bold uppercase text-neutral-700">
                ✕ Minor color variations caused by different screen displays
              </li>
              <li className="border-2 border-dashed border-neutral-300 p-4 text-xs font-bold uppercase text-neutral-700">
                ✕ Normal wear after use
              </li>
            </ul>

            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Please review your order details carefully before completing your purchase.
            </p>
          </div>

          {/* 3. Quality Matters */}
          <div className="border-b-4 border-black pb-12 mb-12">
            <h2 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tight mb-4">
              QUALITY MATTERS
            </h2>
            <div className="space-y-4 text-sm md:text-base leading-relaxed text-neutral-800">
              <p>
                Every frame, sticker, and deskmat goes through multiple quality checks before shipping.
              </p>
              <p className="font-bold text-black text-base">
                If we made a mistake, we'll take responsibility. If your order doesn't meet our quality standards, we'll replace it. No unnecessary hassle.
              </p>
            </div>
          </div>

          {/* 4. Need Help? */}
          <div className="border-4 border-black p-8 bg-neutral-50 shadow-solid-sm mb-12">
            <h2 className="font-inter font-black text-2xl uppercase tracking-tight mb-3 flex items-center gap-2">
              <Mail size={22} /> NEED HELP?
            </h2>
            <p className="text-xs md:text-sm text-neutral-700 leading-relaxed mb-4">
              If you have any questions about your order or need assistance with a return or replacement, we're here to help.
            </p>
            <div className="border-2 border-black bg-white p-4 inline-block mb-3">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest block mb-1">SUPPORT EMAIL</span>
              <a href="mailto:shankship01@gmail.com" className="font-inter font-black text-base md:text-lg text-black hover:underline">
                shankship01@gmail.com
              </a>
            </div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
              We aim to respond to all support requests within <span className="text-black">24–48 business hours</span>.
            </p>
          </div>

          {/* 5. Our Guarantee Statement */}
          <div className="border-2 border-black bg-black text-white p-8 md:p-10 text-center select-none">
            <p className="font-inter font-black text-xl md:text-2xl uppercase tracking-tight mb-2">
              "We don't just ship products. We ship the stories that matter to you."
            </p>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">
              If your order doesn't arrive in the condition it deserves, we'll do everything we can to make it right.
            </p>
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
