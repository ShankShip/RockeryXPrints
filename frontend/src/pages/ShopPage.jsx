// src/pages/ShopPage.jsx
// Full product inventory grid loaded strictly from the backend database
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Plus, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import { SkeletonCard } from '../components/common/Skeleton';
import { getProducts, getCategories } from '../services/api';
import { applyDeepSearch } from '../utils/searchUtils';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const spring = { type: 'spring', bounce: 0, duration: 0.3 };
const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS = [
  { value: 'popular', label: 'MOST POPULAR' },
  { value: 'price-asc', label: 'PRICE: LOW → HIGH' },
  { value: 'price-desc', label: 'PRICE: HIGH → LOW' },
  { value: 'newest', label: 'NEWEST FIRST' },
];

function sortProducts(products, sort) {
  const arr = [...products];
  if (sort === 'popular') return arr.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  if (sort === 'price-asc') return arr.sort((a, b) => a.sellingPrice - b.sellingPrice);
  if (sort === 'price-desc') return arr.sort((a, b) => b.sellingPrice - a.sellingPrice);
  if (sort === 'newest') return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return arr;
}

function PaginationControls({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, position = 'bottom' }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      endPage = Math.min(totalPages, 5);
    }
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const borderClass = position === 'top' ? 'border-b-4 border-black' : 'border-t-4 border-black';

  return (
    <div className={`${borderClass} bg-neutral-100 px-6 py-6 font-space flex flex-col sm:flex-row items-center justify-between gap-4 uppercase`}>
      <div className="text-xs font-bold tracking-wider text-neutral-600">
        Showing <span className="text-black font-black">{startItem}–{endItem}</span> of <span className="text-black font-black">{totalItems}</span> prints
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors px-3.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-solid-sm uppercase"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        {getPageNumbers()[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors w-9 h-9 text-xs font-bold cursor-pointer shadow-solid-sm"
            >
              1
            </button>
            {getPageNumbers()[0] > 2 && <span className="px-1 text-xs text-neutral-400">...</span>}
          </>
        )}

        {getPageNumbers().map((pg) => (
          <button
            key={pg}
            onClick={() => onPageChange(pg)}
            className={`border-2 border-black w-9 h-9 text-xs font-bold cursor-pointer shadow-solid-sm transition-colors ${
              currentPage === pg ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            {pg}
          </button>
        ))}

        {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
          <>
            {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
              <span className="px-1 text-xs text-neutral-400">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors w-9 h-9 text-xs font-bold cursor-pointer shadow-solid-sm"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors px-3.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-solid-sm uppercase"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [added, setAdded] = useState({});
  const [sort, setSort] = useState('popular');
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag, debouncedQuery, sort]);

  // Sync URL search param to state if it changes externally
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);

    // Fetch full catalog once for robust local filtering & pagination
    getProducts({ limit: 500 })
      .then((res) => {
        const data = res.data?.data?.docs || res.data?.data?.products || res.data?.data;
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(() => { })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleWishlist = (id) =>
    setWishlist((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleAdd = (product, e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    setAdded((p) => ({ ...p, [product._id]: true }));
    setTimeout(() => setAdded((p) => ({ ...p, [product._id]: false })), 1500);
  };

  // 1. Filter by activeTag (matching tags, category name/slug, or product name)
  const baseProducts = activeTag === 'all'
    ? products
    : products.filter((p) => {
      const catObj = typeof p.category === 'object' ? p.category : p.categoryDetails;
      const catName = catObj?.name?.toLowerCase() || '';
      const catSlug = catObj?.slug?.toLowerCase() || '';
      const tagLower = activeTag.toLowerCase();

      return (
        p.searchTags?.some(t => t && t.toLowerCase() === tagLower) ||
        catName === tagLower ||
        catSlug === tagLower ||
        p.name?.toLowerCase().includes(tagLower)
      );
    });

  // 2. Apply Deep Search Algorithm
  const sorted = applyDeepSearch(baseProducts, debouncedQuery, sort, sortProducts);

  // 3. Paginate
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedProducts = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setTag = (tag) => {
    if (tag === 'all') searchParams.delete('tag');
    else searchParams.set('tag', tag);
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar />

      <div className="pt-20" ref={gridTopRef}>
        {/* Page header */}
        <div className="border-b-4 border-black px-5 md:px-12 py-7 md:py-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 bg-white">
          <div>
            <span className="font-space text-[10px] md:text-xs font-bold tracking-[0.25em] text-neutral-500 mb-2 block uppercase">
              {activeTag === 'all' ? 'Full Inventory' : activeTag}
            </span>
            <h1 className="font-inter font-black text-4xl sm:text-5xl md:text-7xl tracking-tighter leading-none uppercase">
              {activeTag === 'all' ? (
                <>All Prints</>
              ) : (
                activeTag
              )}
            </h1>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b-4 border-black flex items-stretch bg-white justify-between relative">
          {/* Search Input Bar */}
          <div className="flex items-stretch bg-white w-full relative">
            <div className="flex-1 flex items-center relative">
              <span className="font-space font-bold text-[10px] md:text-xs tracking-widest text-neutral-500 px-5 py-4 border-r-2 border-black shrink-0 uppercase">
                Search:
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog..."
                className="w-full h-full font-space font-bold text-xs px-5 py-4 outline-none placeholder-neutral-400 focus:bg-neutral-50 transition-colors pr-14 uppercase"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="text-black hover:text-neutral-500 transition-colors touch-manipulation">
                    <X size={18} strokeWidth={3} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative shrink-0 flex items-stretch border-l-2 border-black">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 font-space font-bold text-[10px] md:text-xs tracking-wider px-6 py-4 h-full hover:bg-neutral-100 transition-colors border-0 touch-manipulation uppercase"
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sort)?.label}</span>
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={spring}
                    className="absolute right-0 top-full z-30 bg-white border-4 border-black shadow-[6px_6px_0_0_#000] min-w-45"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        className={`w-full text-left font-space font-bold text-[10px] tracking-wider px-4 py-3 border-b-2 last:border-b-0 border-black transition-colors duration-75 touch-manipulation uppercase ${sort === opt.value ? 'bg-black text-white' : 'hover:bg-neutral-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Loading indicator */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white p-4 border-2 border-black">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="border-b-4 border-black px-5 py-20 text-center">
            <p className="font-inter font-black text-4xl tracking-tighter text-neutral-200 mb-4 uppercase">No prints found</p>
            <button onClick={() => setTag('all')} className="font-space font-bold text-xs border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors touch-manipulation uppercase">
              Clear Filter
            </button>
          </div>
        ) : (
          <>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={sorted.length}
              itemsPerPage={ITEMS_PER_PAGE}
              position="top"
            />
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 bg-black gap-0.5 p-0.5 transition-opacity duration-200">
              {paginatedProducts.map((product, idx) => {
                const isAdded = added[product._id];
                const isSoldOut = product.stock === 0;

                return (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ ...spring, delay: (idx % 4) * 0.06 }}
                    whileHover={{ x: -4, y: -4, boxShadow: '6px 6px 0px 0px #000000' }}
                    className="bg-black border-2 border-black h-full flex flex-col"
                  >
                    <div className="h-full flex flex-col bg-white">
                      {/* Image area */}
                      <Link to={`/products/${product.slug}`} className="block relative">
                        <div className="w-full bg-stripes border-b-2 border-black relative flex items-center justify-center overflow-hidden"
                          style={{ aspectRatio: '3/4' }}>

                          {/* Cloudinary Image or Fallback SVG */}
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-space text-neutral-400 uppercase">
                              No Image
                            </div>
                          )}

                          {/* Status badge */}
                          {isSoldOut && (
                            <div className="absolute top-0 left-0 font-space font-bold text-[8px] sm:text-[9px] md:text-[10px] px-2 py-1 uppercase tracking-wider border-r-2 border-b-2 border-black">
                              <span className="bg-neutral-500 text-white px-2 py-0.5 inline-block uppercase">SOLD OUT</span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Card body */}
                      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
                        <Link to={`/products/${product.slug}`}>
                          <span className="font-space text-[8px] sm:text-[9px] font-bold tracking-widest text-neutral-400 block mb-0.5">
                            {(typeof product.category === 'object' ? product.category?.name : product.categoryDetails?.name) || 'Archival Print'}
                          </span>
                          <h3 className="font-space font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-tight hover:text-neutral-500 transition-colors duration-75">
                            {product.name}
                          </h3>
                        </Link>

                        {Boolean(product.totalRatings && product.totalRatings > 0 && product.rating && product.rating > 0) ? (
                          <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
                            {'█'.repeat(Math.round(product.rating))}{'░'.repeat(5 - Math.round(product.rating))}
                            {user?.role === 'admin' ? ` ${product.salesCount || 0} sold` : ''}
                          </div>
                        ) : user?.role === 'admin' && product.salesCount > 0 ? (
                          <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
                            {product.salesCount} sold
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-dashed border-neutral-200">
                          <div>
                            <div className="font-space font-black text-sm sm:text-base md:text-lg text-black leading-none">
                              ₹{product.sellingPrice.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <button
                            onClick={(e) => !isSoldOut && handleAdd(product, e)}
                            disabled={isSoldOut}
                            className={`flex items-center gap-1 font-space font-bold text-[8px] sm:text-[9px] md:text-xs px-2 sm:px-3 py-2 border-2 border-black transition-colors duration-100 touch-manipulation uppercase ${isSoldOut
                                ? 'opacity-40 cursor-not-allowed bg-neutral-100'
                                : isAdded
                                  ? 'bg-black text-white'
                                  : 'bg-black text-white hover:bg-white hover:text-black'
                              }`}
                          >
                            <Plus size={10} />
                            {isSoldOut ? 'Out' : isAdded ? 'Added' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={sorted.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}

        {/* Bottom note */}
        <div className="border-t-4 border-black px-5 md:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50">
          <p className="font-space text-[10px] md:text-xs text-neutral-500 tracking-wider uppercase">
            All prints ship in rigid flat mailers · Limited to 100 per edition · Hand-numbered
          </p>
          <Link
            to="/categories"
            className="font-space font-bold text-[10px] md:text-xs tracking-wider border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation shrink-0 uppercase"
          >
            ← Browse by category
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
