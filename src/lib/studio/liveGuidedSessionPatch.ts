import type { TimeSuitabilityValue } from '@/lib/studio/timeSuitability';
import {
  parseTagsText,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import { buildGuidedSessionTaxonomyPayload } from '@/lib/studio/guidedSessionTaxonomy';
import {
  normalizeTimeSuitability,
  timeSuitabilityEqual,
} from '@/lib/studio/timeSuitability';
import {
  LIVE_PATCH_FORBIDDEN_FIELDS,
  LIVE_SAFE_EDIT_FIELDS,
  type LiveSafeEditField,
} from '@/lib/studio/guidedSessionCapabilities';

/** Partial live PATCH. Forbidden keys are not part of this type. */
export type LiveGuidedSessionPatch = Partial<{
  title: string;
  instructor: string;
  environment: string;
  background_music: string;
  background_music_creator: string;
  tags: string[];
  difficulty: string;
  category: string;
  sound_gender: string;
  time_suitability: TimeSuitabilityValue[];
  sub_category_codes: string[];
}>;

function tagsEqual(left: string, right: string): boolean {
  return JSON.stringify(parseTagsText(left)) === JSON.stringify(parseTagsText(right));
}

/**
 * Changed live-safe fields only.
 * Never copies draft read-only values such as description, duration,
 * language, primary_category, access_tier, or session_id.
 */
export function buildLiveGuidedSessionPatch(
  form: GuidedSessionEditorForm,
  baseline: GuidedSessionEditorForm,
): LiveGuidedSessionPatch {
  const patch: LiveGuidedSessionPatch = {};

  if (form.title.trim() !== baseline.title.trim()) {
    patch.title = form.title.trim();
  }
  if (form.instructor.trim() !== baseline.instructor.trim()) {
    patch.instructor = form.instructor.trim();
  }
  if (form.environment.trim() !== baseline.environment.trim()) {
    patch.environment = form.environment.trim();
  }
  if (form.backgroundMusic.trim() !== baseline.backgroundMusic.trim()) {
    patch.background_music = form.backgroundMusic.trim();
  }
  if (form.backgroundMusicCreator.trim() !== baseline.backgroundMusicCreator.trim()) {
    patch.background_music_creator = form.backgroundMusicCreator.trim();
  }
  if (form.difficulty !== baseline.difficulty) {
    patch.difficulty = form.difficulty;
  }
  if (form.soundGender !== baseline.soundGender) {
    patch.sound_gender = form.soundGender;
  }
  if (!tagsEqual(form.tagsText, baseline.tagsText)) {
    patch.tags = parseTagsText(form.tagsText);
  }

  const nextSuitability = normalizeTimeSuitability(form.timeSuitability);
  if (!timeSuitabilityEqual(nextSuitability, baseline.timeSuitability)) {
    patch.time_suitability = nextSuitability;
  }

  const nextTaxonomy = buildGuidedSessionTaxonomyPayload(form.practice, form.focus);
  const baseTaxonomy = buildGuidedSessionTaxonomyPayload(baseline.practice, baseline.focus);
  if (
    JSON.stringify(nextTaxonomy.sub_category_codes) !==
    JSON.stringify(baseTaxonomy.sub_category_codes)
  ) {
    patch.sub_category_codes = nextTaxonomy.sub_category_codes;
  }
  if (nextTaxonomy.category !== baseTaxonomy.category) {
    patch.category = nextTaxonomy.category;
  }

  return patch;
}

export function livePatchContainsForbiddenField(patch: object): boolean {
  return Object.keys(patch).some((key) =>
    (LIVE_PATCH_FORBIDDEN_FIELDS as readonly string[]).includes(key),
  );
}

export function livePatchKeysAreAllowlisted(patch: object): boolean {
  return Object.keys(patch).every((key) =>
    (LIVE_SAFE_EDIT_FIELDS as readonly string[]).includes(key as LiveSafeEditField),
  );
}

export type LiveAutosaveDecision = 'skip' | 'save' | 'blocked';

/** Empty patches are not sent. A rejected forbidden payload is not retried. */
export function liveAutosaveDecision(
  patch: object,
  blockedPayloadKey: string | null,
): LiveAutosaveDecision {
  if (Object.keys(patch).length === 0) return 'skip';
  const key = JSON.stringify(patch);
  if (blockedPayloadKey != null && blockedPayloadKey === key) return 'blocked';
  return 'save';
}

export function livePatchPayloadKey(patch: object): string {
  return JSON.stringify(patch);
}
