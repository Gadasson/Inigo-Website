# 📧 EmailJS Setup Guide for Inigo Contact Form

## Overview
This guide will help you set up EmailJS so your contact form actually sends emails to `inigomeditation@gmail.com` instead of just showing a fake success message.

## Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** as your email provider
4. Connect your Gmail account (`inigomeditation@gmail.com`)
5. **Save the Service ID** (you'll need this)

## Step 3: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template structure:

**Template Name:** `Inigo Contact Form`

**Subject:** `New Contact Form Submission from {{from_name}}`

**Content:**
```
New contact form submission from Inigo website:

Name: {{from_name}}
Email: {{from_email}}
Subject: {{subject}}
Message: {{message}}

This email was sent from the Inigo contact form.
```

4. **Save the Template ID** (you'll need this)

## Step 4: Get Your Public Key
1. Go to **Account** → **API Keys**
2. **Copy your Public Key**

## Step 5: Update Your Website
1. Open `src/app/contact/page.tsx`
2. Replace these placeholders with your actual values:

```typescript
// Replace YOUR_SERVICE_ID with your EmailJS service ID
'YOUR_SERVICE_ID'

// Replace YOUR_TEMPLATE_ID with your EmailJS template ID  
'YOUR_TEMPLATE_ID'

// Replace YOUR_PUBLIC_KEY with your EmailJS public key
'YOUR_PUBLIC_KEY'
```

**Example:**
```typescript
const result = await emailjs.send(
  'service_abc123', // Your service ID
  'template_xyz789', // Your template ID
  {
    from_name: formData.name,
    from_email: formData.email,
    subject: formData.subject,
    message: formData.message,
    to_email: 'inigomeditation@gmail.com'
  },
  'public_key_123' // Your public key
);
```

## Step 6: Test the Form
1. Start your development server: `npm run dev`
2. Go to `/contact` page
3. Fill out and submit the form
4. Check your Gmail inbox (`inigomeditation@gmail.com`)
5. You should receive the email!

## Free Plan Limits
- **200 emails per month** (perfect for starting)
- **2 email templates**
- **1 email service**

## Troubleshooting
- **Emails not sending**: Check your service ID, template ID, and public key
- **Gmail connection issues**: Make sure 2FA is enabled and you're using an app password
- **Template variables**: Ensure template variables match the ones in the code

## Security Notes
- Your public key is safe to expose in frontend code
- EmailJS handles the email sending securely
- No sensitive credentials are stored in your website code

## Alternative: Simple Gmail Integration
If you prefer not to use EmailJS, you can also:
1. Use a form service like Formspree or Netlify Forms
2. Set up a simple backend API with email functionality
3. Use Google Apps Script (similar to your current setup)

## Next Steps
Once EmailJS is set up:
1. Test the contact form thoroughly
2. Monitor your Gmail for incoming messages
3. Consider upgrading to a paid plan if you need more emails
4. Customize the email template to match your brand

Your contact form will then actually send real emails to `inigomeditation@gmail.com`! 🎉
