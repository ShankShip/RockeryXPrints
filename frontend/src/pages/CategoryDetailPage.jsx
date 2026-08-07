import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Plus, Trash2, ArrowLeft, Upload, X, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { addToCart } from '../store/cartSlice';
import { SkeletonCard } from '../components/common/Skeleton';
import { getCategories, getProducts, addProductAPI, deleteCategoryAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Popup from '../components/landing/Popup';

const spring = { type: 'spring', bounce: 0, duration: 0.35 };
const ITEMS_PER_PAGE = 20;

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
          className="border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors px-3.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-solid-sm"
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
          className="border-2 border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors px-3.5 py-2 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-solid-sm"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function HoverMedia({ coverImage, hoverVideo, alt, fallbackSvg }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const videoSrc = hoverVideo || '';

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    if (videoSrc && videoRef.current) {
      videoRef.current.pause();
    }
  };

  useEffect(() => {
    if (isMobile && videoSrc && videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, [isMobile, videoSrc]);

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
          autoPlay={isMobile}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none z-0"
        />
      ) : null}

      {coverImage ? (
        <img
          src={coverImage}
          alt={alt || 'Product Image'}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${(isMobile || isHovered) && videoSrc ? 'opacity-0' : 'opacity-100'
            }`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center p-6 bg-stripes-light transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${(isMobile || isHovered) && videoSrc ? 'opacity-0' : 'opacity-100'
            }`}
        >
          <div className="w-full h-full text-xs font-space text-neutral-400 flex items-center justify-center bg-neutral-100">NO IMAGE</div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef(null);

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
    setCurrentPage(1);
    setErrorMsg('');
    try {
      // Get category object by fetching all categories and finding by slug or name
      const catRes = await getCategories(isAdmin);
      const allCats = catRes.data?.data || [];
      let foundCat = allCats.find((c) => c.slug === categorySlug || c.name.toLowerCase() === categorySlug.toLowerCase());

      if (!foundCat) {
        // Fallback: Query products directly using categorySlug with limit: 500
        const prodRes = await getProducts({ category: categorySlug, limit: 500 });
        const catProds = prodRes.data?.data?.docs || prodRes.data?.data?.products || prodRes.data?.data || [];
        if (catProds.length > 0) {
          const catObj = typeof catProds[0].category === 'object' ? catProds[0].category : catProds[0].categoryDetails;
          const derivedName = catObj?.name || categorySlug;
          foundCat = { _id: catObj?._id || catProds[0].category, name: derivedName, slug: categorySlug };
          setCategory(foundCat);
          setProducts(catProds);
          return;
        }
        setErrorMsg('Category not registered.');
        setLoading(false);
        return;
      }
      setCategory(foundCat);

      // Fetch ALL products filtered by active category ID with high limit (500)
      const prodRes = await getProducts({ category: foundCat._id, limit: 500 });
      let catProds = prodRes.data?.data?.docs || prodRes.data?.data?.products || prodRes.data?.data || [];

      // Fallback: If 0 products by ID, attempt lookup by category slug
      if (catProds.length === 0) {
        const retryRes = await getProducts({ category: foundCat.slug, limit: 500 });
        catProds = retryRes.data?.data?.docs || retryRes.data?.data?.products || retryRes.data?.data || [];
      }

      setProducts(catProds);
    } catch (err) {
      setErrorMsg('Error fetching category details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryDetails();
  }, [categorySlug, isAdmin]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      const newFiles = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const moveImage = (index, direction) => {
    const updated = [...imageFiles];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImageFiles(updated);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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

      <div className="pt-20" ref={gridTopRef}>

        {/* ── Page Header ── */}
        <div className="border-b-4 border-black px-5 md:px-12 py-8 md:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-white">
          <div>
            <Link to="/categories" className="font-space text-[10px] md:text-xs font-bold tracking-widest text-neutral-400 hover:text-black flex items-center gap-1 mb-2 uppercase">
              <ArrowLeft size={12} /> Back to Universes
            </Link>
            <h1 className="font-inter font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-none uppercase">
              {category?.name || 'Fandom'}
            </h1>
          </div>

          {/* Action options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Product Button */}
            {isAdmin && category && (
              <button
                onClick={() => { setFormOpen(!formOpen); setErrorMsg(''); }}
                className="border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-space font-bold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer touch-manipulation uppercase"
              >
                <Plus size={14} />
                <span>Add Product</span>
              </button>
            )}

            {/* Delete Category Button (Only if empty category and admin) */}
            {isAdmin && category && isCategoryEmpty && (
              <button
                onClick={() => setDeletePopupOpen(true)}
                className="border-2 border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600 transition-colors px-4 py-2 font-space font-bold text-xs tracking-wider flex items-center gap-1.5 cursor-pointer touch-manipulation uppercase"
              >
                <Trash2 size={14} />
                <span>Delete Category</span>
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
                  <h3 className="font-space font-black text-sm tracking-wider text-black flex items-center gap-2">
                    🛠 Add Print under: {category.name}
                  </h3>
                  <button type="button" onClick={() => setFormOpen(false)} className="text-neutral-500 hover:text-black">
                    <X size={18} />
                  </button>
                </div>

                {errorMsg && (
                  <div className="border-2 border-black bg-black text-white text-xs font-bold px-4 py-2.5">
                    ⚠ {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Print Name</label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Shinigami // 01" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2.5 font-space text-sm focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Category (Predefined)</label>
                    <input
                      type="text" disabled value={category.name}
                      className="w-full bg-neutral-200 border-2 border-black px-3.5 py-2.5 font-space text-sm text-neutral-500 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-black">Description</label>
                  <textarea
                    required value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter archival print specifics..." rows={3} style={{ fontSize: '16px' }}
                    className="w-full bg-white border-2 border-black px-3.5 py-2.5 font-space text-sm focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">MRP (INR)</label>
                    <input
                      type="number" required value={mrp} onChange={(e) => setMrp(e.target.value)}
                      placeholder="1599" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Selling Price</label>
                    <input
                      type="number" required value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="1299" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Stock Count</label>
                    <input
                      type="number" required value={stock} onChange={(e) => setStock(e.target.value)}
                      placeholder="80" min="0" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Delivery Days</label>
                    <input
                      type="number" required value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)}
                      placeholder="5" min="1" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">SKU (Optional)</label>
                    <input
                      type="text" value={sku} onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. RXP-ANI-001" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Search Tags (Comma separated)</label>
                    <input
                      type="text" value={searchTagsInput} onChange={(e) => setSearchTagsInput(e.target.value)}
                      placeholder="anime, shinigami, limited" style={{ fontSize: '16px' }}
                      className="w-full bg-white border-2 border-black px-3.5 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Multiple Images Upload & Optional Hover Video */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Upload Product Images * (Multiple)</label>
                    <div className="relative border-2 border-dashed border-black bg-white p-5 flex flex-col items-center justify-center text-center">
                      <input
                        type="file" multiple accept="image/*" required={imageFiles.length === 0} onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload size={20} className="text-neutral-400 mb-1" />
                      {imageFiles.length > 0 ? (
                        <span className="text-xs font-bold text-black">
                          + Add More Images ({imageFiles.length} Selected)
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          Click or drag to upload images
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-widest text-black">Hover Video (Optional - .mp4 / .webm)</label>
                    <div className="relative border-2 border-dashed border-black bg-white p-5 flex flex-col items-center justify-center text-center">
                      <input
                        type="file" accept="video/mp4,video/webm,video/*" onChange={(e) => setHoverVideoFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Film size={20} className="text-neutral-400 mb-1" />
                      {hoverVideoFile ? (
                        <span className="text-xs font-bold text-black truncate">
                          {hoverVideoFile.name}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 truncate">
                          Upload hover video (.mp4, .webm)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Re-orderable Image Thumbnails Grid */}
                {imageFiles.length > 0 && (
                  <div className="border-2 border-black bg-neutral-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-bold tracking-widest text-black">
                        Sequence & Re-order Images
                      </label>
                      <button
                        type="button"
                        onClick={() => setImageFiles([])}
                        className="text-[9px] font-bold text-red-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {imageFiles.map((file, idx) => {
                        const previewUrl = URL.createObjectURL(file);
                        return (
                          <div key={idx} className="relative border-2 border-black bg-white p-1.5 flex flex-col justify-between shadow-solid-sm">
                            <div className="relative aspect-3/4 w-full bg-neutral-100 border border-black overflow-hidden mb-1.5">
                              <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 text-[8px] font-black uppercase px-1.5 py-0.5 border border-black bg-black text-white">
                                #{idx + 1}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, -1)}
                                title="Move Left / Earlier"
                                className="flex-1 bg-white hover:bg-black hover:text-white border border-black py-0.5 text-[10px] font-bold uppercase disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={idx === imageFiles.length - 1}
                                onClick={() => moveImage(idx, 1)}
                                title="Move Right / Later"
                                className="flex-1 bg-white hover:bg-black hover:text-white border border-black py-0.5 text-[10px] font-bold uppercase disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
                              >
                                →
                              </button>
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                title="Remove Image"
                                className="bg-red-600 text-white hover:bg-black border border-black px-1.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Features key-value list */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold tracking-widest text-black">Product Specifications</label>
                    <button type="button" onClick={addFeatureRow} className="border border-black px-2 py-1 font-bold text-[9px] hover:bg-black hover:text-white transition-colors">
                      + Add Row
                    </button>
                  </div>
                  <div className="space-y-2">
                    {featureRows.map((row, idx) => (
                      <div key={idx} className="flex gap-3">
                        <input
                          type="text" placeholder="Key (e.g. Paper)" value={row.key} onChange={(e) => updateFeatureRow(idx, 'key', e.target.value)}
                          className="flex-1 bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                        />
                        <input
                          type="text" placeholder="Value (e.g. 300 GSM Matte)" value={row.value} onChange={(e) => updateFeatureRow(idx, 'value', e.target.value)}
                          className="flex-1 bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit" disabled={submitting}
                  className="w-full bg-black text-white font-space font-bold text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors touch-manipulation mt-2"
                >
                  {submitting ? 'Saving...' : 'List Product in Inventory'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white p-4 border-2 border-black">
                <SkeletonCard />
              </div>
            ))}
          </div>
        )}

        {/* ── Error message ── */}
        {errorMsg && !loading && (
          <div className="px-5 py-12 text-center bg-white border-b-4 border-black">
            <p className="font-inter font-black text-4xl tracking-tighter text-neutral-300 mb-6">{errorMsg}</p>
            <Link to="/categories" className="font-space font-bold text-xs border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors">
              Return to Categories
            </Link>
          </div>
        )}

        {/* ── Products Grid ── */}
        {!loading && !errorMsg && category && (
          <>

            {isCategoryEmpty ? (
              <div className="p-12 md:p-20 text-center bg-white">
                <p className="font-inter font-black text-3xl md:text-5xl tracking-tighter text-neutral-300 mb-4 uppercase">
                  This Category is Empty
                </p>
                {isAdmin && (
                  <p className="font-space text-xs text-neutral-500 tracking-wide mb-6 uppercase">
                    List products using the add sign or click the trash icon to remove this category.
                  </p>
                )}
              </div>
            ) : (
              <>
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={products.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  position="top"
                />
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 bg-black gap-0.5 p-0.5">
                  {paginatedProducts.map((product, idx) => {
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

                              />

                              {isSoldOut && (
                                <div className="absolute top-0 left-0 font-space font-bold text-[8px] sm:text-[9px] md:text-[10px] px-2 py-1 uppercase tracking-wider border-r-2 border-b-2 border-black">
                                  <span className="bg-neutral-500 text-white px-2 py-0.5 inline-block uppercase">SOLD OUT</span>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Description/meta */}
                          <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
                            <Link to={`/products/${product.slug}`}>
                              <span className="font-space uppercase text-[8px] sm:text-[9px] font-bold tracking-widest text-neutral-400 block mb-0.5">
                                {category?.name}
                              </span>
                              <h3 className="font-space font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-tight hover:text-neutral-500 transition-colors duration-75">
                                {product.name}
                              </h3>
                            </Link>

                            {Boolean(product.totalRatings && product.totalRatings > 0 && product.rating && product.rating > 0) ? (
                              <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
                                {'█'.repeat(Math.round(product.rating))}{'░'.repeat(5 - Math.round(product.rating))}
                                {isAdmin ? ` ${product.salesCount || 0} sold` : ''}
                              </div>
                            ) : isAdmin && product.salesCount > 0 ? (
                              <div className="font-space text-[8px] sm:text-[9px] text-neutral-400 mt-1 mb-3 uppercase">
                                {product.salesCount} sold
                              </div>
                            ) : null}

                            <div className="flex items-center justify-between mt-auto pt-3 border-t-2 border-dashed border-neutral-200">
                              <div>
                                <div className="font-space font-black text-sm sm:text-base md:text-lg text-black leading-none">
                                  ₹{product.sellingPrice?.toLocaleString('en-IN')}
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
                  totalItems={products.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </>
        )}

        {/* Footer note */}
        <div className="border-t-4 border-black px-5 md:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50">
          <p className="font-space text-[10px] md:text-xs text-neutral-500 tracking-wider">
            All prints ship in rigid flat mailers · Limited to 100 per edition · Hand-numbered
          </p>
          <Link
            to="/categories"
            className="font-space font-bold text-[10px] md:text-xs tracking-wider border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-75 touch-manipulation shrink-0"
          >
            ← Browse All Categories
          </Link>
        </div>
      </div>

      <Footer />

      <Popup
        isOpen={deletePopupOpen}
        title="Delete Fandom Category"
        message={`Are you sure you want to delete the "${category?.name}" category? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletePopupOpen(false)}
      />

      <Popup
        isOpen={createPopupOpen}
        title="List Collectible Print"
        message={`Confirm uploading "${name}" images and saving listing under the "${category?.name}" category.`}
        confirmText="Yes, List Print"
        cancelText="No, Cancel"
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
