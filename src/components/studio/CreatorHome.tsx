'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import { GUIDED_SESSIONS_CAPABILITY, type StudioCapabilityId } from '@/lib/api/studioBootstrap';
import { studioHomeView, resolveStudioHomeTab, type StudioHomeTab } from '@/lib/studio/studioAreas';
import MyGuidedSessions from './MyGuidedSessions';
import MyChallenges from './challenges/MyChallenges';

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

const AREA_ICONS: Partial<Record<StudioCapabilityId, ComponentType<IconProps>>> = {
  [GUIDED_SESSIONS_CAPABILITY]: GuidedSessionIcon,
};

export default function CreatorHome() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { enabled, capabilities } = useStudioAccess();
  const home = studioHomeView({ enabled, capabilities });
  const visibleTab: StudioHomeTab = resolveStudioHomeTab(searchParams.get('tab'), { enabled, capabilities });
  const sessionsTabVisible = home.showSessionList;
  const challengesTabVisible = home.showChallengeList;

  const setActiveTab = (tab: StudioHomeTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'create') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container">
        <header
          className={`studio-workspace__intro${
            visibleTab === 'create' ? '' : ' studio-workspace__intro--compact'
          }`}
        >
          {home.showNeutralEmpty ? (
            <>
              <h1 className="studio-workspace__title">{t('home.noAreasTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.noAreasBody')}</p>
            </>
          ) : visibleTab === 'create' ? (
            <>
              <p className="studio-workspace__greeting">{t('home.greeting')}</p>
              <h1 className="studio-workspace__title">{t('home.createTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.createLede')}</p>
            </>
          ) : visibleTab === 'challenges' ? (
            <>
              <h1 className="studio-workspace__title">{t('home.challengesTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.challengesLede')}</p>
            </>
          ) : (
            <>
              <h1 className="studio-workspace__title">{t('home.sessionsTitle')}</h1>
              <p className="studio-workspace__lede">{t('home.sessionsLede')}</p>
            </>
          )}
        </header>

        {home.showNeutralEmpty ? null : (
          <nav className="studio-workspace__tabs" aria-label="Studio sections">
            <button
              type="button"
              className={`studio-workspace__tab${
                visibleTab === 'create' ? ' studio-workspace__tab--active' : ''
              }`}
              aria-current={visibleTab === 'create' ? 'page' : undefined}
              onClick={() => setActiveTab('create')}
            >
              {t('home.tabCreate')}
            </button>
            {sessionsTabVisible ? (
              <button
                type="button"
                className={`studio-workspace__tab${
                  visibleTab === 'sessions' ? ' studio-workspace__tab--active' : ''
                }`}
                aria-current={visibleTab === 'sessions' ? 'page' : undefined}
                onClick={() => setActiveTab('sessions')}
              >
                {t('home.tabSessions')}
              </button>
            ) : null}
            {challengesTabVisible ? (
              <button
                type="button"
                className={`studio-workspace__tab${
                  visibleTab === 'challenges' ? ' studio-workspace__tab--active' : ''
                }`}
                aria-current={visibleTab === 'challenges' ? 'page' : undefined}
                onClick={() => setActiveTab('challenges')}
              >
                {t('home.tabChallenges')}
              </button>
            ) : null}
          </nav>
        )}

        {home.showNeutralEmpty ? null : visibleTab === 'create' ? (
          <section className="studio-workspace__create" aria-labelledby="studio-create-heading">
            <h2 id="studio-create-heading" className="visually-hidden">
              Create
            </h2>
            <ul className="studio-workspace__cards">
              {home.areas.map((area) => {
                const Icon = AREA_ICONS[area.capability];
                return (
                  <li key={area.capability}>
                    <Link href={area.createHref} className="studio-card-link">
                      <article className="studio-card studio-card--active">
                        {Icon ? (
                          <div className="studio-card__icon-wrap" aria-hidden>
                            <Icon className="studio-card__icon" />
                          </div>
                        ) : null}
                        <div className="studio-card__body">
                          <div className="studio-card__heading-row">
                            <h3 className="studio-card__title">{t(area.titleKey)}</h3>
                          </div>
                          <p className="studio-card__desc">{t(area.descriptionKey)}</p>
                          <span className="studio-card__cta">
                            {t(area.actionKey)}
                            <span className="studio-card__cta-arrow" aria-hidden>
                              →
                            </span>
                          </span>
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : visibleTab === 'sessions' ? (
          <MyGuidedSessions active />
        ) : (
          <MyChallenges active embedded />
        )}
      </div>
    </main>
  );
}
