import { studioSessionPhase, type StudioSessionPhase } from '@/lib/studio/guidedSessionPhase';

/**
 * Immediate live edits. Must match the server STUDIO_LIVE_METADATA_FIELDS
 * set exactly. A live PATCH that includes any other key is rejected entirely.
 */
export const LIVE_SAFE_EDIT_FIELDS = [
  'title',
  'instructor',
  'environment',
  'background_music',
  'background_music_creator',
  'tags',
  'difficulty',
  'category',
  'sound_gender',
  'time_suitability',
  'sub_category_codes',
] as const;

export type LiveSafeEditField = (typeof LIVE_SAFE_EDIT_FIELDS)[number];

/** Keys that must never appear in a live PATCH body. */
export const LIVE_PATCH_FORBIDDEN_FIELDS = [
  'description',
  'duration',
  'language',
  'primary_category',
  'access_tier',
  'session_id',
] as const;

export type StudioEditorCapabilities = {
  canEditDraft: boolean;
  canEditLiveMetadata: boolean;
  canReplaceLiveMedia: boolean;
  canReplaceLiveCover: boolean;
};

export function studioEditorCapabilities(session: {
  status?: string | null;
  is_available?: boolean | null;
} | null | undefined): StudioEditorCapabilities {
  const phase: StudioSessionPhase = studioSessionPhase(session);
  const draft = phase === 'draft';
  const live = phase === 'live';
  return {
    canEditDraft: draft,
    canEditLiveMetadata: live,
    canReplaceLiveMedia: live,
    canReplaceLiveCover: live,
  };
}

export type GuidedSessionFormFieldId =
  | 'title'
  | 'description'
  | 'duration'
  | 'language'
  | 'soundGender'
  | 'difficulty'
  | 'practice'
  | 'focus'
  | 'instructor'
  | 'environment'
  | 'backgroundMusic'
  | 'backgroundMusicCreator'
  | 'tags'
  | 'timeSuitability';

const LIVE_LOCKED_FORM_FIELDS = new Set<GuidedSessionFormFieldId>([
  'description',
  'duration',
  'language',
  'practice',
]);

export function isGuidedSessionFieldDisabled(
  field: GuidedSessionFormFieldId,
  capabilities: StudioEditorCapabilities,
): boolean {
  if (capabilities.canEditDraft) return false;
  if (!capabilities.canEditLiveMetadata) return true;
  return LIVE_LOCKED_FORM_FIELDS.has(field);
}
