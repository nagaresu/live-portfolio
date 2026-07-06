import type { Metadata } from "next";
import { Mail, Instagram, Twitter } from 'lucide-react';
import ContactForm from '../../components/ContactForm';
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
                {/* Contact Info */}
                <div className="space-y-8">
                    <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-700">
                        {tagline}
                    </p>

                    <div className="space-y-4">
                        <a
                            href={`mailto:${email}`}
                            className="flex items-center gap-3 text-lg hover:text-black transition-colors group"
                        >
                            <Mail className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
                            {email}
                        </a>
                        <div className="flex gap-6 pt-4">
                            <a
                                href={instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-black transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-6 h-6" />
                            </a>
                            <a
                                href={x}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-black transition-colors"
                                aria-label="X (Twitter)"
                            >
                                <Twitter className="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Contact Form Container */}
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
