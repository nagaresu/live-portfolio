import type { Metadata } from "next";
import { Mail, Instagram } from 'lucide-react';
import XLogo from '../../components/XLogo';
import { CONTACT } from "@/content/profile";

export const metadata: Metadata = {
    title: "Contact",
    description: "Get in touch with Keisuke Sunagare for photography assignments and collaborations.",
};

export default function Contact() {
    const { email, instagram, x, locationTagline: tagline } = CONTACT;

    return (
        <div className="container mx-auto px-4 py-12 md:py-24">
            <h1 className="text-6xl md:text-8xl font-bold font-oswald mb-12 uppercase tracking-tighter">
                Contact
            </h1>

            <div className="max-w-2xl space-y-10">
                <p className="text-xl md:text-2xl font-light leading-relaxed text-neutral-300">
                    {tagline}
                </p>

                <div className="space-y-6">
                    <p className="text-neutral-400 text-xs uppercase tracking-[0.3em]">
                        Send a DM
                    </p>
                    {/* 連絡はX/InstagramのDMで（フォームは廃止・砂流さん指示 2026-07-08） */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a
                            href={instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 border border-white/25 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                        >
                            <Instagram className="w-5 h-5" />
                            Instagram
                        </a>
                        <a
                            href={x}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 border border-white/25 px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                        >
                            <XLogo className="w-4 h-4" />
                            X
                        </a>
                    </div>

                    <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors pt-2"
                    >
                        <Mail className="w-4 h-4" />
                        {email}
                    </a>
                </div>
            </div>
        </div>
    );
}
