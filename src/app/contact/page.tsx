'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your EmailJS public key
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send email using EmailJS
      const result = await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'inigomeditation@gmail.com'
        },
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
      );
      
      if (result.status === 200) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('There was an error sending your message. Please try again or email us directly at inigomeditation@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <h1>Get in Touch</h1>
            <p>Have questions? Want to collaborate? We&apos;d love to hear from you.</p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send us a message</h2>
              <p>We&apos;ll get back to you within 24 hours.</p>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="Tell us what's on your mind..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-large"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              ) : (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <h3>Message sent successfully!</h3>
                  <p>Thank you for reaching out. We&apos;ll get back to you soon.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="btn btn-secondary"
                  >
                    Send another message
                  </button>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="contact-info-section">
              <h2>Other ways to reach us</h2>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-content">
                    <h3>Email</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a></p>
                    <p>For general inquiries and support</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🔒</div>
                  <div className="method-content">
                    <h3>Privacy</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a></p>
                    <p>For privacy and data-related questions</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🌍</div>
                  <div className="method-content">
                    <h3>Social</h3>
                    <p>Follow us for updates and community</p>
                    <p>Links coming soon...</p>
                  </div>
                </div>
              </div>

              <div className="contact-note">
                <h3>Response Time</h3>
                <p>We typically respond within 24 hours during business days. For urgent matters, please include &ldquo;URGENT&rdquo; in your subject line.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="contact-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to join the quiet revolution?</h2>
            <p>While you&apos;re here, why not sign up for early access?</p>
            <div className="cta-buttons">
              <Link href="/#early-access" className="btn btn-primary btn-large">
                Join Early Access
              </Link>
              <Link href="/about" className="btn btn-ghost">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
