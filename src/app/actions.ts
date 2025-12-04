'use server'

export async function submitContactForm(formData: FormData) {
    const name = formData.get('name')
    const email = formData.get('email')
    const message = formData.get('message')

    // Validate input
    if (!name || !email || !message) {
        return { success: false, message: 'Please fill in all fields.' }
    }

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log the data (simulation)
    console.log('Contact Form Submission:', { name, email, message })

    return { success: true, message: 'Thank you! Your message has been sent.' }
}
