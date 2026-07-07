"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface PhotoItemProps {
    src: string;
    thumbnailSrc?: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    meta?: {
        location?: string;
        date?: string;
    };
    onClick?: () => void;
}

export default function PhotoItem({ src, thumbnailSrc, alt, width, height, priority = false, meta, onClick }: PhotoItemProps) {
    const [isLoading, setIsLoading] = useState(true);
    // 実寸の比率で枠を確保する（縦写真は縦長のまま・横写真は横長のまま＝トリミングしない）。
    const ratio = width && height ? `${width}/${height}` : "3/2";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.5 }}
            className="w-full group cursor-pointer relative break-inside-avoid mb-3"
            onClick={onClick}
        >
            <div
                className="relative w-full overflow-hidden bg-neutral-900"
                style={{ aspectRatio: ratio }}
            >
                <img
                    src={thumbnailSrc || src}
                    alt={alt}
                    // 枠が実比率なので object-cover でもトリミングは起きない（枠＝画像比率）。
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.03] ${isLoading ? "scale-105 blur-lg" : "scale-100 blur-0"
                        }`}
                    loading={priority ? "eager" : "lazy"}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                {meta?.date && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-xs tracking-widest text-white uppercase">
                            {meta.date}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
