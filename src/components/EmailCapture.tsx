'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function EmailCapture() {
  const t = useTranslations('emailCapture');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [duplicateEmail, setDuplicateEmail] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  // Email validation effect
  useEffect(() => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const validationDiv = document.getElementById('email-validation');

    if (emailInput && validationDiv) {
      const validateEmail = (email: string) => {
        // Comprehensive email regex that handles all valid email formats including dots, plus signs, and underscores
        const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
      };

      const handleEmailInput = () => {
        const email = emailInput.value;
        if (email === '') {
          validationDiv.textContent = '';
          validationDiv.className = 'validation-message';
        } else if (validateEmail(email)) {
          validationDiv.textContent = t('validEmail');
          validationDiv.className = 'validation-message valid';
        } else {
          validationDiv.textContent = t('invalidEmail');
          validationDiv.className = 'validation-message invalid';
        }
      };

      emailInput.addEventListener('input', handleEmailInput);
      emailInput.addEventListener('blur', handleEmailInput);

      return () => {
        emailInput.removeEventListener('input', handleEmailInput);
        emailInput.removeEventListener('blur', handleEmailInput);
      };
    }
  }, [t]);

  const validateForm = (formData: FormData) => {
    const email = formData.get('email') as string;
    // Comprehensive email regex that handles all valid email formats including dots, plus signs, and underscores
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      alert(t('invalidEmail'));
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if still in cooldown
    if (cooldown > 0) {
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Validate form before submission
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);
    setDuplicateEmail(false);

    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      device: formData.get('device'),
      thoughts: formData.get('thoughts'),
      timestamp: new Date().toISOString()
    };

    try {
      // Try to submit with CORS first to get proper response
      let response;
      try {
        response = await fetch('https://script.google.com/macros/s/AKfycbw4349nDx2iTAjEp0UqqaEuKmx5m8vgJrdZ0yKfF7bzEp6ChbaUIohLBitmiOn7q_h4/exec', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const result = await response.text();

          // Check if it's a duplicate email response
          if (result.includes('Email already exists')) {
            setDuplicateEmail(true);
            return;
          }

          // Success
          setIsSubmitted(true);
          if (form) {
            form.reset();
          }
          setCooldown(300);
          return;
        }
      } catch {
        console.log('CORS failed, trying no-cors mode');
      }

      // Fallback to no-cors mode
      const formDataForGoogle = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formDataForGoogle.append(key, value as string);
      });

      await fetch('https://script.google.com/macros/s/AKfycbw4349nDx2iTAjEp0UqqaEuKmx5m8vgJrdZ0yKfF7bzEp6ChbaUIohLBitmiOn7q_h4/exec', {
        method: 'POST',
        body: formDataForGoogle,
        mode: 'no-cors'
      });

      // Assume success in no-cors mode
      setIsSubmitted(true);
      if (form) {
        form.reset();
      }
      setCooldown(300);

    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('invalidEmail')); // Using a generic error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="early-access" className="early-access-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
          <p>{t('subtitle')}</p>
          <p className="world-change-tagline">{t('tagline')}</p>
        </div>
        
        <div className="early-access-form">
          <form onSubmit={handleFormSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">{t('fullName')} *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  placeholder={t('fullName')}
                  title={t('fullName')}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">{t('email')} *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your.email@example.com"
                  pattern="[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$"
                  title={t('invalidEmail')}
                />
                <div className="validation-message" id="email-validation"></div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="device">{t('device')} *</label>
                <select id="device" name="device" required>
                  <option value="">{t('selectDevice')}</option>
                  <option value="iphone">{t('iphone')}</option>
                  <option value="android">{t('android')}</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="thoughts">{t('thoughts')}</label>
              <textarea
                id="thoughts"
                name="thoughts"
                placeholder={t('thoughtsPlaceholder')}
                rows={3}
              ></textarea>
            </div>

            <div className="form-actions">
              {/* Cooldown Message */}
              {cooldown > 0 && (
                <div className="cooldown-message">
                  <div className="cooldown-icon">⏰</div>
                  <p>{t('cooldownMessage')}</p>
                  <div className="cooldown-timer">
                    <span>{t('nextSubmission')}</span>
                    <span className="timer">{Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={isSubmitting || cooldown > 0}
              >
                {isSubmitting ? t('submitting') : cooldown > 0 ? t('cooldown') : t('submit')}
              </button>

              {/* Default Note */}
              {!isSubmitted && !duplicateEmail && cooldown === 0 && (
                <p className="form-note">* {t('note')}</p>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS/DUPLICATE MODAL */}
      {(isSubmitted || duplicateEmail) && (
        <div className="modal-overlay" onClick={() => {
          setIsSubmitted(false);
          setDuplicateEmail(false);
        }}>
          <div className="modal-content form-result-modal" onClick={(e) => e.stopPropagation()}>
            {/* Success Modal */}
            {isSubmitted && (
              <>
                <div className="modal-header">
                  <div className="modal-icon success">🎉</div>
                  <h3>{t('successTitle')}</h3>
                </div>
                <div className="modal-body">
                  <p>{t('successMessage')}</p>
                  <div className="modal-features">
                    {(t.raw('successFeatures') as string[]).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">{index === 0 ? '📋' : '⏰'}</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => setIsSubmitted(false)}>
                    {t('gotIt')}
                  </button>
                </div>
              </>
            )}

            {/* Duplicate Email Modal */}
            {duplicateEmail && (
              <>
                <div className="modal-header">
                  <div className="modal-icon duplicate">⚠️</div>
                  <h3>{t('duplicateTitle')}</h3>
                </div>
                <div className="modal-body">
                  <p>{t('duplicateMessage')}</p>
                  <div className="modal-features">
                    {(t.raw('duplicateFeatures') as string[]).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">{index === 0 ? '📋' : '🔄'}</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => setDuplicateEmail(false)}>
                    {t('understood')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
