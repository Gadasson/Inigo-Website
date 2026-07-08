'use client';

import type { GuidedSessionDurationMediaSource } from '@/lib/studio/guidedSessionDuration';
import {
  formatDurationClock,
  formatMmSsInput,
  mmSsPartsToTotalSeconds,
  padMmSsPart,
} from '@/lib/studio/formatDuration';
import { useTranslations } from 'next-intl';
import StudioFieldLabel from '@/components/studio/StudioFieldLabel';

type Props = {
  durationMm: string;
  durationSs: string;
  isFromMedia: boolean;
  mediaSource: GuidedSessionDurationMediaSource | null;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export default function GuidedSessionDurationField({
  durationMm,
  durationSs,
  isFromMedia,
  mediaSource,
  disabled = false,
  onChange,
  onBlur,
}: Props) {
  const t = useTranslations('duration');

  if (isFromMedia && mediaSource) {
    const totalSeconds = mmSsPartsToTotalSeconds(durationMm, durationSs);
    const display = totalSeconds > 0 ? formatDurationClock(totalSeconds) : '—';

    return (
      <div className="studio-form__field studio-form__field--duration">
        <StudioFieldLabel htmlFor="duration-display">{t('label')}</StudioFieldLabel>
        <p id="duration-display" className="studio-form__duration-readonly">
          {display}
        </p>
        <p className="studio-form__duration-detected" role="status">
          {mediaSource === 'audio' ? t('detectedAudio') : t('detectedVideo')}
        </p>
      </div>
    );
  }

  return (
    <div className="studio-form__field studio-form__field--duration">
      <StudioFieldLabel htmlFor="durationMm">{t('estimated')}</StudioFieldLabel>
      <div className="studio-form__duration-input" role="group" aria-labelledby="durationMm">
        <input
          id="durationMm"
          name="durationMm"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="studio-form__duration-part"
          value={durationMm}
          onChange={(e) => {
            e.target.value = formatMmSsInput(e.target.value, 180);
            onChange(e);
          }}
          onBlur={(e) => {
            e.target.value = padMmSsPart(e.target.value, 180);
            onBlur?.(e);
            onChange(e);
          }}
          disabled={disabled}
          aria-label={t('minutesAria')}
        />
        <span className="studio-form__duration-sep" aria-hidden>
          :
        </span>
        <input
          id="durationSs"
          name="durationSs"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className="studio-form__duration-part"
          value={durationSs}
          onChange={(e) => {
            e.target.value = formatMmSsInput(e.target.value, 59);
            onChange(e);
          }}
          onBlur={(e) => {
            e.target.value = padMmSsPart(e.target.value, 59);
            onBlur?.(e);
            onChange(e);
          }}
          disabled={disabled}
          aria-label={t('secondsAria')}
        />
      </div>
      <p className="studio-form__duration-helper">{t('helper')}</p>
    </div>
  );
}
