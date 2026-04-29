'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CreateYourPresence() {
  const t = useTranslations('createYourPresence');
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="create-presence home-section-social section-fade-in" aria-labelledby="social-quiet-title">
      <div className="container">
        <div className="create-presence-content create-presence-content--quiet">
          <div className="create-presence-text">
            <h2 id="social-quiet-title" className="create-presence-headline create-presence-headline--stacked">
              <span className="create-presence-headline-line">{t('title1')}</span>
              <span className="create-presence-headline-line">{t('title2')}</span>
              <span className="create-presence-headline-line">{t('title3')}</span>
            </h2>
            <p className="create-presence-supporting">{t('supporting')}</p>
          </div>

          <div className="create-presence-visual" aria-hidden>
            <div className="feed-mockup feed-mockup--quiet">
              <div className="feed-header">
                <div className="feed-avatar feed-avatar--quiet" />
                <div className="feed-user-info">
                  <div className="feed-line short feed-line--quiet" />
                  <div className="feed-line shorter feed-line--quiet" />
                </div>
              </div>

              <div className="feed-content">
                <div className="feed-image-placeholder feed-image-placeholder--quiet">
                  <div className="feed-abstract-shapes" />
                </div>

                <div className="feed-text">
                  <div className="feed-line feed-line--quiet" />
                  <div className="feed-line short feed-line--quiet" />
                  <div className="feed-line shorter feed-line--quiet" />
                </div>

                <div className="feed-actions feed-actions--quiet">
                  <span className="feed-pill feed-pill--quiet" />
                  <span className="feed-pill feed-pill--quiet feed-pill--narrow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
