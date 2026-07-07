"use client";

import PhotoItem from "@/components/PhotoItem";
import Lightbox from "@/components/Lightbox";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import photosV2 from "@/data/photos.v2.json";

// ライブ写真のみを配信。src=表示用(1600px) / thumbnail=サムネ(480px) / width,height=実寸(比率保持用)。
const photos = photosV2.map((p) => ({ ...p, meta: { date: p.date ?? undefined } }));

// ▼ トップの「顔となる1枚」。差し替えたいときはこのパスを /images/site/display/... の好きな写真に変えるだけ。
//   砂流さん選定：RIP SLYME @ RISING SUN ROCK FESTIVAL 2025 in EZO（2_DSC02521）。
const HERO_IMAGE = "/images/site/display/live/20250815_RISING_SUN_ROCK_FESTIVAL_2025_in_EZO/2_DSC02521.jpg";
// ▼ キャッチ。既存のOGコピー（本人の既存文言）をそのまま使用。変えたいときはここ。
const HERO_EYEBROW = "Live Music Photographer — Tokyo";
const HERO_HEADLINE = "Capturing the raw energy of live music";

const INITIAL_LOAD = 48;
const LOAD_MORE = 24;

export default function Home() {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [ordered, setOrdered] = useState<typeof photos>([]);

  const { ref, inView } = useInView({ threshold: 0, triggerOnce: false });

  // 初回マウント時に一度だけシャッフル（表示のたびに変わらないよう1回で固定）
  useEffect(() => {
    const arr = [...photos];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrdered(arr);
  }, []);

  useEffect(() => {
    if (inView && visibleCount < ordered.length) {
      setVisibleCount((prev) => Math.min(prev + LOAD_MORE, ordered.length));
    }
  }, [inView, visibleCount, ordered.length]);

  const visiblePhotos = ordered.slice(0, visibleCount);
  const hasMore = visibleCount < ordered.length;

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => (prev === null || prev === ordered.length - 1 ? 0 : prev + 1));
  };
  const handlePrev = () => {
    setSelectedPhotoIndex((prev) => (prev === null || prev === 0 ? ordered.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col">
      {/* ▼ ヒーロー：顔となる1枚＋キャッチ。ヘッダーの下まで全幅で敷く（-mt-24 -mx でlayoutのpadding相殺）。 */}
      <section className="relative -mt-24 -mx-4 md:-mx-8 h-[88vh] min-h-[540px] overflow-hidden bg-black">
        <img
          src={HERO_IMAGE}
          alt="Keisuke Sunagare — live music photography"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 上：ヘッダー文字の可読性用 ／ 下：キャッチの可読性用 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-[1800px] mx-auto px-6 md:px-12 pb-16 md:pb-24">
            <p className="text-white/75 text-[11px] md:text-sm tracking-[0.3em] uppercase mb-4">
              {HERO_EYEBROW}
            </p>
            <h1 className="text-white font-oswald font-bold uppercase leading-[0.95] tracking-tight text-4xl md:text-6xl lg:text-7xl max-w-4xl">
              {HERO_HEADLINE}
            </h1>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-[10px] tracking-[0.3em] uppercase">
          Scroll
        </div>
      </section>

      {/* 実アスペクト比のmasonry。縦写真もトリミングせず本来の縦長で配置される。
          列密度を下げて（最大5列）縦写真が小さくなりすぎないようにする。 */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3 mt-12 mb-12 px-2">
        {visiblePhotos.map((photo, index) => (
          <PhotoItem
            key={`${photo.src}-${index}`}
            src={photo.src}
            thumbnailSrc={photo.thumbnail}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            meta={photo.meta}
            priority={index < 8}
            onClick={() => setSelectedPhotoIndex(index)}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-12 mb-12">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {!hasMore && ordered.length > 0 && (
        <div className="text-center mb-24">
          <a href="/contact" className="inline-block border-2 border-black px-12 py-4 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            Get in Touch
          </a>
        </div>
      )}

      <Lightbox
        photo={selectedPhotoIndex !== null ? ordered[selectedPhotoIndex] : null}
        onClose={() => setSelectedPhotoIndex(null)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
}
