"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { name: "Work", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-white/90 backdrop-blur-sm">
                <Link href="/" className="text-xl font-bold tracking-tighter">
                    KEISUKE SUNAGARE
                </Link>
                <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
                    >
                        <nav className="flex flex-col gap-8 text-2xl font-light">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`${pathname === item.href ? "text-black" : "text-gray-400"
                                        } transition-colors`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-80 flex-col justify-between p-12 z-50 border-r border-gray-100 bg-white/50 backdrop-blur-sm">
                <div>
                    <Link href="/" className="group block mb-16">
                        <h1 className="text-4xl font-serif font-light leading-none tracking-tight mb-2 group-hover:opacity-70 transition-opacity">
                            KEISUKE
                            <br />
                            SUNAGARE
                        </h1>
                        <p className="text-xs font-sans tracking-[0.2em] text-gray-400 uppercase">
                            Live Photographer
                        </p>
                    </Link>

                    <nav className="flex flex-col gap-6">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`text-sm tracking-widest uppercase relative w-fit ${pathname === item.href
                                        ? "text-black font-medium"
                                        : "text-gray-400 hover:text-black"
                                    } transition-colors group`}
                            >
                                {item.name}
                                <span className={`absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-black transition-opacity ${pathname === item.href ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                                    }`} />
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-gray-400 font-light leading-relaxed">
                        Capturing the raw energy<br />and emotion of live music.
                    </p>
                    <div className="text-[10px] text-gray-300 tracking-widest uppercase">
                        © 2025 Tokyo
                    </div>
                </div>
            </aside>
        </>
    );
}
