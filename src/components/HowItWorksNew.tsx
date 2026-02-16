'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function HowItWorksNew() {
  const t = useTranslations('howItWorksNew');
  const ref = useScrollAnimation();

  const cards = [
    {
      icon: '🚀',
      title: t('card1Title'),
      description: t('card1Description')
    },
    {
      icon: '👁️',
      title: t('card2Title'),
      description: t('card2Description')
    },
    {
      icon: '✨',
      title: t('card3Title'),
      description: t('card3Description')
    },
    {
      icon: '🤝',
      title: t('card4Title'),
      description: t('card4Description')
    }
  ];

  return (
    <section ref={ref} className="how-it-works-new section-fade-in">
      <div className="container">
        <div className="how-it-works-grid">
          {cards.map((card, index) => (
            <div key={index} className="how-it-works-card">
              <div className="card-icon">{card.icon}</div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-description">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
