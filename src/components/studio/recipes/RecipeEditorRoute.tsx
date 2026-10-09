'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import RecipeEditor from '@/components/studio/recipes/RecipeEditor';

export default function RecipeEditorRoute() {
  const params = useParams();
  const t = useTranslations('recipes');
  const rawId = params?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const numericId = Number(idStr);

  if (!idStr || !Number.isInteger(numericId) || numericId <= 0) {
    return <p className="studio-form__error">{t('invalidId')}</p>;
  }

  return <RecipeEditor mode="edit" recipeId={numericId} />;
}
