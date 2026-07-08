'use client';

import {
  type WorkspaceReadiness,
} from '@/lib/studio/workspaceReadiness';
import { useTranslations } from 'next-intl';

type Props = {
  readiness: WorkspaceReadiness;
};

const ITEM_LABEL_KEYS: Record<string, string> = {
  details: 'itemDetails',
  'primary-media': 'itemPrimaryMedia',
  cover: 'itemCover',
};

const STATE_LABEL_KEYS: Record<string, string> = {
  complete: 'stateComplete',
  waiting: 'stateWaiting',
  recommended: 'stateRecommended',
  coming: 'stateComing',
};

export default function WorkspaceReadinessChecklist({ readiness }: Props) {
  const t = useTranslations('readiness');

  return (
    <ul className="creator-workspace__readiness">
      {readiness.items.map((item) => (
        <li
          key={item.id}
          className={`creator-workspace__readiness-item creator-workspace__readiness-item--${item.state}`}
        >
          <span className="creator-workspace__readiness-label">
            {t(ITEM_LABEL_KEYS[item.id] ?? item.id)}
          </span>
          <span className="creator-workspace__readiness-state">
            {item.state === 'complete' ? '✓ ' : ''}
            {t(STATE_LABEL_KEYS[item.state] ?? item.state)}
          </span>
        </li>
      ))}
    </ul>
  );
}
