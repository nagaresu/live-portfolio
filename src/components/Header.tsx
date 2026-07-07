"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// X（旧Twitter）の公式ロゴ。lucideのTwitterは旧・鳥アイコンなので自前SVGに置換。
function XLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

const defaultNavItems = [
    { name: "Portfolio", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

type NavItem = { name: string; href: string };

export default function Header({ navItems = defaultNavItems }: { navItems?: NavItem[] }) {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // トップ最上部（未スクロール）はヒーロー画像の上に乗るので文字を白にする。About/Contactは無影響。
    const onDark = pathname === "/" && !isScrolled;

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
                    <h1 className={`font-oswald text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-none transition-colors ${onDark ? "text-white" : "text-black"}`}>
                        Sunagare<span className="text-red-600">.</span>
                    </h1>
                    <p className={`text-[10px] tracking-[0.3em] uppercase font-medium transition-colors ${onDark ? "text-white/70 group-hover:text-white" : "text-gray-500 group-hover:text-black"}`}>
                        Music Photographer
                    </p>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-12">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-bold uppercase tracking-widest hover:text-red-600 transition-colors ${pathname === item.href
                                ? (onDark ? "text-white border-b-2 border-red-600" : "text-black border-b-2 border-red-600")
                                : (onDark ? "text-white/80" : "text-gray-500")
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className={`flex gap-4 border-l pl-8 ${onDark ? "border-white/30" : "border-gray-200"}`}>
                        <a href="https://www.instagram.com/nagare0313/" target="_blank" rel="noopener noreferrer" className={`transition-colors ${onDark ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-black"}`} aria-label="Instagram"><Instagram size={18} /></a>
                        <a href="https://x.com/nagare0313" target="_blank" rel="noopener noreferrer" className={`transition-colors ${onDark ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-black"}`} aria-label="X (Twitter)"><XLogo className="w-[17px] h-[17px]" /></a>
                    </div>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden transition-colors ${onDark ? "text-white" : "text-black"}`}
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
                                <XLogo className="w-7 h-7" />
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
