'use client';

import { useTranslations } from 'next-intl';
import type { RecipeCoverPhase, RecipeImageGap, RecipeImagePath } from '@/lib/studio/recipeImageRequest';

const GAP_KEYS = {
  title: 'imageGap.title',
  ingredients: 'imageGap.ingredients',
  amounts: 'imageGap.amounts',
  steps: 'imageGap.steps',
} as const;

const PHASE_KEYS = {
  pending: 'coverPhase.pending',
  uploading: 'coverPhase.uploading',
  uploaded: 'coverPhase.uploaded',
  failed: 'coverPhase.failed',
} as const;

type Props = {
  idPrefix: string;
  path: RecipeImagePath | null;
  editable: boolean;
  busy: boolean;
  previewSrc: string | null;
  phase: RecipeCoverPhase;
  illustration: boolean;
  missing: readonly RecipeImageGap[];
  copied: boolean;
  fallbackPrompt: string | null;
  onPath: (path: RecipeImagePath) => void;
  onCopy: () => void;
  onIllustration: (value: boolean) => void;
  onCover: (file: File | null) => void;
};

export default function RecipeCoverSection({
  idPrefix,
  path,
  editable,
  busy,
  previewSrc,
  phase,
  illustration,
  missing,
  copied,
  fallbackPrompt,
  onPath,
  onCopy,
  onIllustration,
  onCover,
}: Props) {
  const t = useTranslations('recipes');
  const uploadId = `${idPrefix}-cover`;
  const illustrationId = `${idPrefix}-illustration`;

  return (
    <section className="studio-recipe-cover-section" aria-labelledby={`${idPrefix}-cover-title`}>
      <h2 id={`${idPrefix}-cover-title`} className="studio-form__legend">
        {t('imageTitle')}
      </h2>
      {previewSrc ? (
        // The cover is a local preview or the URL returned by the server.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="studio-recipe-cover" src={previewSrc} alt={t('coverAlt')} />
      ) : null}
      {phase !== 'none' ? (
        <p className={phase === 'failed' ? 'studio-form__error' : 'studio-form-page__status'} role="status">
          {t(PHASE_KEYS[phase])}
        </p>
      ) : null}

      <div className="studio-recipe-cover-choices">
        <button
          type="button"
          className={`creator-workspace__media-btn${path === 'own' ? ' studio-recipe-cover-choice--selected' : ''}`}
          aria-pressed={path === 'own'}
          disabled={!editable || busy}
          onClick={() => onPath('own')}
        >
          {t('imageOwn')}
        </button>
        <button
          type="button"
          className={`creator-workspace__media-btn${path === 'ai' ? ' studio-recipe-cover-choice--selected' : ''}`}
          aria-pressed={path === 'ai'}
          disabled={!editable || busy}
          onClick={() => onPath('ai')}
        >
          {t('imageAi')}
        </button>
      </div>

      {path === 'own' ? <p className="studio-form__field-lede">{t('imageOwnLede')}</p> : null}

      {path === 'ai' ? (
        <div className="studio-recipe-cover-ai">
          <p className="studio-form__field-lede">{t('imageAiLede')}</p>
          <button type="button" className="studio-form__submit" disabled={!editable || busy} onClick={onCopy}>
            {t('imageCopy')}
          </button>
          {missing.length > 0 ? (
            <div role="alert">
              <p className="studio-form__error">{t('imageGapIntro')}</p>
              <ul className="studio-recipe-cover-gaps">
                {missing.map((gap) => (
                  <li key={gap}>{t(GAP_KEYS[gap])}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {copied ? (
            <div className="studio-form-page__status" role="status">
              <p>{t('imageCopied')}</p>
              <ol className="studio-recipe-paste__steps">
                <li>{t('imageCopiedStep1')}</li>
                <li>{t('imageCopiedStep2')}</li>
                <li>{t('imageCopiedStep3')}</li>
              </ol>
            </div>
          ) : null}
          {fallbackPrompt ? (
            <div className="studio-form__field">
              <label htmlFor={`${idPrefix}-image-prompt`}>{t('imageCopyManual')}</label>
              <textarea
                id={`${idPrefix}-image-prompt`}
                className="studio-recipe-paste__prompt"
                readOnly
                dir="auto"
                value={fallbackPrompt}
              />
            </div>
          ) : null}
          <p className="studio-form__field-lede">{t('imageAiUpload')}</p>
        </div>
      ) : null}

      {path ? (
        <div className="studio-form__field">
          <label htmlFor={uploadId}>{t('imageUpload')}</label>
          <p className="studio-form__field-lede">{t('coverLede')}</p>
          <input
            id={uploadId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!editable || busy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              onCover(file);
            }}
          />
        </div>
      ) : null}

      <label className="studio-recipe-check" htmlFor={illustrationId}>
        <input
          id={illustrationId}
          type="checkbox"
          checked={illustration}
          disabled={!editable || busy}
          onChange={(event) => onIllustration(event.target.checked)}
        />
        <span>{path === 'ai' ? t('imageAiIllustration') : t('illustrationLede')}</span>
      </label>
    </section>
  );
}
