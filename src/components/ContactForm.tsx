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
        } catch (error) {
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setPending(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full bg-neutral-800 border-none rounded-sm p-3 text-white focus:ring-1 focus:ring-white transition-all"
                    placeholder="Your Name"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full bg-neutral-800 border-none rounded-sm p-3 text-white focus:ring-1 focus:ring-white transition-all"
                    placeholder="your@email.com"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="w-full bg-neutral-800 border-none rounded-sm p-3 text-white focus:ring-1 focus:ring-white transition-all resize-none"
                    placeholder="Tell me about your project..."
                />
            </div>

            {message && (
                <div
                    className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                >
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full bg-white text-black font-bold uppercase tracking-wide py-4 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Sending...' : 'Send Message'}
            </button>
        </form>
    );
}
