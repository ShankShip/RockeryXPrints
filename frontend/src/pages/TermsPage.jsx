// src/pages/TermsPage.jsx
// Official Terms & Conditions Page for Rockery Prints
import { Link } from 'react-router';
import { ShieldCheck, FileText, Lock, Globe, Scale } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col justify-between overflow-x-hidden">
      <div>
        <Navbar />

        {/* ── Page Banner Header ── */}
        <div className="pt-24 pb-12 md:py-16 border-b-4 border-black px-6 md:px-12 bg-neutral-100">
          <div className="max-w-4xl mx-auto">
            <span className="font-space text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 mb-3 block">
              LEGAL & BRAND GOVERNANCE
            </span>
            <h1 className="font-inter font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tighter leading-none mb-4">
              TERMS & CONDITIONS
            </h1>
            <p className="font-space text-lg md:text-xl font-bold tracking-tight text-black max-w-2xl">
              Clean Policies Built on Integrity and Clarity.
            </p>
          </div>
        </div>

        {/* ── Main Terms Content ── */}
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 font-space">
          
          <div className="border-b-4 border-black pb-10 mb-10">
            <p className="text-sm md:text-base leading-relaxed text-neutral-800 font-medium">
              Welcome to Rockery Prints. By accessing or purchasing from our platform, you agree to the following terms and conditions governing all sales, digital interactions, and brand operations.
            </p>
          </div>

          {/* Section 1: Ordering & Production */}
          <div className="border-b-4 border-black pb-10 mb-10">
            <h2 className="font-inter font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
              <FileText size={20} /> 01. ORDERS & PRODUCTION
            </h2>
            <div className="space-y-3 text-xs md:text-sm text-neutral-700 leading-relaxed">
              <p>
                All prints, frames, deskmats, and collectibles are custom prepared and quality-inspected per order. Once an order is placed, it enters processing immediately.
              </p>
              <p>
                We reserve the right to refuse or cancel any order in cases of pricing errors, unauthorized stock manipulation, or fraudulent transactions.
              </p>
            </div>
          </div>

          {/* Section 2: Intellectual Property & Fandom Tribute */}
          <div className="border-b-4 border-black pb-10 mb-10">
            <h2 className="font-inter font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
              <Globe size={20} /> 02. ARTWORK & INTELLECTUAL PROPERTY
            </h2>
            <div className="space-y-3 text-xs md:text-sm text-neutral-700 leading-relaxed">
              <p>
                Rockery Prints creates original graphic design interpretations, artistic tributes, and custom typography celebrating anime, films, music, and pop culture.
              </p>
              <p>
                All website design, proprietary graphics, layout structures, and brand copy are protected under copyright law and remain the sole property of Rockery Prints.
              </p>
            </div>
          </div>

          {/* Section 3: Shipping & Packaging */}
          <div className="border-b-4 border-black pb-10 mb-10">
            <h2 className="font-inter font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
              <ShieldCheck size={20} /> 03. SHIPPING & FULFILLMENT
            </h2>
            <div className="space-y-3 text-xs md:text-sm text-neutral-700 leading-relaxed">
              <p>
                Orders are dispatched in flat, reinforced rigid packaging to guarantee structural protection. Estimated delivery times are provided at checkout and typically range between 3 to 7 business days depending on delivery location.
              </p>
              <p>
                Tracking numbers are generated and sent via email/SMS immediately upon order dispatch.
              </p>
            </div>
          </div>

          {/* Section 4: Privacy & Data Protection */}
          <div className="border-b-4 border-black pb-10 mb-10">
            <h2 className="font-inter font-black text-2xl uppercase tracking-tight mb-4 flex items-center gap-2">
              <Lock size={20} /> 04. PRIVACY & SECURITY
            </h2>
            <div className="space-y-3 text-xs md:text-sm text-neutral-700 leading-relaxed">
              <p>
                We prioritize user privacy. Customer payment data is processed through encrypted, PCI-compliant payment gateways. We never store raw credit card credentials or sell user data to third parties.
              </p>
            </div>
          </div>

          {/* Support Info */}
          <div className="border-2 border-black p-6 bg-neutral-50 text-xs text-neutral-600 font-bold uppercase tracking-wider">
            Questions regarding our Terms & Conditions? Contact support at <a href="mailto:shankship01@gmail.com" className="text-black underline">shankship01@gmail.com</a>
          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
