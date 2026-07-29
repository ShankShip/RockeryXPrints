// src/pages/AuthPage.jsx
import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { setUser } from '../store/authSlice';
import { setCart } from '../store/cartSlice';
import { loginUser, registerUser, getUserCart } from '../services/api';

const spring = { type: 'spring', bounce: 0, duration: 0.3 };

const BrutalInput = ({ label, id, name, type = 'text', value, onChange, required, placeholder, autoComplete, rightSlot }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-black">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input-brutal pr-10"
        style={{ fontSize: '16px', paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: 0, paddingRight: '2.5rem' }} /* prevents iOS zoom on focus */
      />
      {rightSlot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  </div>
);

export default function AuthPage() {
  const formRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the INITIAL page reload
    setError('');

    if (form.password.length < 8) {
      setError('PASSWORD MUST BE AT LEAST 8 CHARACTERS.');
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const redirectPath = queryParams.get('redirect') || '/dashboard';
      
      if (mode === 'login') {
        const res = await loginUser({ email: form.email, password: form.password });
        const userObj = res.data?.data?.user || res.data?.data;
        dispatch(setUser({ user: userObj }));

        // Fetch their cart
        getUserCart()
          .then((cartRes) => dispatch(setCart(cartRes.data?.data || [])))
          .catch(() => { });

        // 3. Force native form submission to trigger the browser's password manager
        if (formRef.current) formRef.current.submit();

        setTimeout(() => {
          navigate(redirectPath);
        }, 250);
      } else {
        const res = await registerUser({ fullName: form.fullName, email: form.email, password: form.password });
        const userObj = res.data?.data?.user || res.data?.data;
        dispatch(setUser({ user: userObj }));

        // 3. Force native form submission to trigger the browser's password manager
        if (formRef.current) formRef.current.submit();

        setTimeout(() => {
          navigate(redirectPath);
        }, 250);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'AUTHENTICATION FAILED. RETRY.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 py-10 selection:bg-black selection:text-white">
      {/* Hidden iframe for native browser form password detection */}
      <iframe name="hidden_auth_iframe" id="hidden_auth_iframe" style={{ display: 'none' }} title="hidden_auth_iframe" />

      {/* Brand back-link */}
      <Link
        to="/"
        className="font-inter font-black text-base md:text-xl tracking-tighter uppercase mb-8 md:mb-12 hover:text-neutral-500 transition-colors duration-75 self-start max-w-md w-full"
      >
        ← ROCKERYXPRINTS
      </Link>

      {/* Auth card — full-width on mobile, constrained on desktop */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="w-full max-w-md bg-white border-4 border-black shadow-solid md:shadow-solid-lg p-6 md:p-12"
      >
        {/* Mode tabs */}
        <div className="flex border-b-4 border-black mb-8">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 font-space font-bold uppercase text-[10px] md:text-xs py-3 tracking-widest transition-colors duration-75 ${mode === m ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                }`}
            >
              {m === 'login' ? 'LOGIN' : 'REGISTER'}
            </button>
          ))}
        </div>

        <h1 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-6 md:mb-8">
          {mode === 'login' ? 'LOGIN' : 'REGISTER'}
        </h1>

        {error && (
          <div className="border-2 border-black bg-black text-white font-space text-[10px] md:text-xs font-bold uppercase px-4 py-3 mb-5 tracking-wider">
            ⚠ {error}
          </div>
        )}

        <form 
          ref={formRef}
          action="#saved" 
          method="post" 
          target="hidden_auth_iframe" 
          onSubmit={handleSubmit} 
          className="flex flex-col gap-6"
        >
          {mode === 'register' && (
            <BrutalInput
              label="FULL NAME"
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={form.fullName}
              onChange={set('fullName')}
              required
              placeholder="ALEX MERCER"
            />
          )}

          <BrutalInput
            label="EMAIL ADDRESS"
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={form.email}
            onChange={set('email')}
            required
            placeholder="alex@domain.com"
          />

          <BrutalInput
            label="PASSWORD"
            id="password"
            name="password"
            type={showPw ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={set('password')}
            required
            placeholder="••••••••"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="p-2 text-neutral-500 hover:text-black transition-colors touch-manipulation"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98, boxShadow: '0px 0px 0px 0px #000000' }}
            transition={spring}
            disabled={loading}
            className="btn-brutal w-full text-sm py-4 md:py-5 shadow-solid mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'PROCESSING...' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
            <ArrowRight size={16} />
          </motion.button>
        </form>

        <p className="font-space text-[10px] md:text-xs text-neutral-500 uppercase tracking-wider mt-6 text-center leading-relaxed">
          {mode === 'login' ? (
            <>
              NEW USER?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-black font-bold underline underline-offset-2 hover:text-neutral-500 transition-colors"
              >
                REGISTER here.
              </button>
            </>
          ) : (
            <>
              ALREADY HAVE AN ACCOUNT?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-black font-bold underline underline-offset-2 hover:text-neutral-500 transition-colors"
              >
                LOGIN here.
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
