export type TaxonomyOption = {
  code: string;
  label: string;
};

export type PracticeTaxonomyOption = TaxonomyOption & {
  subCategories: TaxonomyOption[];
};

export type GuidedSessionTaxonomy = {
  practices: PracticeTaxonomyOption[];
  /** Fallback when API returns a flat focus list instead of per-practice sub_categories. */
  globalFocuses: TaxonomyOption[];
};

/** Focus codes that map directly to the legacy `category` field. */
export const LEGACY_CATEGORY_FROM_FOCUS_CODES = new Set([
  'mindful-living',
  'nature-connection',
  'inner-journey',
  'stress-relief',
  'focus-concentration',
  'love',
]);

export function resolveHiddenLegacyCategory(focusCode: string): string {
  const normalized = focusCode.trim();
  if (!normalized) {
    return 'stress-relief';
  }
  return LEGACY_CATEGORY_FROM_FOCUS_CODES.has(normalized) ? normalized : 'stress-relief';
}

export function buildGuidedSessionTaxonomyPayload(practice: string, focus: string): {
  primary_category: string;
  sub_category_codes: string[];
  category: string;
} {
  const focusCode = focus.trim();
  return {
    primary_category: practice.trim(),
    sub_category_codes: focusCode ? [focusCode] : [],
    category: resolveHiddenLegacyCategory(focusCode),
  };
}

function normalizeTaxonomyOption(item: unknown): TaxonomyOption | null {
  if (typeof item === 'string' && item.trim()) {
    const code = item.trim();
    return { code, label: code };
  }

  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const rawCode =
    record.code ?? record.value ?? record.id ?? record.slug ?? record.primary_category;
  const rawLabel = record.label ?? record.name ?? record.title ?? rawCode;

  if (typeof rawCode !== 'string' || !rawCode.trim()) {
    return null;
  }

  const code = rawCode.trim();
  const label =
    typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim() : code;

  return { code, label };
}

function normalizeTaxonomyOptions(data: unknown): TaxonomyOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizeTaxonomyOption)
    .filter((option): option is TaxonomyOption => option !== null);
}

function pickTaxonomyList(
  record: Record<string, unknown>,
  keys: string[],
): TaxonomyOption[] {
  for (const key of keys) {
    const options = normalizeTaxonomyOptions(record[key]);
    if (options.length > 0) {
      return options;
    }
  }
  return [];
}

function normalizePracticeOption(item: unknown): PracticeTaxonomyOption | null {
  const base = normalizeTaxonomyOption(item);
  if (!base) {
    return null;
  }

  if (!item || typeof item !== 'object') {
    return { ...base, subCategories: [] };
  }

  const record = item as Record<string, unknown>;
  const subCategories = pickTaxonomyList(record, [
    'sub_categories',
    'sub_category_options',
    'sub_category_codes',
    'focuses',
    'focus_options',
  ]);

  return {
    ...base,
    subCategories,
  };
}

function normalizePracticeOptions(data: unknown): PracticeTaxonomyOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(normalizePracticeOption)
    .filter((option): option is PracticeTaxonomyOption => option !== null);
}

/** Normalizes backend taxonomy payloads without hardcoding option values. */
export function normalizeGuidedSessionTaxonomy(data: unknown): GuidedSessionTaxonomy {
  if (!data || typeof data !== 'object') {
    return { practices: [], globalFocuses: [] };
  }

  const record = data as Record<string, unknown>;

  const practices = normalizePracticeOptions(
    record.practices ??
      record.primary_categories ??
      record.practice_types ??
      record.primary_category_options,
  );

  const globalFocuses = pickTaxonomyList(record, [
    'focuses',
    'focus_options',
    'sub_categories',
    'sub_category_options',
    'sub_category_codes',
  ]);

  return { practices, globalFocuses };
}

/** Focus options for the selected practice (matched by code, e.g. "meditation"). */
export function getFocusOptionsForPractice(
  taxonomy: GuidedSessionTaxonomy | null,
  practiceCode: string,
): TaxonomyOption[] {
  const normalizedCode = practiceCode.trim();
  if (!taxonomy || !normalizedCode) {
    return [];
  }

  const practice = taxonomy.practices.find((item) => item.code === normalizedCode);
  if (practice && practice.subCategories.length > 0) {
    return practice.subCategories;
  }

  return taxonomy.globalFocuses;
}

export function applyPracticeSelectionToForm<
  T extends { practice: string; focus: string },
>(form: T, practiceCode: string, taxonomy: GuidedSessionTaxonomy | null): T {
  const focusOptions = getFocusOptionsForPractice(taxonomy, practiceCode);
  const focusStillValid = focusOptions.some((option) => option.code === form.focus);

  return {
    ...form,
    practice: practiceCode,
    focus: focusStillValid ? form.focus : (focusOptions[0]?.code ?? ''),
  };
}

export function taxonomyOptionLabel(
  options: TaxonomyOption[],
  code: string,
): string {
  if (!code) return '—';
  return options.find((option) => option.code === code)?.label ?? code;
}
