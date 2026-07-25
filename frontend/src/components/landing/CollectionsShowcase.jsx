// src/components/landing/CollectionsShowcase.jsx
// Visual Manual Collections Showcase component with infinite scrolling marquee effect
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { getCollections } from '../../services/api';
import { mockCollections, getProductSvg } from '../../data/mockData';

function HoverMedia({ coverImage, hoverVideo, alt, fallbackSvg }) {
  const videoRef = useRef(null);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const videoSrc = hoverVideo || '';

  const handleMouseEnter = () => {
    setIsCardHovered(true);
    if (videoSrc && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsCardHovered(false);
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
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 pointer-events-none z-0"
        />
      ) : null}

      {coverImage ? (
        <img
          src={coverImage}
          alt={alt || 'Collection Cover'}
          className={`w-full h-full object-cover transition-all duration-500 group-hover/card:scale-105 hover:scale-105 relative z-10 ${
            isCardHovered && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center p-4 bg-stripes-dark transition-all duration-500 group-hover/card:scale-105 hover:scale-105 relative z-10 ${
            isCardHovered && videoSrc ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {fallbackSvg}
        </div>
      )}
    </div>
  );
}

export default function CollectionsShowcase() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState(mockCollections);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward (left scroll), -1 = reverse (right scroll)
  const scrollRef = useRef(null);

  useEffect(() => {
    getCollections()
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setCollections(data);
        } else {
          setCollections(mockCollections);
        }
      })
      .catch(() => {
        setCollections(mockCollections);
      })
      .finally(() => setLoading(false));
  }, []);

  // Continuous smooth auto-scroll effect with infinite looping
  useEffect(() => {
    let animationId;
    const container = scrollRef.current;
    if (!container || loading) return;

    const speed = 1.2;

    const step = () => {
      if (!isHovered && container) {
        container.scrollLeft += direction * speed;

        // Infinite loop wrapping
        const maxScroll = container.scrollWidth / 2;
        if (container.scrollLeft >= maxScroll) {
          container.scrollLeft -= maxScroll / 2;
        } else if (container.scrollLeft <= 0 && direction === -1) {
          container.scrollLeft += maxScroll / 2;
        }
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, direction, loading, collections]);

  const handleShiftLeft = () => {
    setDirection(-1);
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleShiftRight = () => {
    setDirection(1);
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Multiply items for infinite loop
  const marqueeItems = [...collections, ...collections, ...collections, ...collections, ...collections, ...collections];

  return (
    <section id="collections-showcase" className="scroll-mt-20 bg-black text-white border-b-4 border-black select-none overflow-hidden py-10">

      {loading ? (
        <div className="flex gap-6 px-6 overflow-hidden max-w-7xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-2 border-neutral-800 bg-neutral-900 p-5 h-72 w-80 shrink-0 animate-pulse flex flex-col justify-between">
              <div className="w-full h-40 bg-neutral-800" />
              <div className="h-5 bg-neutral-800 w-2/3 mt-4" />
            </div>
          ))}
        </div>
      ) : (
        /* Manual Boundary Container with Hover Handler */
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative w-full overflow-hidden py-4 group border-y-2 border-neutral-800 hover:border-white transition-colors duration-200"
        >
          {/* Ambient Edge Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-r from-black via-black/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-28 bg-gradient-to-l from-black via-black/80 to-transparent z-20 pointer-events-none" />

          {/* Left Navigation Button */}
          <button
            onClick={handleShiftLeft}
            aria-label="Shift Marquee Left"
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 bg-black text-white hover:bg-white hover:text-black border-2 border-white p-2.5 md:p-3 shadow-solid transition-colors duration-100 cursor-pointer touch-manipulation"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Navigation Button */}
          <button
            onClick={handleShiftRight}
            aria-label="Shift Marquee Right"
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 bg-black text-white hover:bg-white hover:text-black border-2 border-white p-2.5 md:p-3 shadow-solid transition-colors duration-100 cursor-pointer touch-manipulation"
          >
            <ChevronRight size={20} />
          </button>

          {/* Marquee Scroll Track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto py-2 px-12 md:px-20 scrollbar-none cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              .scrollbar-none::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {marqueeItems.map((col, idx) => {
              const tagParam = col.searchTag || col.slug || col.name;
              return (
                <div
                  key={`${col._id || idx}-${idx}`}
                  onClick={() => navigate(`/shop?tag=${encodeURIComponent(tagParam)}`)}
                  className="group/card w-72 sm:w-80 border-2 border-neutral-800 hover:border-white bg-neutral-950 flex flex-col justify-between p-4 cursor-pointer transition-colors duration-150 shrink-0 relative overflow-hidden shadow-solid-sm"
                >
                  {/* Image Matte with HoverMedia */}
                  <div className="w-full h-44 border border-neutral-800 bg-neutral-900 relative overflow-hidden mb-3 flex items-center justify-center">
                    <HoverMedia
                      coverImage={col.coverImage}
                      hoverVideo={col.hoverVideo}
                      alt={col.name}
                      fallbackSvg={getProductSvg(col.slug || 'anime', idx)}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex justify-center items-start gap-2 mb-1">
                      <h3 className="font-inter font-black text-lg uppercase tracking-tight text-white group-hover/card:text-neutral-300 transition-colors truncate">
                        {col.name}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
