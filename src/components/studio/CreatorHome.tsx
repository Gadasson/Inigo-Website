'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MyGuidedSessions from './MyGuidedSessions';

type IconProps = { className?: string };

type StudioHomeTab = 'create' | 'sessions';

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
  titleKey: string;
  descKey: string;
  actionKey?: string;
  available: boolean;
  Icon: ComponentType<IconProps>;
};

const CREATION_OPTIONS: CreationOption[] = [
  {
    id: 'guided-session',
    titleKey: 'create.guidedSessionTitle',
    descKey: 'create.guidedSessionDesc',
    actionKey: 'create.guidedSessionAction',
    available: true,
    Icon: GuidedSessionIcon,
  },
  {
    id: 'insight',
    titleKey: 'create.insightTitle',
    descKey: 'create.insightDesc',
    available: false,
    Icon: InsightIcon,
  },
  {
    id: 'practice',
    titleKey: 'create.practiceTitle',
    descKey: 'create.practiceDesc',
    available: false,
    Icon: PracticeIcon,
  },
  {
    id: 'resource',
    titleKey: 'create.resourceTitle',
    descKey: 'create.resourceDesc',
    available: false,
    Icon: ResourceIcon,
  },
];

const STUDIO_TABS: { id: StudioHomeTab; labelKey: string }[] = [
  { id: 'create', labelKey: 'home.tabCreate' },
  { id: 'sessions', labelKey: 'home.tabSessions' },
];

function tabFromSearchParams(searchParams: ReturnType<typeof useSearchParams>): StudioHomeTab {
  return searchParams.get('tab') === 'sessions' ? 'sessions' : 'create';
}

export default function CreatorHome() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const activeTab = tabFromSearchParams(searchParams);

  const setActiveTab = (tab: StudioHomeTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'sessions') {
      params.set('tab', 'sessions');
    } else {
      params.delete('tab');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container">
        <header
          className={`studio-workspace__intro${
            activeTab === 'sessions' ? ' studio-workspace__intro--compact' : ''
          }`}
        >
          {activeTab === 'create' ? (
            <>
              <p className="studio-workspace__greeting">{t('home.greeting')}</p>
              <h1 className="studio-workspace__title">{t('home.createTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.createLede')}</p>
            </>
          ) : (
            <>
              <h1 className="studio-workspace__title">{t('home.sessionsTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.sessionsLede')}</p>
            </>
          )}
        </header>

        <nav className="studio-workspace__tabs" aria-label="Studio sections">
          {STUDIO_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`studio-workspace__tab${
                activeTab === tab.id ? ' studio-workspace__tab--active' : ''
              }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        {activeTab === 'create' ? (
          <section className="studio-workspace__create" aria-labelledby="studio-create-heading">
            <h2 id="studio-create-heading" className="visually-hidden">
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
                            <h3 className="studio-card__title">{t(option.titleKey)}</h3>
                          </div>
                          <p className="studio-card__desc">{t(option.descKey)}</p>
                          {option.actionKey ? (
                            <span className="studio-card__cta">
                              {t(option.actionKey)}
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
                          <h3 className="studio-card__title">{t(option.titleKey)}</h3>
                          <span className="studio-card__badge">{t('create.soon')}</span>
                        </div>
                        <p className="studio-card__desc">{t(option.descKey)}</p>
                      </div>
                    </article>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <MyGuidedSessions active />
        )}
      </div>
    </main>
  );
}
