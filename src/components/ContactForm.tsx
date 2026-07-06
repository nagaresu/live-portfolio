'use client';

import { useState } from 'react';
import { submitContactForm } from '../app/actions';

export default function ContactForm() {
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setPending(true);
        setMessage(null);

        try {
            const result = await submitContactForm(formData);
            if (result.success) {
                setMessage({ type: 'success', text: result.message });
                const form = document.querySelector('form') as HTMLFormElement;
                form?.reset();
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch {
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setPending(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {/* Honeypot: 人間には見えない。botが埋めたら送信を破棄する */}
            <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full bg-white border border-gray-300 rounded-sm p-3 text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    placeholder="Your Name"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full bg-white border border-gray-300 rounded-sm p-3 text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    placeholder="your@email.com"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full bg-white border border-gray-300 rounded-sm p-3 text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all resize-none"
                    placeholder="Tell me about your project..."
                />
            </div>

            {message && (
                <div
                    className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full bg-black text-white font-bold uppercase tracking-wide py-4 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Sending...' : 'Send Message'}
            </button>

            <p className="text-xs text-gray-500 text-center">
                Prefer email? <a href="mailto:nagare0313@gmail.com" className="underline hover:text-black transition-colors">nagare0313@gmail.com</a>
            </p>
        </form>
    );
}
