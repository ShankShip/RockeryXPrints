// src/pages/CategoriesPage.jsx
// Shows all fandom categories from the backend in a brutalist grid, with Admin option to add categories
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ArrowRight, Layers, Plus, Upload, X, Edit2 } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Popup from '../components/landing/Popup';
import { SkeletonCategoryCard } from '../components/common/Skeleton';
import { getCategories, addCategoryAPI, updateCategoryAPI } from '../services/api';

const spring = { type: 'spring', bounce: 0, duration: 0.35 };



export default function CategoriesPage() {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form states
  const [catName, setCatName] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmPopupOpen, setConfirmPopupOpen] = useState(false);

  // Edit states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCoverImageFile, setEditCoverImageFile] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const fetchCategoriesList = () => {
    setLoading(true);
    getCategories(isAdmin)
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategoriesList();
  }, [isAdmin]);

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    if (!catName || !coverImageFile) {
      setErrorMsg('CATEGORIES REQUIRE A NAME AND COVER IMAGE.');
      return;
    }
    setErrorMsg('');
    setConfirmPopupOpen(true);
  };

  const handleConfirmCreateCategory = async () => {
    setConfirmPopupOpen(false);
    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', catName);
    formData.append('coverImage', coverImageFile);

    try {
      await addCategoryAPI(formData);
      setCatName('');
      setCoverImageFile(null);
      setFormOpen(false);
      fetchCategoriesList();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'ERROR WHILE LISTING CATEGORY ON BACKEND.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name || '');
    setEditCoverImageFile(null);
    setEditErrorMsg('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      setEditErrorMsg('ENTER A CATEGORY NAME');
      return;
    }

    setEditSubmitting(true);
    setEditErrorMsg('');

    const formData = new FormData();
    formData.append('name', editCatName.trim());
    if (editCoverImageFile) {
      formData.append('coverImage', editCoverImageFile);
    }

    try {
      await updateCategoryAPI(editingCategory._id, formData);
      setEditingCategory(null);
      fetchCategoriesList();
    } catch (err) {
      setEditErrorMsg(err?.response?.data?.message || 'ERROR UPDATING CATEGORY.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const totalProducts = categories.reduce((s, c) => s + (c.productCount || 0), 0);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white overflow-x-hidden">
      <Navbar />

      <div className="pt-20">
        {/* ── Page Header ── */}
        <div className="border-b-4 border-black px-5 md:px-12 py-8 md:py-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-white">
          <div>
            <span className="font-space text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 mb-3 block">
              BROWSE BY CATEGORY
            </span>
            <h1 className="font-inter font-black text-5xl sm:text-6xl md:text-7xl xl:text-8xl tracking-tighter uppercase leading-none">
              ALL<br />CATEGORIES
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Add Category trigger button */}
            {isAdmin && (
              <button
                onClick={() => { setFormOpen(!formOpen); setErrorMsg(''); }}
                className="border-2 border-black bg-black text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-space font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Plus size={14} />
                <span>ADD CATEGORY</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Category creation form block (Admin Only) ── */}
        <AnimatePresence>
          {isAdmin && formOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="overflow-hidden border-b-4 border-black bg-neutral-50"
            >
              <form onSubmit={handleSubmitAttempt} className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6 font-space">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <h3 className="font-space font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
                    🛠 ADD NEW FANDOM REGISTRATION
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-black">
                    CATEGORY NAME (E.G. HORROR FANDOM)
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="ENTER DESIGNATION..."
                    style={{ fontSize: '16px' }}
                    className="w-full bg-white border-2 border-black px-3.5 py-3 font-space text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-black">
                    COVER IMAGE FILE
                  </label>
                  <div className="relative border-2 border-dashed border-black bg-white p-6 flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={(e) => setCoverImageFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={22} className="text-neutral-400 mb-2" />
                    {coverImageFile ? (
                      <span className="text-xs font-bold text-black uppercase break-all">
                        {coverImageFile.name} ({(coverImageFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 uppercase">
                        DRAG FILE OR CLICK TO SELECT
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors touch-manipulation"
                >
                  {submitting ? 'SAVING' : 'LIST CATEGORY IN DATABASE'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category edit form block (Admin Only) ── */}
        <AnimatePresence>
          {isAdmin && editingCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring}
              className="overflow-hidden border-b-4 border-black bg-neutral-50"
            >
              <form onSubmit={handleEditSubmit} className="max-w-xl mx-auto px-6 py-8 flex flex-col gap-6 font-space">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <h3 className="font-space font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
                    <Edit2 size={16} /> EDIT FANDOM: {editingCategory.name.toUpperCase()}
                  </h3>
                  <button type="button" onClick={() => setEditingCategory(null)} className="text-neutral-500 hover:text-black">
                    <X size={18} />
                  </button>
                </div>

                {editErrorMsg && (
                  <div className="border-2 border-black bg-black text-white text-xs font-bold uppercase px-4 py-2.5">
                    ⚠ {editErrorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-black">
                    CATEGORY NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    style={{ fontSize: '16px' }}
                    className="w-full bg-white border-2 border-black px-3.5 py-3 font-space text-sm focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-black">
                    NEW COVER IMAGE (OPTIONAL)
                  </label>
                  <div className="relative border-2 border-dashed border-black bg-white p-6 flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditCoverImageFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload size={22} className="text-neutral-400 mb-2" />
                    {editCoverImageFile ? (
                      <span className="text-xs font-bold text-black uppercase break-all">
                        {editCoverImageFile.name} ({(editCoverImageFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 uppercase">
                        SELECT FILE TO OVERWRITE CURRENT COVER
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="w-full bg-black text-white font-space font-bold uppercase text-xs py-4 border-2 border-black hover:bg-white hover:text-black transition-colors touch-manipulation"
                >
                  {editSubmitting ? 'SAVING CHANGES' : 'SAVE CATEGORY CHANGES'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading / Error ── */}
        {/* ── Loading / Error ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-black gap-0.5 p-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white">
                <SkeletonCategoryCard />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-black gap-0.5 p-0.5">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...spring, delay: (idx % 3) * 0.07 }}
              whileHover={{ x: -5, y: -5, boxShadow: '7px 7px 0px 0px #000000' }}
              className="bg-black border-2 border-black relative overflow-hidden"
            >
              {isAdmin && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="bg-white text-black p-2 border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer shadow-solid-sm"
                    title="Edit Category"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <Link
                to={`/category/${cat.slug}`}
                className="group block h-full bg-white p-0 relative"
              >
                <div className="flex flex-col h-full">
                  {/* SVG art / Cloudinary Cover Image panel */}
                  <div className="relative border-b-2 border-black bg-stripes-light overflow-hidden flex items-center justify-center w-full"
                       style={{ height: 'clamp(160px, 28vw, 240px)' }}>

                    <span className="absolute right-4 bottom-2 font-inter font-black text-[80px] md:text-[100px] leading-none text-black opacity-[0.06] select-none pointer-events-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {cat.coverImage ? (
                      <img
                        src={cat.coverImage}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full text-xs font-space text-neutral-400 flex items-center justify-center bg-neutral-100">
                        NO IMAGE
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.04] transition-opacity duration-150" />
                  </div>

                  {/* Card body */}
                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <h2 className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tighter leading-tight mb-2 group-hover:text-neutral-600 transition-colors duration-75">
                      {cat.name}
                    </h2>

                    {cat.description && (
                      <p className="font-space text-[10px] md:text-xs text-neutral-500 leading-relaxed mb-4">
                        {cat.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t-2 border-dashed border-neutral-300">
                      <div className="font-space text-[9px] md:text-[10px] uppercase tracking-wider">
                        <span className="font-black text-black">{cat.productCount || '0'}</span>
                        <span className="text-neutral-400 ml-1">ITEMS</span>
                      </div>
                      {isAdmin && (
                        <>
                          <div className="w-px h-4 bg-neutral-300" />
                          <div className="font-space text-[9px] md:text-[10px] uppercase tracking-wider">
                            <span className="font-black text-black">{cat.totalSalesCount?.toLocaleString('en-IN') || '0'}</span>
                            <span className="text-neutral-400 ml-1">SOLD</span>
                          </div>
                        </>
                      )}

                      <div className="ml-auto flex items-center gap-1 font-space text-[9px] md:text-xs font-bold uppercase tracking-wider group-hover:gap-2 transition-all duration-100">
                        EXPLORE
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        )}

        {/* ── Bottom CTA strip ── */}
        <div className="border-t-4 border-black px-5 md:px-12 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black text-white">
          <div>
            <div className="font-space text-[10px] uppercase tracking-widest text-neutral-400 mb-1">CAN'T DECIDE?</div>
            <div className="font-inter font-black text-2xl md:text-3xl uppercase tracking-tighter">BROWSE ALL PRINTS</div>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-2 bg-white text-black font-space font-bold uppercase text-xs px-7 py-4 border-2 border-white hover:bg-black hover:text-white hover:border-neutral-700 transition-colors duration-75 touch-manipulation shrink-0"
          >
            VIEW ALL INVENTORY <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <Footer />

      <Popup
        isOpen={confirmPopupOpen}
        title="CREATE FANDOM UNIVERSE"
        message={`CONFIRM REGISTRATION OF A NEW FANDOM NAMED "${catName?.toUpperCase()}". THE SYSTEM WILL CREATE THE REQUISITE SECTIONS FOR THIS FANDOM.`}
        confirmText="YES, CREATE"
        cancelText="NO, CANCEL"
        onConfirm={handleConfirmCreateCategory}
        onCancel={() => setConfirmPopupOpen(false)}
      />
    </div>
  );
}
