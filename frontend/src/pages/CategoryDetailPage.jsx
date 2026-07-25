// src/pages/CategoryDetailPage.jsx
// Displays products under a specific Category from the backend
// Allows admins to delete category if empty, and add a product with category predefined
import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Plus, Trash2, ArrowLeft, Upload, X, Film } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import { getProductSvg, mockProducts, mockCategories } from '../data/mockData';
import { getCategories, getProducts, addProductAPI, deleteCategoryAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Popup from '../components/landing/Popup';

const spring = { type: 'spring', bounce: 0, duration: 0.35 };

function HoverMedia({ coverImage, hoverVideo, alt, fallbackSvg }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const videoSrc = hoverVideo || '';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoSrc && videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black"
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none z-0"
        />
      ) : null}

      {coverImage ? (
        <img
          src={coverImage}
          alt={alt || 'Product Image'}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${isHovered && videoSrc ? 'opacity-0' : 'opacity-100'
            }`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center p-4 bg-stripes transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${isHovered && videoSrc ? 'opacity-0' : 'opacity-100'
            }`}
        >
          {fallbackSvg}
        </div>
      )}
    </div>
  );
}

export default function CategoryDetailPage() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  // Category and Product states
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form states (Add Product)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('80');
  const [deliveryDays, setDeliveryDays] = useState('5');
  const [searchTagsInput, setSearchTagsInput] = useState('');
  const [featureRows, setFeatureRows] = useState([{ key: 'PAPER', value: '300 GSM ARCHIVAL MATTE' }]);
  const [imageFiles, setImageFiles] = useState([]);

  const [wishlist, setWishlist] = useState([]);
  const [added, setAdded] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [createPopupOpen, setCreatePopupOpen] = useState(false);

  const [alertPopup, setAlertPopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    singleButton: true,
    onConfirm: null
  });

  const triggerAlert = (message, title = 'NOTIFICATION', onConfirm = null, singleButton = true, confirmText = 'OK') => {
    setAlertPopup({
      isOpen: true,
      title,
      message,
      confirmText,
      singleButton,
      onConfirm
    });
  };

  // Fetch category data matching slug and filter products
  const fetchCategoryDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Get category object by fetching all categories and finding by slug
      const catRes = await getCategories(isAdmin);
      const allCats = catRes.data?.data || [];
      const foundCat = allCats.find((c) => c.slug === categorySlug) ||
        mockCategories.find((c) => c.slug === categorySlug);

      if (!foundCat) {
        setErrorMsg('CATEGORY NOT REGISTERED.');
        setLoading(false);
        return;
      }
      setCategory(foundCat);

      // Fetch products directly filtered by the active category ID
      const prodRes = await getProducts({ category: foundCat._id });
      const catProds = prodRes.data?.data?.docs || prodRes.data?.data?.products || prodRes.data?.data || [];

      // Pad with mock products of same category if list is empty for visual richness
      if (catProds.length === 0) {
        const fallbacks = mockProducts.filter(
          (p) => p.category?.name?.toLowerCase().replace(/\s+/g, '-') === foundCat.slug ||
            p.category?.slug === foundCat.slug
        );
        setProducts(fallbacks);
      } else {
        setProducts(catProds);
      }
    } catch (err) {
      // Fallback
      const foundCat = mockCategories.find((c) => c.slug === categorySlug);
      if (foundCat) {
        setCategory(foundCat);
        const fallbacks = mockProducts.filter(
          (p) => p.category?.name?.toLowerCase().replace(/\s+/g, '-') === foundCat.slug ||
            p.category?.slug === foundCat.slug
        );
        setProducts(fallbacks);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetails();
  }, [categorySlug, isAdmin]);

  const toggleWishlist = (id) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAdd = (product, e) => {
    e.preventDefault();
    dispatch(addToCart({ product, quantity: 1 }));
    setAdded((prev) => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product._id]: false })), 1500);
  };

  const [hoverVideoFile, setHoverVideoFile] = useState(null);

  // Validate and open confirmation popup
  const handleSubmitProductAttempt = (e) => {
    e.preventDefault();
    if (!category) return;
    if (imageFiles.length === 0) {
      setErrorMsg('AT LEAST ONE PRODUCT IMAGE UPLOAD IS REQUIRED.');
      return;
    }
    setErrorMsg('');
    setCreatePopupOpen(true);
  };

  // Perform backend product creation
  const handleConfirmCreateProduct = async () => {
    setCreatePopupOpen(false);
    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('mrp', mrp);
    formData.append('sellingPrice', sellingPrice);
    formData.append('category', category._id); // Predefined & unchangeable
    formData.append('sku', sku || `RXP-${category.name.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`);
    formData.append('stock', stock);
    formData.append('deliveryDays', deliveryDays);

    // Parse tags array
    const tagsArr = searchTagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
    tagsArr.forEach(tag => formData.append('searchTags[]', tag));

    // Parse features to JSON string as expected by backend controller
    const featuresArr = featureRows.filter(r => r.key && r.value);
    formData.append('features', JSON.stringify(featuresArr));

    // Append multiple image files
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }

    if (hoverVideoFile) {
      formData.append('hoverVideo', hoverVideoFile);
    }

    try {
      await addProductAPI(formData);
      // Reset form
      setName('');
      setDescription('');
      setMrp('');
      setSellingPrice('');
      setSku('');
      setStock('80');
      setDeliveryDays('5');
      setSearchTagsInput('');
      setFeatureRows([{ key: 'PAPER', value: '300 GSM ARCHIVAL MATTE' }]);
      setImageFiles([]);
      setHoverVideoFile(null);
      setFormOpen(false);

      // Refresh details
      fetchCategoryDetails();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'ERROR WHILE UPLOADING PRODUCT TO DATABASE.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete category (Only if productCount === 0)
  const handleDeleteCategory = async () => {
    if (!category) return;
    setDeletePopupOpen(false);

    try {
      await deleteCategoryAPI(category._id);
      navigate('/categories');
    } catch (err) {
      triggerAlert(err?.response?.data?.message || 'FAILED TO DELETE CATEGORY. ENSURE IT HAS ZERO PRODUCTS.', 'ERROR OCCURRED');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const addFeatureRow = () => setFeatureRows([...featureRows, { key: '', value: '' }]);
  const updateFeatureRow = (idx, field, val) => {
    const updated = [...featureRows];
    updated[idx][field] = val;
    setFeatureRows(updated);
  };

  const isCategoryEmpty = products.length === 0 || category?.productCount === 0;

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar />

      <div className="pt-20">

        {/* ── Page Header ── */}
        <div className="border-b-4 border-black px-5 md:px-12 py-8 md:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-white">
          <div>
            <Link to="/categories" className="font-space text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black flex items-center gap-1 mb-2">
              <ArrowLeft size={12} /> BACK TO UNIVERSES
            </Link>
            <h1 className="font-inter font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-tighter leading-none">
              {category?.name || 'FANDOM'}
            </h1>
          </div>

          {/* Action options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Product Button */}
            {isAdmin && category && (
              <button
                onClick={() => { setFormOpen(!formOpen); setErrorMsg(''); }}
                className="border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-space font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Plus size={14} />
                <span>ADD PRODUCT</span>
              </button>
            )}

            {/* Delete Category Button (Only if empty category and admin) */}
            {isAdmin && category && isCategoryEmpty && (
              <button
                onClick={() => setDeletePopupOpen(true)}
                className="border-2 border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600 transition-colors px-4 py-2 font-space font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Trash2 size={14} />
                <span>DELETE CATEGORY</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Add Product Form Block (Admin Only) ── */}
        <AnimatePresence>
          {isAdmin && formOpen && category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="overflow-hidden border-b-4 border-black bg-neutral-50"
            >
              <form onSubmit={handleSubmitProductAttempt} className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6 font-space">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <h3 className="font-space font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
                    🛠 ADD PRINT UNDER: {category.name.toUpperCase()}
                  </h3>
                  <button type="button" onClick={() => setFormOpen(false)} className="text-neutral-500 hover:text-black">
                    <X size={18} />
                  </button>
                </div>

                {errorMsg && (
                  <div className="border-2 border-black bg-black text-white text-xs font-bold uppercase px-4 py-2.5">
                    ⚠ {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">PRINT NAME</label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="E.G. SHINIGAMI // 01" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2.5 font-space text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">CATEGORY (PREDEFINED)</label>
                    <input
                      type="text" disabled value={category.name.toUpperCase()}
                      className="w-full bg-neutral-200 border-2 border-black px-3.5 py-2.5 font-space text-sm text-neutral-500 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-black">DESCRIPTION</label>
                  <textarea
                    required value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="ENTER ARCHIVAL PRINT SPECIFICS..." rows={3} style={{ fontSize: '16px' }}
                    className="w-full bg-white border-2 border-black px-3.5 py-2.5 font-space text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">MRP (INR)</label>
                    <input
                      type="number" required value={mrp} onChange={(e) => setMrp(e.target.value)}
                      placeholder="1599" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">SELLING PRICE</label>
                    <input
                      type="number" required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1299" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">STOCK COUNT</label>
                    <input
                      type="number" required value={stock} onChange={(e) => setStock(e.target.value)}
                      placeholder="80" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">DELIVERY DAYS</label>
                    <input
                      type="number" required value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="5" min="1" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">SKU (OPTIONAL)</label>
                    <input
                      type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                      placeholder="E.G. RXP-ANI-001" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">SEARCH TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text" value={searchTagsInput} onChange={(e) => setSearchTagsInput(e.target.value)}
                      placeholder="anime, shinigami, limited" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multiple Images Upload & Required Hover Video */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">UPLOAD PRODUCT IMAGES * (MULTIPLE)</label>
                    <div className="relative border-2 border-dashed border-black bg-white p-5 flex flex-col items-center justify-center text-center">
                      <input
                        type="file" multiple accept="image/*" required onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload size={20} className="text-neutral-400 mb-1" />
                      {imageFiles.length > 0 ? (
                        <span className="text-xs font-bold text-black uppercase">
                          {imageFiles.length} FILES SELECTED
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 uppercase">
                          DRAG IMAGES OR CLICK TO UPLOAD
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">HOVER VIDEO (OPTIONAL - .MP4 / .WEBM)</label>
                    <div className="relative border-2 border-dashed border-black bg-white p-5 flex flex-col items-center justify-center text-center">
                      <input
                        type="file" accept="video/mp4,video/webm,video/*" onChange={(e) => setHoverVideoFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Film size={20} className="text-neutral-400 mb-1" />
                      {hoverVideoFile ? (
                        <span className="text-xs font-bold text-black uppercase truncate">
                          {hoverVideoFile.name}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 uppercase truncate">
                          UPLOAD HOVER VIDEO (.MP4, .WEBM)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features key-value list */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">PRODUCT SPECIFICATIONS</label>
                    <button type="button" onClick={addFeatureRow} className="border border-black px-2 py-1 font-bold text-[9px] hover:bg-black hover:text-white transition-colors">
                      + ADD ROW
                    </button>
                  </div>
                  <div className="space-y-2">
                    {featureRows.map((row, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input
                          type="text" placeholder="KEY (E.G. PAPER)" value={row.key} onChange={(e) => updateFeatureRow(idx, 'key', e.target.value)}
                          className="flex-1 bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                        />
                        <input
                          type="text" placeholder="VALUE (E.G. 300 GSM MATTE)" value={row.value} onChange={(e) => updateFeatureRow(idx, 'value', e.target.value)}
                          className="flex-1 bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors touch-manipulation mt-2"
                >
                  {submitting ? 'SAVING' : 'LIST PRODUCT IN INVENTORY'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading state ── */}
        {loading && (
          <div className="px-5 py-8 font-space text-xs uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>■</motion.span>
            LOADING CATEGORY ARCHIVES...
          </div>
        )}

        {/* ── Error message ── */}
        {errorMsg && !loading && (
          <div className="px-5 py-12 text-center bg-white border-b-4 border-black">
            <p className="font-inter font-black text-4xl uppercase tracking-tighter text-neutral-300 mb-6">{errorMsg}</p>
            <Link to="/categories" className="font-space font-bold text-xs uppercase border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors">
              RETURN TO CATEGORIES
            </Link>
          </div>
        )}

        {/* ── Products Grid ── */}
        {!loading && !errorMsg && category && (
          <>

            {isCategoryEmpty ? (
              <div className="p-12 md:p-20 text-center bg-white">
                <p className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter text-neutral-300 mb-4">
                  THIS CATEGORY IS EMPTY
                </p>
                {isAdmin && (
                  <p className="font-space text-xs text-neutral-500 uppercase tracking-wide mb-6">
                    LIST PRODUCTS USING THE ADD SIGN OR CLICK THE TRASH ICON TO REMOVE THIS CATEGORY.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 bg-black gap-0.5 p-0.5">
                {products.map((product, idx) => {
                  const isWishlisted = wishlist.includes(product._id);
                  const isAdded = added[product._id];
                  const isSoldOut = product.stock === 0;

                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ ...spring, delay: (idx % 4) * 0.05 }}
                      whileHover={{ x: -4, y: -4, boxShadow: '6px 6px 0px 0px #000000' }}
                      className="bg-black border-2 border-black h-full flex flex-col group"
                    >
                      <div className="h-full flex flex-col bg-white">
                        {/* Image canvas with HoverMedia */}
                        <Link to={`/products/${product.slug}`} className="block relative">
                          <div className="w-full bg-stripes border-b-2 border-black relative flex items-center justify-center overflow-hidden"
                            style={{ aspectRatio: '3/4' }}>

                            <HoverMedia
                              coverImage={product.images && product.images[0]}
                              hoverVideo={product.hoverVideo}
                              alt={product.name}
                              fallbackSvg={getProductSvg(product.slug, idx)}
                            />

                            {isSoldOut && (
                              <div className="absolute top-0 left-0 font-space font-bold text-[8px] sm:text-[9px] md:text-[10px] px-2 py-1 uppercase tracking-wider border-r-2 border-b-2 border-black">
                                <span className="bg-neutral-500 text-white px-2 py-0.5 inline-block">SOLD OUT</span>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Description/meta */}
                        <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
                          <Link to={`/products/${product.slug}`}>
                            <span className="font-space text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-0.5">
                              {category?.name}
                            </span>
                            <h3 className="font-space font-extrabold text-sm sm:text-base md:text-lg uppercase tracking-tight leading-tight hover:text-neutral-500 transition-colors duration-75">
                              {product.name}
                            </h3>
                          </Link>

                          {isAdmin ? (
                            <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3">
                              {'█'.repeat(Math.round(product.rating || 5))}{'░'.repeat(5 - Math.round(product.rating || 5))} {product.salesCount || 0} SOLD
                            </div>
                          ) : (
                            <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3">
                              {'█'.repeat(Math.round(product.rating || 5))}{'░'.repeat(5 - Math.round(product.rating || 5))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-dashed border-neutral-200">
                            <div>
                              <div className="font-space font-black text-sm sm:text-base md:text-lg text-black leading-none">
                                ₹{product.sellingPrice?.toLocaleString('en-IN')}
                              </div>
                            </div>

                            <button
                              onClick={(e) => !isSoldOut && handleAdd(product, e)}
                              disabled={isSoldOut}
                              className={`flex items-center gap-1 font-space font-bold uppercase text-[8px] sm:text-[9px] md:text-xs px-2 sm:px-3 py-2 border-2 border-black transition-colors duration-100 touch-manipulation ${isSoldOut
                                  ? 'opacity-40 cursor-not-allowed bg-neutral-100'
                                  : isAdded
                                    ? 'bg-black text-white'
                                    : 'bg-black text-white hover:bg-white hover:text-black'
                                }`}
                            >
                              <Plus size={10} />
                              {isSoldOut ? 'OUT' : isAdded ? '✓' : 'ADD'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <div className="border-t-4 border-black px-5 md:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50">
          <p className="font-space text-[10px] md:text-xs text-neutral-500 uppercase tracking-wider">
            ALL PRINTS SHIP IN RIGID FLAT MAILERS · LIMITED TO 100 PER EDITION · HAND-NUMBERED
          </p>
          <Link
            to="/categories"
            className="font-space font-bold text-[10px] md:text-xs uppercase tracking-wider border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation shrink-0"
          >
            ← BROWSE ALL CATEGORIES
          </Link>
        </div>
      </div>

      <Footer />

      <Popup
        isOpen={deletePopupOpen}
        title="DELETE FANDOM CATEGORY"
        message={`ARE YOU SURE YOU WANT TO DELETE THE "${category?.name?.toUpperCase()}" CATEGORY? THIS ACTION CANNOT BE UNDONE.`}
        confirmText="YES, DELETE"
        cancelText="NO, CANCEL"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletePopupOpen(false)}
      />

      <Popup
        isOpen={createPopupOpen}
        title="LIST COLLECTIBLE PRINT"
        message={`CONFIRM UPLOADING "${name?.toUpperCase()}" THE IMAGES AND SAVING LISTING UNDER THE "${category?.name?.toUpperCase()}" CATEGORY.`}
        confirmText="YES, LIST PRINT"
        cancelText="NO, CANCEL"
        onConfirm={handleConfirmCreateProduct}
        onCancel={() => setCreatePopupOpen(false)}
      />

      {/* General Alert/Confirm Popup */}
      <Popup
        isOpen={alertPopup.isOpen}
        title={alertPopup.title}
        message={alertPopup.message}
        confirmText={alertPopup.confirmText}
        singleButton={alertPopup.singleButton}
        onConfirm={() => {
          alertPopup.onConfirm?.();
          setAlertPopup((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setAlertPopup((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
