// src/pages/ProductDetailPage.jsx
// Displays a single product detail view loaded strictly from the backend database
// Top-notch industry professional brutalist ecommerce product experience
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingBag,
  Plus,
  Minus,
  ChevronDown,
  Edit3,
  Trash2,
  Upload,
  X,
  Truck,
  ShieldCheck,
  Maximize2,
  Check,
  Zap,
  Award,
  Share2,
  ArrowRight
} from 'lucide-react';
import { addToCart as addToCartSlice } from '../store/cartSlice';
import { SkeletonDetail } from '../components/common/Skeleton';
import { getProductBySlug, updateProductAPI, deleteProductAPI, getProducts, addOrUpdateReviewAPI, getProductReviewsAPI, deleteReviewAPI } from '../services/api';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Popup from '../components/landing/Popup';

const spring = { type: 'spring', bounce: 0, duration: 0.3 };

function AccordionSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t-2 border-black">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 font-space font-bold text-xs md:text-sm uppercase tracking-wider text-black hover:text-neutral-500 transition-colors duration-75 touch-manipulation text-left"
      >
        <span>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="shrink-0 ml-2">
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedSize, setSelectedSize] = useState('12" × 16"');
  const [selectedFrame, setSelectedFrame] = useState('20MM BLACK WOOD');

  // Fullscreen Image Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [userRating, setUserRating] = useState(5);
  const [userMessage, setUserMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Edit form states
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editDeliveryDays, setEditDeliveryDays] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editFeatures, setEditFeatures] = useState([]);
  const [editImageFiles, setEditImageFiles] = useState([]);
  const [editImageList, setEditImageList] = useState([]);
  const [editHoverVideoFile, setEditHoverVideoFile] = useState(null);
  const [editRemoveHoverVideo, setEditRemoveHoverVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);

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

  const fetchReviews = (productId) => {
    if (!productId) return;
    getProductReviewsAPI(productId)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setReviews(data.reviews || []);
          if (data.ratingBreakdown) {
            setRatingBreakdown(data.ratingBreakdown);
          }
        }
      })
      .catch(() => { });
  };

  const fetchProductDetails = () => {
    setLoading(true);
    setErrorMsg('');
    getProductBySlug(slug)
      .then((res) => {
        const data = res.data?.data;
        if (data) {
          setProduct(data);
          setActiveThumb(0);
          setQty(1);

          if (data.userReview) {
            setUserRating(data.userReview.rating || 5);
            setUserMessage(data.userReview.message || '');
          }

          fetchReviews(data._id);

          // Initialize edit states
          setEditName(data.name || '');
          setEditDesc(data.description || '');
          setEditMrp(data.mrp || '');
          setEditSellingPrice(data.sellingPrice || '');
          setEditStock(data.stock || 0);
          setEditDeliveryDays(data.deliveryDays || 5);
          setEditSku(data.sku || '');
          setEditTagsInput(data.searchTags?.join(', ') || '');
          setEditFeatures(data.features || []);
          setEditHoverVideoFile(null);
          if (Array.isArray(data.images)) {
            setEditImageList(
              data.images.map((url, idx) => ({
                id: `url_${idx}_${Date.now()}`,
                type: 'url',
                url
              }))
            );
          }

          // Weighted scoring algorithm for related products: name > tags > category
          const nameTokens = data.name ? data.name.toLowerCase().split(/\s+/).filter(w => w.length > 2) : [];
          const currentTags = Array.isArray(data.searchTags) ? data.searchTags.map(t => t.toLowerCase().trim()) : [];
          const currentCategoryId = data.category?._id || data.category;

          getProducts()
            .then((pRes) => {
              const allProds = pRes.data?.data?.docs || pRes.data?.data?.products || pRes.data?.data || [];
              if (Array.isArray(allProds)) {
                const otherProds = allProds.filter((p) => p.slug !== slug);

                const scoredProds = otherProds.map(p => {
                  let score = 0;
                  
                  // 1. Nearby names (word overlap) (+10 pts per matching word)
                  if (p.name) {
                    const pNameTokens = p.name.toLowerCase().split(/\s+/);
                    let nameMatches = 0;
                    for (const token of nameTokens) {
                      if (pNameTokens.some(pt => pt.includes(token) || token.includes(pt))) {
                        nameMatches++;
                      }
                    }
                    score += nameMatches * 10;
                  }

                  // 2. Search tags overlap (+5 pts per matching tag)
                  if (Array.isArray(p.searchTags)) {
                    let tagMatches = 0;
                    const pTags = p.searchTags.map(t => t.toLowerCase().trim());
                    for (const tag of currentTags) {
                      if (pTags.includes(tag)) tagMatches++;
                    }
                    score += tagMatches * 5;
                  }

                  // 3. Category match (+2 pts)
                  const pCategoryId = p.category?._id || p.category;
                  if (currentCategoryId && pCategoryId && String(currentCategoryId) === String(pCategoryId)) {
                    score += 2;
                  }

                  return { product: p, score };
                });

                // Sort by score descending
                scoredProds.sort((a, b) => b.score - a.score);

                // Take top 10 matching products
                const matched = scoredProds.map(sp => sp.product);
                setRelatedProducts(matched.slice(0, 10));
              }
            })
            .catch(() => {});
        } else {
          setErrorMsg('PRODUCT NOT REGISTERED IN INVENTORY.');
        }
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message || 'ERROR CONNECTING TO PRODUCT DATABASE.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCartSlice({ product, quantity: qty }));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addToCartSlice({ product, quantity: qty }));
    navigate('/cart');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!product) return;
    if (!userRating) {
      setReviewErrorMsg('RATING IS MANDATORY');
      return;
    }
    if (!userMessage.trim()) {
      setReviewErrorMsg('ENTER A REVIEW MESSAGE');
      return;
    }

    setSubmittingReview(true);
    setReviewErrorMsg('');
    setReviewSuccessMsg('');

    addOrUpdateReviewAPI(product._id, { rating: userRating, message: userMessage })
      .then(() => {
        setReviewSuccessMsg('YOUR REVIEW HAS BEEN SUBMITTED!');
        fetchProductDetails();
        fetchReviews(product._id);
      })
      .catch((err) => {
        setReviewErrorMsg(err.response?.data?.message || 'FAILED TO SUBMIT REVIEW.');
      })
      .finally(() => setSubmittingReview(false));
  };

  const handleDeleteReview = (reviewId) => {
    triggerAlert(
      'DELETE THIS REVIEW? THIS ACTION CANNOT BE UNDONE.',
      'CONFIRM DELETION',
      () => {
        deleteReviewAPI(reviewId)
          .then(() => {
            setUserMessage('');
            setUserRating(5);
            fetchProductDetails();
            fetchReviews(product._id);
          })
          .catch((err) => {
            triggerAlert(err.response?.data?.message || 'FAILED TO DELETE REVIEW', 'ERROR OCCURRED');
          });
      },
      false,
      'YES, DELETE'
    );
  };

  const handleEditFileAdd = (e) => {
    if (e.target.files) {
      const newItems = Array.from(e.target.files).map((file, idx) => ({
        id: `file_${idx}_${Date.now()}_${Math.random()}`,
        type: 'file',
        file,
        url: URL.createObjectURL(file)
      }));
      setEditImageList((prev) => [...prev, ...newItems]);
    }
  };

  const moveEditImage = (index, direction) => {
    const updated = [...editImageList];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setEditImageList(updated);
  };

  const removeEditImage = (index) => {
    setEditImageList((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Edit API
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', editName);
    formData.append('description', editDesc);
    formData.append('mrp', editMrp);
    formData.append('sellingPrice', editSellingPrice);
    formData.append('category', product.category?._id || product.category);
    formData.append('stock', editStock);
    formData.append('deliveryDays', editDeliveryDays);
    formData.append('sku', editSku);

    const tagsArr = editTagsInput.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t);
    tagsArr.forEach((tag) => formData.append('searchTags[]', tag));

    const featuresArr = editFeatures.filter((f) => f.key && f.value);
    formData.append('features', JSON.stringify(featuresArr));

    // Construct imageManifest for exact sequential ordering
    const manifest = editImageList.map((item) => {
      if (item.type === 'url') return { type: 'url', url: item.url };
      return { type: 'file' };
    });
    formData.append('imageManifest', JSON.stringify(manifest));

    // Append new file objects in exact sequence
    const newFileItems = editImageList.filter((item) => item.type === 'file');
    for (let i = 0; i < newFileItems.length; i++) {
      formData.append('images', newFileItems[i].file);
    }

    if (editRemoveHoverVideo) {
      formData.append('removeHoverVideo', 'true');
    } else if (editHoverVideoFile) {
      formData.append('hoverVideo', editHoverVideoFile);
    }

    try {
      await updateProductAPI(product._id, formData);
      setEditOpen(false);
      fetchProductDetails();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'FAILED TO UPDATE PRODUCT DETAILS.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!product) return;
    setDeletePopupOpen(false);

    try {
      await deleteProductAPI(product._id);
      navigate('/categories');
    } catch (err) {
      triggerAlert(err?.response?.data?.message || 'FAILED TO REMOVE PRODUCT.', 'ERROR OCCURRED');
    }
  };

  const addFeatureRow = () => setEditFeatures([...editFeatures, { key: '', value: '' }]);
  const updateFeatureRow = (idx, field, val) => {
    const updated = [...editFeatures];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditFeatures(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black font-space">
        <Navbar />
        <SkeletonDetail />
      </div>
    );
  }

  if (errorMsg && !editOpen && !product) {
    return (
      <div className="min-h-screen bg-white text-black font-space flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="pt-36 pb-20 px-6 text-center">
            <h1 className="font-inter font-black text-3xl md:text-5xl uppercase tracking-tighter text-neutral-300 mb-6">
              {errorMsg || 'PRODUCT NOT FOUND'}
            </h1>
            <Link
              to="/shop"
              className="inline-block border-2 border-black bg-black text-white px-8 py-4 font-bold text-xs uppercase hover:bg-white hover:text-black transition-colors"
            >
              RETURN TO SHOP INVENTORY
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  const saving = product.mrp - product.sellingPrice;
  const discountPercent = product.mrp ? Math.round((saving / product.mrp) * 100) : 0;
  const totalImages = product.images && product.images.length > 0 ? product.images.length : 1;

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col justify-between antialiased">
      <div>
        <Navbar />

        {/* Breadcrumb Navigation */}
        <div className="pt-20 border-b-2 border-black px-6 md:px-12 py-3 font-space text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest flex items-center justify-between overflow-x-auto whitespace-nowrap bg-neutral-50">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-black transition-colors shrink-0">HOME</Link>
            <span className="shrink-0 text-neutral-300">/</span>
            <Link to="/categories" className="hover:text-black transition-colors shrink-0">
              {product.category?.name || 'CATEGORY'}
            </Link>
            <span className="shrink-0 text-neutral-300">/</span>
            <span className="text-black font-bold shrink-0 truncate max-w-xs">{product.name}</span>
          </div>
        </div>

        {/* Main PDP Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-120px)] border-b-4 border-black">

          {/* ── LEFT: INTERACTIVE IMAGE GALLERY (7 cols on lg) ── */}
          <div className="lg:col-span-7 border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-[#FAFAFA] flex flex-col justify-start relative select-none">

            {/* Main Display Canvas */}
            <div className="relative flex items-center justify-center p-6 md:p-12 min-h-95 md:min-h-130">

              {/* Fullscreen Magnify Button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-4 right-4 bg-white text-black border-2 border-black p-2 hover:bg-black hover:text-white transition-colors duration-75 z-20 shadow-solid-sm cursor-pointer"
                title="EXPAND FULLSCREEN VIEW"
              >
                <Maximize2 size={16} />
              </button>

              {/* Image Container */}
              <div
                onClick={() => setLightboxOpen(true)}
                className="overflow-hidden group cursor-zoom-in relative flex items-center justify-center max-w-full max-h-[65vh]"
              >
                {product.images && product.images[activeThumb] ? (
                  <img
                    src={product.images[activeThumb]}
                    alt={product.name}
                    className="max-h-[60vh] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-64 h-80 flex items-center justify-center p-8 bg-stripes-light border-2 border-black">
                    <div className="font-space text-xs font-bold text-neutral-400">NO IMAGE</div>
                  </div>
                )}
              </div>

              {/* Stock / Urgency Badge */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
                {product.stock <= 10 && (
                  <span className="bg-black text-white font-space text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest border-2 border-black shadow-solid-sm">
                    {product.stock === 0 ? 'SOLD OUT' : `LIMITED RUN · ONLY ${product.stock} LEFT`}
                  </span>
                )}
              </div>

              {/* Image Index Tag */}
              <span className="absolute bottom-4 right-4 font-space text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-white border border-black px-2.5 py-1">
                {String(activeThumb + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
              </span>
            </div>

            {/* Thumbnail Navigation Strip */}
            <div className="border-t-2 border-black bg-white grid grid-cols-4 divide-x-2 divide-black">
              {product.images && product.images.length > 0 ? (
                product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    className={`aspect-square p-2 bg-neutral-50 flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${activeThumb === i ? 'bg-white ring-4 ring-inset ring-black opacity-100' : 'opacity-50 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))
              ) : (
                [0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    className={`aspect-square p-2 bg-neutral-50 flex items-center justify-center transition-all cursor-pointer relative ${activeThumb === i ? 'bg-white ring-4 ring-inset ring-black opacity-100' : 'opacity-50 hover:opacity-100'
                      }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center font-space text-[8px] text-neutral-400">N/A</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT: PRODUCT SPECS & ACTION PANEL (5 cols on lg) ── */}
          <div className="lg:col-span-5 flex flex-col p-6 md:p-10 bg-white justify-between">
            <div>
              {/* Category + SKU Header Bar */}
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b-2 border-neutral-200 font-space">
                <span className="text-[10px] font-bold uppercase tracking-widest border-2 border-black px-2.5 py-1 bg-black text-white">
                  {product.category?.name || 'COLLECTIBLE PRINT'}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  SKU: {product.sku}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => { setEditOpen(!editOpen); setErrorMsg(''); }}
                    className="border-2 border-black bg-white hover:bg-black hover:text-white transition-colors px-3 py-1 font-space font-bold text-[10px] uppercase tracking-wider ml-auto flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>{editOpen ? 'CANCEL EDIT' : 'EDIT PRODUCT'}</span>
                  </button>
                )}
              </div>

              {editOpen && isAdmin ? (
                /* ── ADMIN EDIT PRODUCT FORM ── */
                <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4 font-space py-2">
                  <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                    <h2 className="font-inter font-black text-lg uppercase tracking-tight">🛠 EDIT PRODUCT SPECS</h2>
                    <button
                      type="button"
                      onClick={() => setDeletePopupOpen(true)}
                      className="text-red-600 hover:text-white hover:bg-red-600 transition-colors px-2 py-1 border border-red-600 flex items-center gap-1 font-bold text-[9px]"
                    >
                      <Trash2 size={11} /> DELETE
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="border-2 border-black bg-black text-white text-[10px] font-bold uppercase px-3 py-2">
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">PRODUCT NAME</label>
                    <input
                      type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-xs uppercase focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">DESCRIPTION</label>
                    <textarea
                      required value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                      rows={3} className="w-full bg-white border-2 border-black px-3 py-2 text-xs uppercase focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">MRP (INR)</label>
                      <input
                        type="number" required value={editMrp} onChange={(e) => setEditMrp(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">SELLING PRICE</label>
                      <input
                        type="number" required value={editSellingPrice} onChange={(e) => setEditSellingPrice(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">STOCK COUNT</label>
                      <input
                        type="number" required value={editStock} onChange={(e) => setEditStock(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">DELIVERY DAYS</label>
                      <input
                        type="number" required value={editDeliveryDays} onChange={(e) => setEditDeliveryDays(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">SKU</label>
                      <input
                        type="text" value={editSku} onChange={(e) => setEditSku(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs uppercase focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 block mb-1">SEARCH TAGS</label>
                      <input
                        type="text" value={editTagsInput} onChange={(e) => setEditTagsInput(e.target.value)}
                        className="w-full bg-white border-2 border-black px-3 py-1.5 text-xs uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Specification key-value fields list */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">SPECIFICATIONS</label>
                      <button type="button" onClick={addFeatureRow} className="border border-black px-2 py-0.5 font-bold text-[8px] hover:bg-black hover:text-white transition-colors">
                        + ADD ROW
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {editFeatures.map((feat, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text" placeholder="KEY" value={feat.key} onChange={(e) => updateFeatureRow(idx, 'key', e.target.value)}
                            className="flex-1 bg-white border-2 border-black px-2 py-1 text-xs focus:outline-none"
                          />
                          <input
                            type="text" placeholder="VALUE" value={feat.value} onChange={(e) => updateFeatureRow(idx, 'value', e.target.value)}
                            className="flex-1 bg-white border-2 border-black px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Re-orderable Product Images Section */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-black">
                        PRODUCT IMAGES
                      </label>
                      <span className="text-[9px] font-bold uppercase text-neutral-400">
                        {editImageList.length} TOTAL IMAGES
                      </span>
                    </div>

                    {/* Image Thumbnails Grid */}
                    {editImageList.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-neutral-50 p-2.5 border-2 border-black">
                        {editImageList.map((item, idx) => (
                          <div key={item.id || idx} className="relative border-2 border-black bg-white p-1.5 flex flex-col justify-between shadow-solid-sm">
                            <div className="relative aspect-3/4 w-full bg-neutral-100 border border-black overflow-hidden mb-1">
                              <img src={item.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute top-1 left-1 text-[8px] font-black uppercase px-1.5 py-0.5 border border-black bg-black text-white">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveEditImage(idx, -1)}
                                title="Move Earlier"
                                className="flex-1 bg-white hover:bg-black hover:text-white border border-black py-0.5 text-[9px] font-bold uppercase disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={idx === editImageList.length - 1}
                                onClick={() => moveEditImage(idx, 1)}
                                title="Move Later"
                                className="flex-1 bg-white hover:bg-black hover:text-white border border-black py-0.5 text-[9px] font-bold uppercase disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black cursor-pointer"
                              >
                                →
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEditImage(idx)}
                                title="Delete Image"
                                className="bg-red-600 text-white hover:bg-black border border-black px-1.5 py-0.5 text-[9px] font-bold uppercase cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add More Images Button */}
                    <div className="relative border-2 border-dashed border-black bg-white p-3 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                      <input
                        type="file" multiple accept="image/*" onChange={handleEditFileAdd}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload size={14} className="mx-auto text-neutral-400 mb-1" />
                      <span className="text-[10px] font-bold uppercase text-black block">
                        + UPLOAD & APPEND MORE IMAGES
                      </span>
                    </div>
                  </div>

                  {/* Update Hover Video (Optional) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">UPDATE HOVER VIDEO (OPTIONAL - .MP4 / .WEBM)</label>
                      {product?.hoverVideo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditRemoveHoverVideo(!editRemoveHoverVideo);
                            setEditHoverVideoFile(null);
                          }}
                          className={`text-[8px] font-extrabold uppercase px-2 py-0.5 border border-black cursor-pointer transition-colors ${
                            editRemoveHoverVideo
                              ? 'bg-black text-white'
                              : 'bg-red-600 text-white hover:bg-black'
                          }`}
                        >
                          {editRemoveHoverVideo ? '↩ UNDO REMOVAL' : '✕ REMOVE HOVER VIDEO'}
                        </button>
                      )}
                    </div>

                    {editRemoveHoverVideo ? (
                      <div className="border-2 border-red-600 bg-red-50 p-2.5 text-center text-[9px] font-bold uppercase text-red-600">
                        HOVER VIDEO MARKED FOR DELETION (WILL BE REMOVED ON SAVE)
                      </div>
                    ) : (
                      <div className="relative border-2 border-dashed border-black bg-white p-3 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                        <input
                          type="file" accept="video/mp4,video/webm,video/*" onChange={(e) => setEditHoverVideoFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold uppercase text-black truncate block">
                          {editHoverVideoFile ? editHoverVideoFile.name : product?.hoverVideo ? 'CLICK TO REPLACE EXISTING HOVER VIDEO' : 'CLICK TO UPLOAD NEW HOVER VIDEO'}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer mt-2"
                  >
                    {submitting ? 'SAVING CHANGES...' : 'SAVE PRODUCT DETAILS'}
                  </button>
                </form>
              ) : (
                /* ── REGULAR PRODUCT DETAILS VIEW ── */
                <div>
                  {/* Product Title */}
                  <h1 className="font-inter font-black text-3xl sm:text-4xl md:text-5xl tracking-tighter leading-none text-black mb-3">
                    {product.name}
                  </h1>

                  {/* Rating + Total Rating Line + Sold Count */}
                  <div className="flex flex-wrap items-center gap-3 font-space text-xs text-neutral-500 uppercase tracking-wider mb-6">
                    <div className="flex items-center gap-1.5 text-black font-bold">
                      <span className="text-amber-500">★</span>
                      <span>{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
                      <span className="text-neutral-400 font-normal">
                        ({product.totalRatings || reviews.length || 0} total ratings)
                      </span>
                    </div>
                    {isAdmin && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-black">{product.salesCount || 0} UNITS SOLD</span>
                      </>
                    )}
                  </div>

                  {/* Price Banner */}
                  <div className="border-4 border-black p-5 mb-6 bg-white shadow-solid-sm flex flex-col justify-between">
                    <div className="flex items-baseline gap-3">
                      <span className="font-space font-black text-4xl md:text-5xl text-black tracking-tight">
                        ₹{product.sellingPrice?.toLocaleString('en-IN')}
                      </span>
                      {saving > 0 && (
                        <span className="font-space text-base text-neutral-400 line-through">
                          ₹{product.mrp?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {saving > 0 && (
                      <div className="mt-2 flex items-center gap-2 font-space text-xs">
                        <span className="bg-black text-white font-bold px-2.5 py-1 uppercase text-[10px]">
                          SAVE ({discountPercent}% OFF)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between mb-6 font-space">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">QUANTITY</span>
                    <div className="flex items-center border-2 border-black bg-white">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-10 h-10 flex items-center justify-center border-r-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer touch-manipulation"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-bold text-sm">{qty}</span>
                      <button
                        onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                        className="w-10 h-10 flex items-center justify-center border-l-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer touch-manipulation"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="flex items-center gap-3 mb-8">
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      className={`btn-brutal flex-1 py-4 border-4 border-black text-sm shadow-solid ${product.stock === 0
                        ? '!bg-neutral-100 !text-neutral-400 !border-neutral-300 cursor-not-allowed shadow-none hover:!bg-neutral-100 hover:!text-neutral-400'
                        : added
                          ? '!bg-black !text-white'
                          : ''
                        }`}
                    >
                      <ShoppingBag size={18} />
                      {product.stock === 0 ? 'SOLD OUT' : added ? '✓ ADDED TO INVENTORY' : 'ADD TO CART'}
                    </motion.button>

                    <button
                      onClick={handleShare}
                      className="btn-brutal !bg-white !text-black hover:!bg-black hover:!text-white border-4 border-black p-4 text-xs shadow-solid shrink-0"
                      title="SHARE THIS PRODUCT"
                    >
                      <Share2 size={18} />
                      <span className="hidden sm:inline">{copiedLink ? '✓ COPIED!' : 'SHARE'}</span>
                    </button>
                  </div>

                  {/* Description Paragraph */}
                  <div className="mb-8">
                    <h4 className="font-space text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                      CURATOR NOTES
                    </h4>
                    <p className="font-space text-xs md:text-sm text-neutral-700 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Accordion Sections */}
                  <div className="border-b-2 border-black bg-white">
                    {product.features && product.features.length > 0 && (
                      <AccordionSection title="SPECS & DIMENSIONS" defaultOpen={true}>
                        <table className="w-full font-space text-xs">
                          <tbody>
                            {product.features.map((f) => (
                              <tr key={f.key} className="border-t border-neutral-200">
                                <td className="py-2 pr-3 text-neutral-500 uppercase tracking-wider w-2/5">{f.key}</td>
                                <td className="py-2 font-bold uppercase text-right md:text-left">{f.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </AccordionSection>
                    )}

                    <AccordionSection title="SHIPPING & HANDLING">
                      <div className="font-space text-xs text-neutral-600 leading-relaxed space-y-1.5">
                        <p>✓ FREE RIGID MAILER SHIPPING ON ALL ORDERS.</p>
                        <p>✓ ESTIMATED DISPATCH: {product.deliveryDays || 5} BUSINESS DAYS.</p>
                        <p>✓ SHIPS IN FLAT REINFORCED PACKAGING (NO ROLL TUBES).</p>
                        <p>✓ LIVE TRACKING PROVIDED POST DISPATCH.</p>
                      </div>
                    </AccordionSection>

                    <AccordionSection title="MATERIALS & ARCHIVAL QUALITY">
                      <div className="font-space text-xs text-neutral-600 leading-relaxed space-y-1.5">
                        <p>✓ 300 GSM HEAVYWEIGHT ARCHIVAL MATTE PAPER (ACID-FREE).</p>
                        <p>✓ HIGH-RESOLUTION MONOCHROME PIGMENT INKJET PRINTING.</p>
                        <p>✓ 20MM SOLID WOOD MATTE BLACK FRAME WITH CORNER REINFORCEMENTS.</p>
                        <p>✓ 3MM GALLERY-GRADE ANTI-GLARE PROTECTIVE GLASS.</p>
                      </div>
                    </AccordionSection>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RECOMMENDED FRAMES SECTION ── */}
        {relatedProducts.length > 0 && (
          <section className="bg-white border-b-4 border-black py-12 px-6 md:px-12 select-none">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b-2 border-black">
                <div>
                  <h3 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter">
                    YOU MAY ALSO LIKE
                  </h3>
                </div>

                <Link
                  to="/shop"
                  className="font-space font-bold text-xs uppercase border-2 border-black px-4 py-2.5 bg-white hover:bg-black hover:text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>VIEW ENTIRE SHOP</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="flex gap-6 overflow-x-auto pb-6 brutalist-scrollbar snap-x snap-mandatory">
                <style>{`
                  .brutalist-scrollbar::-webkit-scrollbar { height: 10px; }
                  .brutalist-scrollbar::-webkit-scrollbar-track { background: #f0f0f0; border: 2px solid #000; }
                  .brutalist-scrollbar::-webkit-scrollbar-thumb { background: #000; border: 1px solid #000; }
                  .brutalist-scrollbar::-webkit-scrollbar-thumb:hover { background: #222; }
                `}</style>
                {relatedProducts.map((relProd, idx) => (
                  <motion.div
                    key={relProd._id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: idx * 0.08 }}
                    onClick={() => navigate(`/products/${relProd.slug}`)}
                    className="border-2 border-black bg-white p-4 flex flex-col justify-between group hover:shadow-solid cursor-pointer transition-all duration-150 shrink-0 w-[280px] snap-start"
                  >
                    <div>
                      <div className="w-full aspect-3/4 bg-neutral-100 border-2 border-black relative mb-4 overflow-hidden flex items-center justify-center">
                        {relProd.images && relProd.images[0] ? (
                          <img
                            src={relProd.images[0]}
                            alt={relProd.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <div className="font-space text-[10px] font-bold text-neutral-400">NO IMAGE</div>
                          </div>
                        )}
                      </div>
                      <span className="font-space text-[9px] font-bold text-neutral-400 tracking-widest uppercase block mb-1">
                        {relProd.category?.name || 'CATEGORY'}
                      </span>
                      <h4 className="font-space font-extrabold text-sm uppercase tracking-tight text-black mb-2 group-hover:text-neutral-500 transition-colors">
                        {relProd.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-neutral-200">
                      <span className="font-space font-black text-base text-black">
                        ₹{relProd.sellingPrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="font-space text-[10px] font-bold uppercase border border-black px-2 py-1 bg-neutral-100">
                        VIEW →
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CUSTOMER REVIEWS & RATINGS BLOCK ── */}
        <section className="bg-neutral-50 border-b-4 border-black py-16 px-6 md:px-12 select-none">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b-2 border-black">
              <div>
                <h3 className="font-inter font-black text-3xl md:text-4xl uppercase tracking-tighter">
                  REVIEWS & RATINGS
                </h3>
              </div>
              <div className="font-space text-xs font-bold uppercase border-2 border-black px-4 py-2 bg-white text-black shadow-solid-sm self-start sm:self-auto">
                {product?.totalRatings || reviews.length || 0} TOTAL RATINGS
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Summary & Rating Breakdown */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="border-4 border-black p-6 bg-white shadow-solid">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="font-space font-black text-6xl text-black">
                      {product?.rating ? Number(product.rating).toFixed(1) : '5.0'}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center text-amber-500 text-lg">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {star <= Math.round(product?.rating || 5) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="font-space text-xs font-bold text-neutral-500 uppercase mt-0.5">
                        OUT OF 5 STARS
                      </span>
                    </div>
                  </div>
                  <p className="font-space text-xs text-neutral-600 uppercase tracking-wider">
                    BASED ON {product?.totalRatings || reviews.length || 0} USER RATINGS
                  </p>
                </div>

                {/* Rating Breakdown Bars */}
                <div className="border-4 border-black p-6 bg-white shadow-solid font-space">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-black mb-4">
                    RATING DISTRIBUTION
                  </h4>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingBreakdown[stars] || 0;
                      const total = reviews.length || 1;
                      const percent = Math.round((count / total) * 100);
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-10 font-bold">{stars} ★</span>
                          <div className="flex-1 bg-neutral-100 border-2 border-black h-3.5 overflow-hidden">
                            <div
                              className="bg-black h-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-neutral-500 font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Write/Edit Review Form + Reviews List */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                {/* Review Form */}
                <div className="border-4 border-black p-6 md:p-8 bg-white shadow-solid font-space">
                  <h4 className="font-inter font-black text-xl uppercase tracking-tight mb-2 text-black">
                    {product?.userReview ? 'EDIT YOUR REVIEW' : 'WRITE A REVIEW'}
                  </h4>

                  {product?.isPurchased ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
                      {reviewErrorMsg && (
                        <div className="border-2 border-black bg-black text-white text-xs font-bold uppercase p-3">
                          ⚠ {reviewErrorMsg}
                        </div>
                      )}
                      {reviewSuccessMsg && (
                        <div className="border-2 border-black bg-emerald-600 text-white text-xs font-bold uppercase p-3">
                          ✓ {reviewSuccessMsg}
                        </div>
                      )}

                      {/* Interactive Star Picker (Mandatory Rating) */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                          RATING
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className={`w-10 h-10 border-2 border-black font-bold text-lg flex items-center justify-center transition-colors cursor-pointer ${star <= userRating ? 'bg-black text-amber-400' : 'bg-white text-neutral-300 hover:bg-neutral-100'
                                }`}
                            >
                              ★
                            </button>
                          ))}
                          <span className="text-xs font-bold uppercase tracking-wider ml-2 text-black">
                            {userRating} / 5 STARS
                          </span>
                        </div>
                      </div>

                      {/* Review Message */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                          YOUR REVIEW / MESSAGE *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          placeholder="SHARE YOUR THOUGHTS ON THE PRINT QUALITY, PACKAGING, OR DESIGN..."
                          className="w-full bg-white border-2 border-black p-3 font-space text-xs focus:outline-none uppercase"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full bg-black text-white hover:bg-white hover:text-black font-space font-bold uppercase text-xs tracking-wider py-4 border-2 border-black transition-colors cursor-pointer shadow-solid-sm disabled:opacity-50"
                      >
                        {submittingReview ? 'SUBMITTING...' : product?.userReview ? 'UPDATE REVIEW' : 'PUBLISH REVIEW'}
                      </button>
                    </form>
                  ) : (
                    <div className="border-2 border-dashed border-black p-6 bg-neutral-100 text-center font-space mt-4">
                      <p className="font-bold text-xs uppercase tracking-wider text-black mb-1">
                        VERIFIED USERS ONLY
                      </p>
                      <p className="text-[11px] text-neutral-500 uppercase tracking-widest">
                        ONLY CUSTOMERS WHO HAVE PURCHASED THIS PRINT CAN LEAVE A RATING AND REVIEW.
                      </p>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  <h4 className="font-inter font-black text-xl uppercase tracking-tight text-black">
                    CUSTOMER REVIEWS ({reviews.length})
                  </h4>

                  {reviews.length === 0 ? (
                    <div className="border-2 border-black p-8 bg-white text-center font-space">
                      <p className="text-xs text-neutral-500 uppercase tracking-widest">
                        NO REVIEWS YET FOR THIS PRINT. BE THE FIRST VERIFIED USER TO REVIEW!
                      </p>
                    </div>
                  ) : (
                    reviews.map((rev) => {
                      const userName = rev.user?.fullName || rev.user?.name || (rev.user?.email ? rev.user.email.split('@')[0] : 'VERIFIED PURCHASE');
                      const userAvatar = rev.user?.avatar;
                      const userInitials = userName !== 'VERIFIED PURCHASER'
                        ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : 'VP';

                      return (
                        <div key={rev._id} className="border-2 border-black p-6 bg-white font-space space-y-3 shadow-solid-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {userAvatar ? (
                                <img
                                  src={userAvatar}
                                  alt={userName}
                                  className="w-10 h-10 border-2 border-black object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 border-2 border-black bg-black text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                                  {userInitials}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-xs uppercase block text-black">
                                  {userName}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-500 px-1.5 py-0.5 uppercase inline-block mt-0.5">
                                  ✓ VERIFIED PURCHASE
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-amber-500 font-bold text-sm">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                              </div>
                              {(user?._id === rev.user?._id || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteReview(rev._id)}
                                  className="text-neutral-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                                  title="DELETE REVIEW"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-neutral-700 leading-relaxed uppercase pt-1">
                            "{rev.message}"
                          </p>

                          <div className="text-[9px] text-neutral-400 uppercase tracking-widest text-right">
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Component */}
      <Footer />

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 text-white border-2 border-white p-2 hover:bg-white hover:text-black transition-colors cursor-pointer z-50"
            >
              <X size={20} />
            </button>

            <div
              className="relative max-w-4xl max-h-[85vh] bg-white border-4 border-white shadow-2xl p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {product.images && product.images[activeThumb] ? (
                <img
                  src={product.images[activeThumb]}
                  alt={product.name}
                  className="max-w-full max-h-[80vh] object-contain mx-auto"
                />
              ) : (
                <div className="w-80 h-96 flex items-center justify-center bg-stripes-light">
                  {svgIcon}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Popup Notification */}
      <Popup
        isOpen={deletePopupOpen}
        title="DELETE PRODUCT"
        message={`ARE YOU SURE YOU WANT TO REMOVE "${product?.name?.toUpperCase()}" PERMANENTLY?`}
        confirmText="DELETE"
        cancelText="CANCEL"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeletePopupOpen(false)}
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
