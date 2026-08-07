/** Canonical Guided Session time_suitability values (Django GuidedSessionTemplate). */

export const TIME_SUITABILITY_VALUES = [
  'anytime',
  'morning',
  'midday',
  'evening',
  'late_night',
] as const;

export type TimeSuitabilityValue = (typeof TIME_SUITABILITY_VALUES)[number];

/** Deterministic stored / UI order: anytime first, then windows. */
export const TIME_SUITABILITY_ORDER: readonly TimeSuitabilityValue[] = TIME_SUITABILITY_VALUES;

const TIME_SUITABILITY_SET = new Set<string>(TIME_SUITABILITY_VALUES);

export function isTimeSuitabilityValue(value: string): value is TimeSuitabilityValue {
  return TIME_SUITABILITY_SET.has(value);
}

export function defaultTimeSuitability(): TimeSuitabilityValue[] {
  return ['anytime'];
}

/**
 * Client-side normalization for stable UI state.
 * Server remains authoritative for persistence validation.
 *
 * - missing / null / non-array / empty → ['anytime']
 * - keep only canonical strings; drop malformed
 * - remove duplicates
 * - anytime + specifics → ['anytime']
 * - otherwise canonical order of specific windows
 */
export function normalizeTimeSuitability(raw: unknown): TimeSuitabilityValue[] {
  if (raw == null) {
    return defaultTimeSuitability();
  }
  if (!Array.isArray(raw)) {
    return defaultTimeSuitability();
  }
  if (raw.length === 0) {
    return defaultTimeSuitability();
  }

  const seen = new Set<TimeSuitabilityValue>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (isTimeSuitabilityValue(value)) {
      seen.add(value);
    }
  }

  if (seen.size === 0) {
    return defaultTimeSuitability();
  }
  if (seen.has('anytime')) {
    return ['anytime'];
  }
  return TIME_SUITABILITY_ORDER.filter(
    (value) => value !== 'anytime' && seen.has(value),
  );
}

export function timeSuitabilityEqual(
  a: readonly string[] | null | undefined,
  b: readonly string[] | null | undefined,
): boolean {
  const left = normalizeTimeSuitability(a);
  const right = normalizeTimeSuitability(b);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

/**
 * Toggle one option with product selection rules:
 * - Anytime clears specifics
 * - Specific clears Anytime
 * - Deselecting the last specific restores Anytime
 * - Never returns []
 */
export function toggleTimeSuitabilityValue(
  current: readonly string[] | null | undefined,
  value: TimeSuitabilityValue,
): TimeSuitabilityValue[] {
  const normalized = normalizeTimeSuitability(current);

  if (value === 'anytime') {
    return ['anytime'];
  }

  const specifics = normalized.filter((item) => item !== 'anytime');
  const isSelected = specifics.includes(value);
  const next = isSelected
    ? specifics.filter((item) => item !== value)
    : [...specifics, value];

  return normalizeTimeSuitability(next);
}
