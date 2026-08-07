'use client';

import { useTranslations } from 'next-intl';
import {
  TIME_SUITABILITY_ORDER,
  toggleTimeSuitabilityValue,
  type TimeSuitabilityValue,
} from '@/lib/studio/timeSuitability';

const OPTION_LABEL_KEYS: Record<TimeSuitabilityValue, string> = {
  anytime: 'timeSuitabilityAnytime',
  morning: 'timeSuitabilityMorning',
  midday: 'timeSuitabilityMidday',
  evening: 'timeSuitabilityEvening',
  late_night: 'timeSuitabilityLateNight',
};

type Props = {
  value: readonly TimeSuitabilityValue[];
  disabled?: boolean;
  error?: string | null;
  onChange: (next: TimeSuitabilityValue[]) => void;
};

export default function GuidedSessionTimeSuitabilityField({
  value,
  disabled = false,
  error = null,
  onChange,
}: Props) {
  const tf = useTranslations('fields');
  const to = useTranslations('options');
  const selected = new Set(value);
  const labelId = 'time-suitability-label';
  const helperId = 'time-suitability-helper';
  const errorId = 'time-suitability-error';

  return (
    <div className="studio-form__field studio-form__field--time-suitability">
      <div className="studio-form__label-row">
        <span id={labelId} className="studio-form__legend">
          {tf('timeSuitability')}
        </span>
      </div>
      <p id={helperId} className="studio-form__field-lede">
        {tf('timeSuitabilityHelper')}
      </p>

      <div
        id="time-suitability"
        className="studio-time-suitability"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? `${helperId} ${errorId}` : helperId}
      >
        {TIME_SUITABILITY_ORDER.map((option) => {
          const isSelected = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              className={`studio-time-suitability__chip${
                isSelected ? ' studio-time-suitability__chip--selected' : ''
              }`}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onChange(toggleTimeSuitabilityValue(value, option))}
            >
              {to(OPTION_LABEL_KEYS[option])}
            </button>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
