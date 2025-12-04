"use client";

import PhotoItem from "@/components/PhotoItem";
import Lightbox from "@/components/Lightbox";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import photoMetadata from "@/data/photo-metadata.json";

const INITIAL_LOAD = 60;
const LOAD_MORE = 30;

type Category = 'live' | 'daily';

export default function Home() {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [activeCategory, setActiveCategory] = useState<Category>('live');

  const [shuffledPhotos, setShuffledPhotos] = useState<typeof photoMetadata>([]);

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: typeof photoMetadata) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Filter and shuffle photos when category changes
  useEffect(() => {
    const filtered = photoMetadata.filter(photo => {
      return photo.category === activeCategory;
    });
    setShuffledPhotos(shuffleArray(filtered));
    setVisibleCount(INITIAL_LOAD);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  // Load more photos when bottom sentinel comes into view
  useEffect(() => {
    if (inView && visibleCount < shuffledPhotos.length) {
      setVisibleCount((prev) => Math.min(prev + LOAD_MORE, shuffledPhotos.length));
    }
  }, [inView, visibleCount, shuffledPhotos.length]);

  const visiblePhotos = shuffledPhotos.slice(0, visibleCount);
  const hasMore = visibleCount < shuffledPhotos.length;

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => (prev === null || prev === shuffledPhotos.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setSelectedPhotoIndex((prev) => (prev === null || prev === 0 ? shuffledPhotos.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col pt-4">
      {/* Category Filter Tabs */}
      <div className="flex justify-center gap-8 mb-8 sticky top-[80px] z-40 py-4 bg-white/90 backdrop-blur-sm">
        {(['live', 'daily'] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeCategory === cat
              ? "text-black border-b-2 border-red-600"
              : "text-gray-400 hover:text-black"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Layout - Forced High Density */}
      <div className="columns-3 sm:columns-4 md:columns-5 lg:columns-6 xl:columns-7 gap-2 space-y-2 mb-12 px-2">
        {visiblePhotos.map((photo, index) => (
          <PhotoItem
            key={`${photo.src}-${index}`}
            src={photo.src}
            alt={photo.alt}
            meta={photo.meta}
            orientation={photo.orientation as "vertical" | "horizontal"}
            priority={index < 12}
            onClick={() => setSelectedPhotoIndex(index)}
          />
        ))}
      </div>

      {/* Loading Indicator / Sentinel */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-12 mb-12">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {!hasMore && (
        <div className="text-center mb-24">
          <a href="/contact" className="inline-block border-2 border-black px-12 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            Get in Touch
          </a>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        photo={selectedPhotoIndex !== null ? shuffledPhotos[selectedPhotoIndex] : null}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
}
