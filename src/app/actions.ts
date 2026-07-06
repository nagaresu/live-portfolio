'use server'

import { Resend } from 'resend'

export async function submitContactForm(formData: FormData) {
    const name = String(formData.get('name') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const message = String(formData.get('message') ?? '').trim()
    const honeypot = String(formData.get('company') ?? '')

    // Bot対策：hidden欄が埋まっていたら静かに成功を装って捨てる
    if (honeypot) {
        return { success: true, message: 'Thank you! Your message has been sent.' }
    }

    if (!name || !email || !message) {
        return { success: false, message: 'Please fill in all fields.' }
    }

    // APIキー未設定なら「送れないこと」を正直に伝える（嘘の成功を返さない）
    if (!process.env.RESEND_API_KEY) {
        return {
            success: false,
            message: 'The form is temporarily unavailable. Please email nagare0313@gmail.com directly.',
        }
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: 'nagare0313@gmail.com',
            replyTo: email,
            subject: `[Portfolio] Inquiry from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        })
        if (error) {
            return {
                success: false,
                message: 'Something went wrong. Please email nagare0313@gmail.com directly.',
            }
        }
        return { success: true, message: 'Thank you! Your message has been sent.' }
    } catch {
        return {
            success: false,
            message: 'Something went wrong. Please email nagare0313@gmail.com directly.',
        }
    }
}
