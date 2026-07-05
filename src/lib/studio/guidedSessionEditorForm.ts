import type {
  StudioGuidedSession,
  UpdateGuidedSessionDraftPayload,
} from '@/lib/api/studioGuidedSessions';
import {
  isValidEstimatedDurationMmSs,
  mmSsToDurationString,
  parseApiDurationToMmSsParts,
} from '@/lib/studio/formatDuration';
import { GUIDED_SESSION_CREATE_DEFAULTS } from '@/lib/studio/guidedSessionOptions';

export type GuidedSessionEditorForm = {
  title: string;
  description: string;
  durationMm: string;
  durationSs: string;
  language: string;
  soundGender: string;
  difficulty: string;
  category: string;
  primaryCategory: string;
  instructor: string;
  environment: string;
  backgroundMusic: string;
  backgroundMusicCreator: string;
  accessTier: string;
  tagsText: string;
};

export function parseTagsText(text: string): string[] {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToText(tags: string[] | undefined): string {
  return (tags ?? []).join(', ');
}

export function createDefaultGuidedSessionForm(
  instructor = 'Creator',
): GuidedSessionEditorForm {
  return {
    title: '',
    description: '',
    durationMm: '10',
    durationSs: '00',
    language: 'en',
    soundGender: 'neutral',
    difficulty: 'beginner',
    category: 'stress-relief',
    primaryCategory: 'meditation',
    instructor,
    environment: GUIDED_SESSION_CREATE_DEFAULTS.environment,
    backgroundMusic: GUIDED_SESSION_CREATE_DEFAULTS.background_music,
    backgroundMusicCreator: '',
    accessTier: GUIDED_SESSION_CREATE_DEFAULTS.access_tier,
    tagsText: '',
  };
}

export function sessionToEditorForm(session: StudioGuidedSession): GuidedSessionEditorForm {
  const durationParts = parseApiDurationToMmSsParts(session.duration);

  return {
    title: session.title ?? '',
    description: session.description ?? '',
    durationMm: durationParts.mm,
    durationSs: durationParts.ss,
    language: session.language ?? 'en',
    soundGender: session.sound_gender ?? 'neutral',
    difficulty: session.difficulty ?? 'beginner',
    category: session.category ?? 'stress-relief',
    primaryCategory: session.primary_category ?? 'meditation',
    instructor: session.instructor ?? '',
    environment: session.environment ?? GUIDED_SESSION_CREATE_DEFAULTS.environment,
    backgroundMusic: session.background_music ?? GUIDED_SESSION_CREATE_DEFAULTS.background_music,
    backgroundMusicCreator: session.background_music_creator ?? '',
    accessTier: session.access_tier ?? GUIDED_SESSION_CREATE_DEFAULTS.access_tier,
    tagsText: tagsToText(session.tags),
  };
}

function durationChanged(
  form: GuidedSessionEditorForm,
  baseline: GuidedSessionEditorForm,
): boolean {
  return form.durationMm !== baseline.durationMm || form.durationSs !== baseline.durationSs;
}

export function buildGuidedSessionPatch(
  form: GuidedSessionEditorForm,
  baseline: GuidedSessionEditorForm,
): UpdateGuidedSessionDraftPayload {
  const patch: UpdateGuidedSessionDraftPayload = {};

  if (form.title.trim() !== baseline.title.trim()) {
    patch.title = form.title.trim();
  }
  if (form.description.trim() !== baseline.description.trim()) {
    patch.description = form.description.trim();
  }
  if (durationChanged(form, baseline)) {
    const minutes = Number(form.durationMm);
    const seconds = Number(form.durationSs);
    if (isValidEstimatedDurationMmSs(form.durationMm, form.durationSs)) {
      patch.duration = mmSsToDurationString(minutes, seconds);
    }
  }
  if (form.language !== baseline.language) patch.language = form.language;
  if (form.soundGender !== baseline.soundGender) patch.sound_gender = form.soundGender;
  if (form.difficulty !== baseline.difficulty) patch.difficulty = form.difficulty;
  if (form.category !== baseline.category) patch.category = form.category;
  if (form.primaryCategory !== baseline.primaryCategory) {
    patch.primary_category = form.primaryCategory;
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
  if (form.accessTier !== baseline.accessTier) patch.access_tier = form.accessTier;

  const nextTags = parseTagsText(form.tagsText);
  const baseTags = parseTagsText(baseline.tagsText);
  if (JSON.stringify(nextTags) !== JSON.stringify(baseTags)) {
    patch.tags = nextTags;
  }

  return patch;
}
