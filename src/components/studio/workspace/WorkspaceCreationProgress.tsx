'use client';

import type { CreatorWorkspaceSection } from '@/lib/studio/creatorWorkspaceSections';
import {
  CREATION_PROGRESS_STEPS,
  getCreationStepState,
  getNextCreationSection,
  type WorkspaceReadiness,
} from '@/lib/studio/workspaceReadiness';
import { useTranslations } from 'next-intl';

type Props = {
  readiness: WorkspaceReadiness;
  activeSection: CreatorWorkspaceSection;
  onSectionChange: (section: CreatorWorkspaceSection) => void;
};

const STEP_LABEL_KEYS: Record<string, string> = {
  details: 'stepDetails',
  media: 'stepMedia',
  publish: 'stepPublish',
};

export default function WorkspaceCreationProgress({
  readiness,
  activeSection,
  onSectionChange,
}: Props) {
  const t = useTranslations('creationProgress');
  const nextSection = getNextCreationSection(readiness);

  return (
    <nav className="creator-workspace__creation-progress" aria-label={t('aria')}>
      <ol className="creator-workspace__creation-steps">
        {CREATION_PROGRESS_STEPS.map((step, index) => {
          const state = getCreationStepState(readiness, step);
          const isNext = nextSection === step.section && state !== 'complete';
          const isActive = activeSection === step.section;

          return (
            <li key={step.id} className="creator-workspace__creation-step">
              {index > 0 ? (
                <span className="creator-workspace__creation-connector" aria-hidden />
              ) : null}
              <button
                type="button"
                className={`creator-workspace__creation-step-btn creator-workspace__creation-step-btn--${state}${
                  isNext ? ' creator-workspace__creation-step-btn--next' : ''
                }${isActive ? ' creator-workspace__creation-step-btn--active' : ''}`}
                onClick={() => onSectionChange(step.section)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="creator-workspace__creation-step-marker" aria-hidden>
                  {state === 'complete' ? '✓' : index + 1}
                </span>
                <span className="creator-workspace__creation-step-label">
                  {t(STEP_LABEL_KEYS[step.id] ?? step.id)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
