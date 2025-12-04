"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Instagram, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { name: "Portfolio", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

export default function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-8"
                }`}
        >
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="group">
                    <h1 className="font-oswald text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none">
                        Sunagare<span className="text-red-600">.</span>
                    </h1>
                    <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase font-medium group-hover:text-black transition-colors">
                        Music Photographer
                    </p>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-12">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-bold uppercase tracking-widest hover:text-red-600 transition-colors ${pathname === item.href ? "text-black border-b-2 border-red-600" : "text-gray-500"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className="flex gap-4 border-l border-gray-200 pl-8">
                        <a href="https://www.instagram.com/nagare0313/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" aria-label="Instagram"><Instagram size={18} /></a>
                        <a href="https://x.com/nagare0313" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" aria-label="X (Twitter)"><Twitter size={18} /></a>
                    </div>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-black"
                    onClick={() => setMobileMenuOpen(true)}
                >
                    <Menu size={28} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-0 bg-white z-50 flex flex-col p-8"
                    >
                        <div className="flex justify-end mb-12">
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X size={32} />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-8 text-center">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-3xl font-oswald font-bold uppercase tracking-tighter"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                        {/* Social Links - Mobile */}
                        <div className="flex justify-center gap-6 mt-12">
                            <a
                                href="https://www.instagram.com/nagare0313/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-black transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-8 h-8" />
                            </a>
                            <a
                                href="https://x.com/nagare0313"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-black transition-colors"
                                aria-label="X (Twitter)"
                            >
                                <Twitter className="w-8 h-8" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
