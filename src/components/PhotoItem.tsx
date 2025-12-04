"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";

interface PhotoItemProps {
    src: string;
    alt: string;
    priority?: boolean;
    orientation?: "vertical" | "horizontal";
    meta?: {
        location?: string;
        date?: string;
    };
    onClick?: () => void; // Added onClick prop
}

export default function PhotoItem({ src, alt, priority = false, orientation = "horizontal", meta, onClick }: PhotoItemProps) {
    const [isLoading, setIsLoading] = useState(true); // Added isLoading state

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.5 }}
            className="w-full group cursor-pointer relative break-inside-avoid mb-2"
            onClick={onClick} // Added onClick handler
        >
            <div
                className="relative w-full overflow-hidden bg-gray-100"
                style={{ aspectRatio: orientation === "vertical" ? "2/3" : "3/2" }}
            >
                <img
                    src={src}
                    alt={alt}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${ // Modified className for loading state
                        isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
                        }`}
                    loading={priority ? "eager" : "lazy"}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)} // Handle error state
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                {meta?.date && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-xs tracking-widest text-white uppercase">
                            {meta.date}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
