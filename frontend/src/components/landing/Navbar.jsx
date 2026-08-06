// src/components/landing/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, ArrowRight, ShoppingBag, User, Search } from 'lucide-react';
import { logoutThunk } from '../../store/authSlice';
import { getProducts } from '../../services/api';
import { applyDeepSearch } from '../../utils/searchUtils';
import ProductCard from '../common/ProductCard';
import Logo1 from '../../assets/Logo1.png';

const spring = { type: 'spring', stiffness: 300, damping: 25 };

const NAV_LINKS = [
  { name: 'HOME', href: '/' },
  { name: 'COLLECTIONS', href: '/collections'},
  { name: 'CATEGORIES', href: '/categories' },
  { name: 'SEARCH', href: '/shop' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const cartSize = useSelector((s) => s.cart.size);

  // Close menu on route change + scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Scroll depth detection — adds visual weight after 40px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch catalog when search opens
  useEffect(() => {
    if (isSearchOpen && catalog.length === 0 && !catalogLoading) {
      setCatalogLoading(true);
      getProducts({ limit: 500 })
        .then(res => {
          const data = res.data?.data?.docs || res.data?.data?.products || res.data?.data;
          if (Array.isArray(data)) setCatalog(data);
        })
        .finally(() => setCatalogLoading(false));
    }
  }, [isSearchOpen, catalog.length, catalogLoading]);

  // Disable body scroll when menu or search is open
  useEffect(() => {
    if (isOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, isSearchOpen]);

  // Live search results
  const searchResults = searchQuery.trim() !== ''
    ? applyDeepSearch(catalog, searchQuery, 'newest', (arr) => arr)
    : [];

  const handleLogout = () => {
    dispatch(logoutThunk()).then(() => {
      navigate('/');
    });
  };

  return (
    <>
      <header
      className={`fixed top-0 left-0 right-0 h-20 select-none transition-[border-bottom-width,box-shadow,background-color] duration-200 ${scrolled
          ? 'border-b-2 border-black bg-white/80 backdrop-blur-md shadow-[0_3px_0_0_#000]'
          : 'border-b-2 border-black bg-white'
        } ${isSearchOpen ? 'z-[60]' : 'z-50'}`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 md:px-12 flex items-center justify-between">

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <motion.img
            src={Logo1}
            alt="RockeryXPrints Logo"
            className="w-8 h-8 object-contain cursor-pointer"
            whileHover={{ rotate: 12, scale: 1.15 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          />
          <span className="font-inter font-black text-xl md:text-2xl tracking-tighter uppercase group-hover:opacity-75 transition-opacity duration-100">
            ROCKERYXPRINTS
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 font-space text-sm font-bold tracking-wider" aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            if (link.name === 'SEARCH') {
              return (
                <button
                  key={link.name}
                  onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    setIsOpen(false);
                  }}
                  className="relative py-1 group overflow-hidden touch-manipulation cursor-pointer"
                >
                  <span className={`relative z-10 transition-colors duration-75 ${isSearchOpen ? 'text-black' : 'group-hover:text-neutral-500'}`}>
                    {link.name}
                  </span>
                  {/* Active indicator */}
                  {isSearchOpen && (
                    <motion.span
                      layoutId="nav-active-search"
                      className="absolute left-0 bottom-0 w-full h-0.5 bg-black"
                      transition={spring}
                    />
                  )}
                  {/* Hover underline (only for non-active) */}
                  {!isSearchOpen && (
                    <span className="absolute left-0 bottom-0 w-full h-0.5 bg-neutral-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-150 ease-out origin-left" />
                  )}
                </button>
              );
            }
            return (
              <NavLink
                key={link.name}
                to={link.href}
                end={link.href === '/'}
                className="relative py-1 group overflow-hidden"
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative z-10 transition-colors duration-75 ${isActive ? 'text-black' : 'group-hover:text-neutral-500'}`}>
                      {link.name}
                    </span>
                    {/* Active indicator */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute left-0 bottom-0 w-full h-0.5 bg-black"
                        transition={spring}
                      />
                    )}
                    {/* Hover underline (only for non-active) */}
                    {!isActive && (
                      <span className="absolute left-0 bottom-0 w-full h-0.5 bg-neutral-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-150 ease-out origin-left" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right side — Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* Cart with spring badge */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-10 h-10 border-2 border-black hover:bg-black hover:text-white transition-colors duration-75"
            aria-label={`Cart — ${cartSize} item${cartSize !== 1 ? 's' : ''}`}
          >
            <ShoppingBag size={16} />
            <AnimatePresence>
              {cartSize > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white font-space font-bold text-[10px] flex items-center justify-center border-2 border-white"
                >
                  {cartSize > 9 ? '9+' : cartSize}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Auth */}
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-white text-black font-space font-bold uppercase text-xs px-4 py-2.5 border-2 border-black hover:bg-black hover:text-white transition-colors duration-75"
            >
              <User size={13} /> DASHBOARD
            </Link>
          ) : (
            <motion.div
              whileHover={{ x: -3, y: -3, boxShadow: '6px 6px 0px 0px #000000' }}
              whileTap={{ x: 1, y: 1, boxShadow: '1px 1px 0px 0px #000000' }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-black text-white font-space font-bold uppercase text-xs px-5 py-3 border-2 border-black shadow-solid-sm"
              >
                ENTER SYSTEM
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile Toggle & Search */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsOpen(false);
            }}
            className="flex items-center justify-center w-10 h-10 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-100 touch-manipulation"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={2.5} />
          </button>
          
          <motion.button
            onClick={() => {
              setIsOpen(!isOpen);
              setIsSearchOpen(false);
            }}
            whileTap={{ scale: 0.92 }}
            className="flex items-center justify-center w-10 h-10 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-100 touch-manipulation"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isOpen ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="absolute top-19.75 left-0 right-0 bg-white border-b-4 border-black md:hidden shadow-[0_8px_0_0_#000] overflow-hidden"
          >
            <ul className="font-space font-bold uppercase text-sm divide-y-2 divide-black">
              {NAV_LINKS.map((link) => {
                if (link.name === 'SEARCH') {
                  return (
                    <li key={link.name}>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setIsSearchOpen(true);
                        }}
                        className={`w-full text-left block px-6 py-4 transition-colors duration-75 ${isSearchOpen ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
                      >
                        {link.name}
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={link.name}>
                    <NavLink
                      to={link.href}
                      end={link.href === '/'}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `block px-6 py-4 transition-colors duration-75 ${isActive ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  </li>
                );
              })}

              <li>
                <Link
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-black hover:text-white transition-colors duration-75"
                >
                  CART
                  {cartSize > 0 && (
                    <span className="w-6 h-6 bg-black text-white font-space font-bold text-xs flex items-center justify-center">
                      {cartSize}
                    </span>
                  )}
                </Link>
              </li>

              <li className="p-6 bg-neutral-100">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-4 border-2 border-black font-bold hover:bg-white hover:text-black transition-colors duration-100"
                    >
                      <User size={14} /> DASHBOARD
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full border-2 border-black px-5 py-3 font-bold text-xs hover:bg-black hover:text-white transition-colors duration-100 cursor-pointer"
                    >
                      LOGOUT
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-black text-white px-5 py-4 border-2 border-black hover:bg-white hover:text-black font-bold transition-colors duration-100"
                  >
                    ENTER SYSTEM
                    <ArrowRight size={16} />
                  </Link>
                )}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

    {/* Mega Search Overlay - Rendered outside header to avoid backdrop-filter stacking context bugs */}
    <AnimatePresence>
      {isSearchOpen && (
          <>
            {/* The Black Film Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55]"
            />

          {/* The Search Panel & Results */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-20 left-0 right-0 bg-white border-b-4 border-black shadow-[0_8px_0_0_#000] z-[60] max-h-[calc(100vh-5rem)] flex flex-col"
          >
            <div className="border-b-4 border-black shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`); setIsSearchOpen(false); }} className="max-w-7xl mx-auto flex items-center">
                  <span className="hidden md:block font-space font-bold text-xs uppercase tracking-widest text-neutral-500 px-6 py-5 border-r-2 border-l-2 border-black shrink-0">
                    SEARCH:
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="TYPE TO SEARCH BY FANDOM, TITLE OR TAGS..."
                    className="w-full font-space font-bold text-xs uppercase px-5 py-5 md:px-6 outline-none placeholder-neutral-400 focus:bg-neutral-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="font-space font-bold text-xs uppercase tracking-wider px-6 py-5 md:px-8 border-l-2 border-r-2 border-black hover:bg-black hover:text-white transition-colors duration-75 shrink-0 touch-manipulation"
                  >
                    CLOSE
                  </button>
                </form>
              </div>

              {/* Live Results Area */}
              {searchQuery.trim() !== '' && (
                <div className="overflow-y-auto p-4 md:p-8 bg-neutral-100 flex-1 no-scrollbar">
                  <div className="max-w-7xl mx-auto">
                    {catalogLoading ? (
                      <div className="font-space font-bold text-neutral-500 animate-pulse text-center py-10 uppercase text-sm">Loading Full Inventory...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="font-space font-bold text-neutral-500 text-center py-10 uppercase text-sm">NO PRINTS FOUND MATCHING YOUR QUERY</div>
                    ) : (
                      <>
                        <div className="bg-black gap-0.5 p-0.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                          {searchResults.slice(0, 10).map((product, idx) => (
                            <ProductCard key={product._id} product={product} idx={idx} />
                          ))}
                        </div>
                        {searchResults.length > 10 && (
                          <div className="text-center mt-8">
                            <Link 
                              to={`/shop?search=${encodeURIComponent(searchQuery.trim())}`} 
                              onClick={() => setIsSearchOpen(false)} 
                              className="font-space font-bold text-xs uppercase tracking-widest border-2 border-black bg-white px-8 py-4 hover:bg-black hover:text-white transition-colors inline-block shadow-solid-sm"
                            >
                              VIEW ALL {searchResults.length} RESULTS
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
