// src/pages/CollectionsPage.jsx
// Shows all manual Collections from the backend in a brutalist grid, with Admin option to add & delete collections
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ArrowRight, Layers, Plus, Upload, X, Trash2, Tag, Edit2, Film } from 'lucide-react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import Popup from '../components/landing/Popup';
import { SkeletonCollectionCard } from '../components/common/Skeleton';
import { getCollections, addCollectionAPI, updateCollectionAPI, deleteCollectionAPI } from '../services/api';

const spring = { type: 'spring', bounce: 0, duration: 0.35 };

// ── HoverMedia Component ──────────────────────────────────────────────────────
// Custom component that renders static cover image by default, and plays looping video on hover if present
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

  // Only use video if hoverVideo is actually uploaded
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
      videoRef.current.play().catch(() => {});
    }
  }, [isMobile, videoSrc]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black"
    >
      {/* Video Element Underneath (Only if video is uploaded) */}
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

      {/* Static Cover Image / SVG Overlay */}
      {coverImage ? (
        <img
          src={coverImage}
          alt={alt || 'Collection Cover'}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${
            (isMobile || isHovered) && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center p-6 bg-stripes-light transition-all duration-500 group-hover:scale-105 hover:scale-105 relative z-10 ${
            (isMobile || isHovered) && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full h-full text-xs font-space text-neutral-400 flex items-center justify-center">NO IMAGE</div>
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form states
  const [colName, setColName] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [hoverVideoFile, setHoverVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [popupInfo, setPopupInfo] = useState({ open: false, title: '', message: '', type: 'info' });

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);

  // Edit modal state
  const [editingCollection, setEditingCollection] = useState(null);
  const [editColName, setEditColName] = useState('');
  const [editSearchTag, setEditSearchTag] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverImageFile, setEditCoverImageFile] = useState(null);
  const [editHoverVideoFile, setEditHoverVideoFile] = useState(null);
  const [editRemoveHoverVideo, setEditRemoveHoverVideo] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const handleEdit = (col) => {
    setEditingCollection(col);
    setEditColName(col.name || '');
    setEditSearchTag(col.searchTag || col.slug || '');
    setEditDescription(col.description || '');
    setEditCoverImageFile(null);
    setEditHoverVideoFile(null);
    setEditRemoveHoverVideo(false);
    setEditErrorMsg('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCollection) return;
    if (!editColName.trim()) {
      setEditErrorMsg('ENTER A COLLECTION NAME');
      return;
    }
    if (!editSearchTag.trim()) {
      setEditErrorMsg('ENTER A SEARCH TAG');
      return;
    }

    setEditSubmitting(true);
    setEditErrorMsg('');

    const formData = new FormData();
    formData.append('name', editColName.trim());
    formData.append('searchTag', editSearchTag.trim().toLowerCase());
    formData.append('description', editDescription.trim());
    if (editCoverImageFile) {
      formData.append('coverImage', editCoverImageFile);
    }
    if (editRemoveHoverVideo) {
      formData.append('removeHoverVideo', 'true');
    } else if (editHoverVideoFile) {
      formData.append('hoverVideo', editHoverVideoFile);
    }

    updateCollectionAPI(editingCollection._id, formData)
      .then(() => {
        setPopupInfo({
          open: true,
          title: 'COLLECTION UPDATED',
          message: `COLLECTION "${editColName.toUpperCase()}" UPDATED SUCCESSFULLY.`,
          type: 'success'
        });
        setEditingCollection(null);
        setEditHoverVideoFile(null);
        setEditRemoveHoverVideo(false);
        fetchCollectionsList();
      })
      .catch((err) => {
        setEditErrorMsg(err.response?.data?.message || 'FAILED TO UPDATE COLLECTION ON DATABASE');
      })
      .finally(() => setEditSubmitting(false));
  };

  const fetchCollectionsList = () => {
    setLoading(true);
    getCollections(isAdmin)
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setCollections(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCollectionsList();
  }, [isAdmin]);

  const handleSubmitAttempt = (e) => {
    e.preventDefault();
    if (!colName.trim()) {
      setErrorMsg('ENTER A COLLECTION NAME');
      return;
    }
    if (!searchTag.trim()) {
      setErrorMsg('ENTER A SEARCH TAG (E.G. ANIME)');
      return;
    }
    if (!coverImageFile) {
      setErrorMsg('SELECT A COVER IMAGE FILE');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', colName.trim());
    formData.append('searchTag', searchTag.trim().toLowerCase());
    formData.append('description', description.trim());
    formData.append('coverImage', coverImageFile);
    if (hoverVideoFile) {
      formData.append('hoverVideo', hoverVideoFile);
    }

    addCollectionAPI(formData)
      .then(() => {
        setPopupInfo({
          open: true,
          title: 'COLLECTION CREATED',
          message: `NEW COLLECTION "${colName.toUpperCase()}" PUBLISHED SUCCESSFULLY.`,
          type: 'success'
        });
        setColName('');
        setSearchTag('');
        setDescription('');
        setCoverImageFile(null);
        setHoverVideoFile(null);
        setFormOpen(false);
        fetchCollectionsList();
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || 'FAILED TO CREATE COLLECTION ON DATABASE');
      })
      .finally(() => setSubmitting(false));
  };

  const handleDelete = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteCollectionAPI(deletingId)
      .then(() => {
        setPopupInfo({
          open: true,
          title: 'COLLECTION DELETED',
          message: 'COLLECTION WAS REMOVED FROM DATABASE.',
          type: 'success'
        });
        fetchCollectionsList();
      })
      .catch((err) => {
        setPopupInfo({
          open: true,
          title: 'DELETE FAILED',
          message: err.response?.data?.message || 'COULD NOT DELETE COLLECTION',
          type: 'error'
        });
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white flex flex-col justify-between antialiased">
      <div>
        <Navbar />

        <main className="pt-20">
          {/* Header */}
          <div className="border-b-4 border-black px-6 md:px-12 py-10 md:py-16 bg-white relative">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="font-space text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-2 block">
                  CURATED ARCHIVES
                </span>
                <h1 className="font-inter font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter uppercase leading-none">
                  FANDOM<br />COLLECTIONS
                </h1>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3">
                {isAdmin && (
                  <button
                    onClick={() => { setFormOpen(!formOpen); setErrorMsg(''); }}
                    className={`font-space font-bold text-xs uppercase px-5 py-3 border-2 border-black flex items-center gap-2 transition-colors duration-100 cursor-pointer shadow-solid-sm ${formOpen ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                  >
                    {formOpen ? <X size={14} /> : <Plus size={14} />}
                    <span>{formOpen ? 'CANCEL CREATION' : 'ADD NEW COLLECTION'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Admin Inline Form */}
          <AnimatePresence>
            {isAdmin && formOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="border-b-4 border-black bg-neutral-100 overflow-hidden"
              >
                <form onSubmit={handleSubmitAttempt} className="max-w-4xl mx-auto px-6 py-8 md:py-12 font-space">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b-2 border-black">
                    <Layers size={18} />
                    <h2 className="font-inter font-black text-lg uppercase tracking-tight">CREATE MANUAL COLLECTION</h2>
                  </div>

                  {errorMsg && (
                    <div className="border-2 border-black bg-black text-white font-space text-xs font-bold uppercase p-3 mb-6">
                      ⚠ {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                        COLLECTION NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={colName}
                        onChange={(e) => setColName(e.target.value)}
                        placeholder="E.G. ANIME OBSESSION"
                        className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                        SEARCH TAG * (E.G. ANIME)
                      </label>
                      <input
                        type="text"
                        required
                        value={searchTag}
                        onChange={(e) => setSearchTag(e.target.value)}
                        placeholder="E.G. ANIME"
                        className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                      DESCRIPTION (OPTIONAL)
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="SHORT SUMMARY OF THIS COLLECTION..."
                      className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                        COVER IMAGE *
                      </label>
                      <div className="relative border-2 border-dashed border-black bg-white p-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          onChange={(e) => setCoverImageFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload size={20} className="mx-auto mb-2 opacity-50" />
                        <span className="font-space text-xs font-bold uppercase block truncate">
                          {coverImageFile ? coverImageFile.name : 'CLICK TO UPLOAD COVER IMAGE'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                        HOVER VIDEO (OPTIONAL - .MP4 / .WEBM)
                      </label>
                      <div className="relative border-2 border-dashed border-black bg-white p-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/*"
                          onChange={(e) => setHoverVideoFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Film size={20} className="mx-auto mb-2 opacity-50" />
                        <span className="font-space text-xs font-bold uppercase block truncate">
                          {hoverVideoFile ? hoverVideoFile.name : 'CLICK TO UPLOAD HOVER VIDEO (.MP4, .WEBM)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white font-space font-bold uppercase text-xs tracking-wider py-4 border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer shadow-solid-sm disabled:opacity-50"
                  >
                    {submitting ? 'PUBLISHING COLLECTION...' : 'SAVE & PUBLISH COLLECTION'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <SkeletonCollectionCard />
                  </div>
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="border-4 border-black p-16 text-center bg-white">
                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                <h3 className="font-inter font-black text-2xl uppercase tracking-tight mb-2">NO COLLECTIONS FOUND</h3>
                <p className="font-space text-xs text-neutral-500 uppercase tracking-widest">
                  ADMIN CAN ADD COLLECTIONS USING THE BUTTON ABOVE.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {collections.map((col, idx) => {
                  const tagParam = col.searchTag || col.slug || col.name;
                  return (
                    <motion.div
                      key={col._id || idx}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.5, delay: idx * 0.06 }}
                      className="border-4 border-black bg-white flex flex-col justify-between group hover:shadow-solid-lg transition-all duration-200 relative overflow-hidden"
                    >
                      <div>
                        {/* Cover Image / Video Container */}
                        <div
                          onClick={() => navigate(`/shop?tag=${encodeURIComponent(tagParam)}`)}
                          className="w-full h-64 border-b-4 border-black bg-neutral-100 relative overflow-hidden cursor-pointer flex items-center justify-center"
                        >
                          <HoverMedia
                            coverImage={col.coverImage}
                            hoverVideo={col.hoverVideo}
                            alt={col.name}
                          />

                          {/* Tag Badge */}
                          <span className="absolute top-3 left-3 bg-black text-white font-space text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase border border-white flex items-center gap-1.5 shadow-solid-sm z-20 pointer-events-none">
                            <Tag size={10} /> #{tagParam.toUpperCase()}
                          </span>

                          {/* Top Right Edit Button (Admin Only) */}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(col);
                              }}
                              className="absolute top-3 right-3 bg-white text-black hover:bg-black hover:text-white border-2 border-black p-2 transition-colors duration-0 cursor-pointer shadow-solid-sm z-30"
                              title="EDIT COLLECTION"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-6">
                          <h3
                            onClick={() => navigate(`/shop?tag=${encodeURIComponent(tagParam)}`)}
                            className="font-inter font-black text-xl md:text-2xl uppercase tracking-tighter hover:text-neutral-600 transition-colors cursor-pointer leading-tight mb-2"
                          >
                            {col.name}
                          </h3>
                          <p className="font-space text-xs text-neutral-600 leading-relaxed uppercase">
                            {col.description || 'Monochrome archival print collection curated for industrial spaces.'}
                          </p>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="p-6 pt-0 flex items-center justify-between gap-4">
                        <Link
                          to={`/shop?tag=${encodeURIComponent(tagParam)}`}
                          className="flex-1 bg-black text-white hover:bg-white hover:text-black font-space font-bold uppercase text-xs tracking-wider px-5 py-3.5 border-2 border-black flex items-center justify-between transition-colors duration-0"
                        >
                          <span>EXPLORE</span>
                          <ArrowRight size={14} />
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(col._id)}
                            className="bg-white hover:bg-black text-black hover:text-white border-2 border-black p-3 transition-colors duration-0 cursor-pointer shrink-0"
                            title="DELETE COLLECTION"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer />

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 md:p-8 max-w-lg w-full shadow-solid-lg font-space relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingCollection(null)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 border-2 border-black cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-6 pb-2 border-b-2 border-black">
              <Edit2 size={18} />
              <h3 className="font-inter font-black text-xl uppercase tracking-tight text-black">EDIT COLLECTION</h3>
            </div>

            {editErrorMsg && (
              <div className="border-2 border-black bg-black text-white font-space text-xs font-bold uppercase p-3 mb-6">
                ⚠ {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  COLLECTION NAME *
                </label>
                <input
                  type="text"
                  required
                  value={editColName}
                  onChange={(e) => setEditColName(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  SEARCH TAG * (E.G. ANIME)
                </label>
                <input
                  type="text"
                  required
                  value={editSearchTag}
                  onChange={(e) => setEditSearchTag(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border-2 border-black p-3 font-space text-xs uppercase focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">
                  UPDATE COVER IMAGE (OPTIONAL)
                </label>
                <div className="relative border-2 border-dashed border-black bg-white p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditCoverImageFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={18} className="mx-auto mb-1 opacity-50" />
                  <span className="font-space text-xs font-bold uppercase block truncate">
                    {editCoverImageFile ? editCoverImageFile.name : 'CLICK TO REPLACE COVER IMAGE'}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    UPDATE HOVER VIDEO (OPTIONAL)
                  </label>
                  {editingCollection?.hoverVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditRemoveHoverVideo(!editRemoveHoverVideo);
                        setEditHoverVideoFile(null);
                      }}
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 border border-black cursor-pointer transition-colors ${
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
                  <div className="border-2 border-red-600 bg-red-50 p-3 text-center text-[10px] font-bold uppercase text-red-600">
                    HOVER VIDEO MARKED FOR DELETION (WILL BE REMOVED ON SAVE)
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-black bg-white p-4 text-center cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/*"
                      onChange={(e) => setEditHoverVideoFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Film size={18} className="mx-auto mb-1 opacity-50" />
                    <span className="font-space text-xs font-bold uppercase block truncate">
                      {editHoverVideoFile ? editHoverVideoFile.name : editingCollection?.hoverVideo ? 'CLICK TO REPLACE EXISTING HOVER VIDEO' : 'CLICK TO UPLOAD HOVER VIDEO (.MP4, .WEBM)'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 bg-black text-white hover:bg-white hover:text-black border-2 border-black py-3.5 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black py-3.5 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-4 border-black p-6 md:p-8 max-w-md w-full shadow-solid-lg font-space">
            <h3 className="font-inter font-black text-xl uppercase tracking-tight mb-2 text-black">CONFIRM DELETION</h3>
            <p className="text-xs text-neutral-600 uppercase leading-relaxed mb-6">
              ARE YOU SURE YOU WANT TO DELETE THIS COLLECTION FROM THE DATABASE? THIS ACTION CANNOT BE UNDONE.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-black text-white hover:bg-white hover:text-black border-2 border-black py-3 font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                YES, DELETE
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black py-3 font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notification */}
      <Popup
        open={popupInfo.open}
        title={popupInfo.title}
        message={popupInfo.message}
        type={popupInfo.type}
        onClose={() => setPopupInfo({ ...popupInfo, open: false })}
      />
    </div>
  );
}
