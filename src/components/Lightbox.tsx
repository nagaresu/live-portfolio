"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

interface LightboxProps {
    photo: { src: string; alt: string; meta?: { location?: string; date?: string } } | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export default function Lightbox({ photo, onClose, onNext, onPrev }: LightboxProps) {
    // スマホ用スワイプ：横に50px以上動いたら前後送り（下に閉じるほどではない小移動は無視）。
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) onNext(); else onPrev();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") onNext();
            if (e.key === "ArrowLeft") onPrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrev]);

    return (
        <AnimatePresence>
            {photo && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
                    onClick={onClose}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image Lightbox"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white transition-colors z-10"
                        aria-label="Close lightbox"
                    >
                        <X size={28} />
                    </button>

                    {/* Navigation Buttons（スマホでも表示。スワイプでも送れる） */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="absolute left-1 md:left-8 p-2 text-white/70 hover:text-white transition-colors z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-9 h-9 md:w-12 md:h-12" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="absolute right-1 md:right-8 p-2 text-white/70 hover:text-white transition-colors z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-9 h-9 md:w-12 md:h-12" />
                    </button>

                    {/* Image Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* next/image(fill+unoptimized)がロードされないため素のimgに置換 */}
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Caption */}
                        {photo.meta?.date && (
                            <div className="absolute bottom-0 left-0 p-4 text-left">
                                <p className="text-sm tracking-widest text-white uppercase">
                                    {photo.meta.date}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
