'use client';

import type { CreatorWorkspaceSection } from '@/lib/studio/creatorWorkspaceSections';
import {
  creationSectionLabelKey,
  getForwardCreationSection,
  getPreviousCreationSection,
} from '@/lib/studio/workspaceReadiness';
import { useTranslations } from 'next-intl';

type Props = {
  activeSection: CreatorWorkspaceSection;
  onSectionChange: (section: CreatorWorkspaceSection) => void;
};

function sectionLabel(
  section: CreatorWorkspaceSection,
  tProgress: ReturnType<typeof useTranslations>,
  tTabs: ReturnType<typeof useTranslations>,
): string {
  if (section === 'overview' || section === 'preview') {
    return tTabs(section);
  }
  return tProgress(creationSectionLabelKey(section));
}

export default function WorkspaceCreationNav({
  activeSection,
  onSectionChange,
}: Props) {
  const t = useTranslations('creationNav');
  const tProgress = useTranslations('creationProgress');
  const tTabs = useTranslations('tabs');

  const previousSection = getPreviousCreationSection(activeSection);
  const forwardSection = getForwardCreationSection(activeSection);

  if (!previousSection && !forwardSection) {
    return null;
  }

  return (
    <nav className="creator-workspace__creation-nav" aria-label={t('aria')}>
      <div className="creator-workspace__creation-nav-actions">
        {previousSection ? (
          <button
            type="button"
            className="creator-workspace__creation-nav-back"
            onClick={() => onSectionChange(previousSection)}
          >
            <span className="studio-back-arrow" aria-hidden>
              ←
            </span>{' '}
            {t('backToStep', { step: sectionLabel(previousSection, tProgress, tTabs) })}
          </button>
        ) : (
          <span className="creator-workspace__creation-nav-spacer" aria-hidden />
        )}

        {forwardSection ? (
          <button
            type="button"
            className="creator-workspace__creation-nav-forward studio-form__submit"
            onClick={() => onSectionChange(forwardSection)}
          >
            {t('continueToStep', { step: sectionLabel(forwardSection, tProgress, tTabs) })}
            <span className="studio-card__cta-arrow" aria-hidden>
              →
            </span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
