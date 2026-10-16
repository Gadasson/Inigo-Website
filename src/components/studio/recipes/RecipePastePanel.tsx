'use client';

import StudioFieldHint from '@/components/studio/StudioFieldHint';

type Props = {
  modeLabel: string;
  ideaLabel: string;
  mineLabel: string;
  guide: string;
  mineChecked: boolean;
  hintLabel: string;
  requestLabel: string;
  requestPlaceholder: string;
  request: string;
  requestError: string | null;
  copyLabel: string;
  copiedLabel: string | null;
  manualCopyLabel: string | null;
  fallbackPrompt: string | null;
  reviewNote: string;
  pasteLabel: string;
  showLabel: string;
  manualLabel: string;
  backLabel: string;
  text: string;
  error: string | null;
  disabled?: boolean;
  onRequest: (value: string) => void;
  onMine: (value: boolean) => void;
  onText: (value: string) => void;
  onCopy: () => void;
  onShow: () => void;
  onManual: () => void;
  onBack: () => void;
};

export default function RecipePastePanel({
  modeLabel,
  ideaLabel,
  mineLabel,
  guide,
  mineChecked,
  hintLabel,
  requestLabel,
  requestPlaceholder,
  request,
  requestError,
  copyLabel,
  copiedLabel,
  manualCopyLabel,
  fallbackPrompt,
  reviewNote,
  pasteLabel,
  showLabel,
  manualLabel,
  backLabel,
  text,
  error,
  disabled = false,
  onRequest,
  onMine,
  onText,
  onCopy,
  onShow,
  onManual,
  onBack,
}: Props) {
  return (
    <div className="studio-recipe-paste">
      <div className="studio-form__field">
        <span id="recipe-mode-label" className="studio-form__legend">
          {modeLabel}
        </span>
        <div className="studio-time-suitability" role="group" aria-labelledby="recipe-mode-label">
          <button
            type="button"
            className={`studio-time-suitability__chip${mineChecked ? '' : ' studio-time-suitability__chip--selected'}`}
            aria-pressed={!mineChecked}
            disabled={disabled}
            onClick={() => onMine(false)}
          >
            {ideaLabel}
          </button>
          <button
            type="button"
            className={`studio-time-suitability__chip${mineChecked ? ' studio-time-suitability__chip--selected' : ''}`}
            aria-pressed={mineChecked}
            disabled={disabled}
            onClick={() => onMine(true)}
          >
            {mineLabel}
          </button>
        </div>
        <p className="studio-form__field-lede">{guide}</p>
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-request">{requestLabel}</label>
        <textarea
          id="recipe-request"
          className="studio-recipe-paste__request"
          value={request}
          placeholder={requestPlaceholder}
          disabled={disabled}
          onChange={(event) => onRequest(event.target.value)}
        />
      </div>
      <div className="studio-recipe-actions">
        <button type="button" className="studio-form__submit" disabled={disabled} onClick={onCopy}>
          {copyLabel}
        </button>
      </div>
      {requestError ? (
        <p className="studio-form__error" role="alert">
          {requestError}
        </p>
      ) : null}
      {copiedLabel ? (
        <p className="studio-form-page__status" role="status">
          {copiedLabel}
        </p>
      ) : null}
      {fallbackPrompt ? (
        <div className="studio-form__field">
          {manualCopyLabel ? <label htmlFor="recipe-prompt-fallback">{manualCopyLabel}</label> : null}
          <textarea id="recipe-prompt-fallback" className="studio-recipe-paste__prompt" readOnly dir="auto" value={fallbackPrompt} />
        </div>
      ) : null}
      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <label htmlFor="recipe-paste">{pasteLabel}</label>
          <StudioFieldHint id="recipe-paste-hint" text={reviewNote} label={hintLabel} />
        </div>
        <textarea
          id="recipe-paste"
          className="studio-recipe-paste__input"
          value={text}
          disabled={disabled}
          onChange={(event) => onText(event.target.value)}
        />
      </div>
      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="studio-recipe-actions">
        <button type="button" className="studio-form__submit" disabled={disabled || !text.trim()} onClick={onShow}>
          {showLabel}
        </button>
        <button type="button" className="creator-workspace__media-btn" disabled={disabled} onClick={onManual}>
          {manualLabel}
        </button>
        <button type="button" className="creator-workspace__media-btn creator-workspace__media-btn--ghost" onClick={onBack}>
          {backLabel}
        </button>
      </div>
    </div>
  );
}
