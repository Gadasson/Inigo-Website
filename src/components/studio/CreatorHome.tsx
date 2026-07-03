'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';

type IconProps = { className?: string };

function GuidedSessionIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M10.25 8.25v7.5l6-4.5-6-3Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InsightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.5 18h5M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PracticeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12c2-4 4-6 8-6s6 2 8 6c-2 4-4 6-8 6s-6-2-8-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function ResourceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h8l3 3v13H7V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M15 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

type CreationOption = {
  id: string;
  title: string;
  description: string;
  action?: string;
  available: boolean;
  Icon: ComponentType<IconProps>;
};

const CREATION_OPTIONS: CreationOption[] = [
  {
    id: 'guided-session',
    title: 'Guided Session',
    description: 'Create a guided practice for the Inigo library.',
    action: 'Create guided session',
    available: true,
    Icon: GuidedSessionIcon,
  },
  {
    id: 'insight',
    title: 'Insight',
    description: 'Share a reflection, note, or teaching.',
    available: false,
    Icon: InsightIcon,
  },
  {
    id: 'practice',
    title: 'Practice',
    description: 'Share a simple breathing, movement, or daily exercise.',
    available: false,
    Icon: PracticeIcon,
  },
  {
    id: 'resource',
    title: 'Resource',
    description: 'Share something meaningful: music, recipe, book, or ritual.',
    available: false,
    Icon: ResourceIcon,
  },
];

export default function CreatorHome() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container">
        <header className="studio-workspace__intro">
          <p className="studio-workspace__greeting">Welcome back</p>
          <h1 className="studio-workspace__title">What would you like to create today?</h1>
          <p className="studio-workspace__lede">
            Pass something meaningful forward through Inigo.
          </p>
        </header>

        <section className="studio-workspace__create" aria-labelledby="studio-create-heading">
          <h2 id="studio-create-heading" className="studio-workspace__create-label">
            Create
          </h2>
          <ul className="studio-workspace__cards">
            {CREATION_OPTIONS.map((option) => (
              <li key={option.id}>
                {option.available ? (
                  <Link href="/studio/guided-sessions/new" className="studio-card-link">
                    <article className="studio-card studio-card--active">
                      <div className="studio-card__icon-wrap" aria-hidden>
                        <option.Icon className="studio-card__icon" />
                      </div>
                      <div className="studio-card__body">
                        <div className="studio-card__heading-row">
                          <h3 className="studio-card__title">{option.title}</h3>
                        </div>
                        <p className="studio-card__desc">{option.description}</p>
                        {option.action ? (
                          <span className="studio-card__cta">
                            {option.action}
                            <span className="studio-card__cta-arrow" aria-hidden>
                              →
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </article>
                  </Link>
                ) : (
                  <article className="studio-card studio-card--soon">
                    <div className="studio-card__icon-wrap" aria-hidden>
                      <option.Icon className="studio-card__icon" />
                    </div>
                    <div className="studio-card__body">
                      <div className="studio-card__heading-row">
                        <h3 className="studio-card__title">{option.title}</h3>
                        <span className="studio-card__badge">Soon</span>
                      </div>
                      <p className="studio-card__desc">{option.description}</p>
                    </div>
                  </article>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
