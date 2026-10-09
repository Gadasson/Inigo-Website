'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ChallengeEditor from '@/components/studio/challenges/ChallengeEditor';

export default function ChallengeEditorRoute() {
  const params = useParams();
  const t = useTranslations('challenges');
  const rawId = params?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const numericId = Number(idStr);

  if (!idStr || !Number.isInteger(numericId) || numericId <= 0) {
    return <p className="studio-form__error">{t('invalidId')}</p>;
  }

  return <ChallengeEditor mode="edit" challengeId={numericId} />;
}
