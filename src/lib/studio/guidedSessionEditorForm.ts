import type {
  StudioGuidedSession,
  UpdateGuidedSessionDraftPayload,
} from '@/lib/api/studioGuidedSessions';
import { durationToMinutes, minutesToDurationString } from '@/lib/studio/formatDuration';
import { GUIDED_SESSION_CREATE_DEFAULTS } from '@/lib/studio/guidedSessionOptions';

export type GuidedSessionEditorForm = {
  title: string;
  description: string;
  durationMinutes: string;
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

export function sessionToEditorForm(session: StudioGuidedSession): GuidedSessionEditorForm {
  const minutes =
    session.duration_minutes ?? durationToMinutes(session.duration);

  return {
    title: session.title ?? '',
    description: session.description ?? '',
    durationMinutes: String(minutes),
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
  if (form.durationMinutes !== baseline.durationMinutes) {
    const minutes = Number(form.durationMinutes);
    if (Number.isFinite(minutes) && minutes >= 1 && minutes <= 180) {
      patch.duration = minutesToDurationString(minutes);
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
