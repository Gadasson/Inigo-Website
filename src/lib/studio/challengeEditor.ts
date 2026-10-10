export const CHALLENGE_COVER_RETRY_STORAGE_KEY = 'inigo.studio.challengeCoverRetry';

export const CHALLENGE_STEP_MIN = 1;
export const CHALLENGE_STEP_MAX = 5;
export const CHALLENGE_SILENT_MINUTES_MIN = 1;
export const CHALLENGE_SILENT_MINUTES_MAX = 180;

export const CHALLENGE_PRACTICE_TYPES = ['meditation', 'walking', 'breathing'] as const;
export type ChallengePracticeType = (typeof CHALLENGE_PRACTICE_TYPES)[number];

export type ChallengeSchedule = 'fixed_weeks' | 'ongoing';
export type ChallengeVersionStatus = 'draft' | 'pending_review' | 'approved';

export type ChallengeStepDraft = {
  id: string;
  kind: 'silent' | 'guided';
  practiceType: ChallengePracticeType | '';
  durationMinutes: string;
  guidedTemplateId: number | null;
  guidedTitle: string;
  guidedDurationSeconds: number | null;
  guidedMediaKind: string | null;
};

export type ChallengeEditorForm = {
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  descriptionHe: string;
  daysPerWeek: number;
  schedule: ChallengeSchedule;
  weekCount: string;
  steps: ChallengeStepDraft[];
};

export type ChallengeFormIssue =
  | 'title'
  | 'days'
  | 'week_count'
  | 'steps_count'
  | 'practice_type'
  | 'duration_minutes'
  | 'guided_session';

export type ChallengeDetailsBody = {
  title_en: string;
  title_he: string;
  description_en: string;
  description_he: string;
  days_per_week: number;
  schedule: ChallengeSchedule;
  week_count: number | null;
};

export type ChallengeStepBody =
  | { kind: 'silent'; practice_type: ChallengePracticeType; duration_minutes: number }
  | { kind: 'guided'; guided_template_id: number };

/** A draft can be saved. Pending review cannot. An approved version stays read-only until save. */
export function isChallengeDraftEditable(status: string | null | undefined): boolean {
  return status === 'draft';
}

export function isChallengePendingReview(status: string | null | undefined): boolean {
  return status === 'pending_review';
}

/**
 * Saving an approved challenge uses the existing PATCH and steps PUT.
 * The server copies the published version into a new draft inside those calls.
 */
export function canReviseApprovedChallenge(status: string | null | undefined): boolean {
  return status === 'approved';
}

export function challengeRevisionSaveMethods(): readonly ['PATCH', 'PUT'] {
  return ['PATCH', 'PUT'];
}

export function emptyChallengeForm(): ChallengeEditorForm {
  return {
    titleEn: '',
    titleHe: '',
    descriptionEn: '',
    descriptionHe: '',
    daysPerWeek: 3,
    schedule: 'ongoing',
    weekCount: '',
    steps: [silentChallengeStep('step-1')],
  };
}

export function silentChallengeStep(id: string): ChallengeStepDraft {
  return {
    id,
    kind: 'silent',
    practiceType: 'breathing',
    durationMinutes: '5',
    guidedTemplateId: null,
    guidedTitle: '',
    guidedDurationSeconds: null,
    guidedMediaKind: null,
  };
}

export function guidedChallengeStep(id: string): ChallengeStepDraft {
  return {
    id,
    kind: 'guided',
    practiceType: '',
    durationMinutes: '',
    guidedTemplateId: null,
    guidedTitle: '',
    guidedDurationSeconds: null,
    guidedMediaKind: null,
  };
}

export function validateChallengeForm(form: ChallengeEditorForm): ChallengeFormIssue | null {
  if (!form.titleEn.trim() && !form.titleHe.trim()) return 'title';
  if (!Number.isInteger(form.daysPerWeek) || form.daysPerWeek < 1 || form.daysPerWeek > 7) {
    return 'days';
  }
  if (form.schedule === 'fixed_weeks') {
    const weeks = Number(form.weekCount);
    if (!Number.isInteger(weeks) || weeks < 1) return 'week_count';
  }
  if (form.steps.length < CHALLENGE_STEP_MIN || form.steps.length > CHALLENGE_STEP_MAX) {
    return 'steps_count';
  }
  for (const step of form.steps) {
    if (step.kind === 'silent') {
      if (!CHALLENGE_PRACTICE_TYPES.includes(step.practiceType as ChallengePracticeType)) {
        return 'practice_type';
      }
      const minutes = Number(step.durationMinutes);
      if (
        !Number.isInteger(minutes) ||
        minutes < CHALLENGE_SILENT_MINUTES_MIN ||
        minutes > CHALLENGE_SILENT_MINUTES_MAX
      ) {
        return 'duration_minutes';
      }
    } else if (!Number.isInteger(step.guidedTemplateId) || (step.guidedTemplateId ?? 0) < 1) {
      return 'guided_session';
    }
  }
  return null;
}

export function buildChallengeDetailsBody(form: ChallengeEditorForm): ChallengeDetailsBody {
  return {
    title_en: form.titleEn.trim(),
    title_he: form.titleHe.trim(),
    description_en: form.descriptionEn.trim(),
    description_he: form.descriptionHe.trim(),
    days_per_week: form.daysPerWeek,
    schedule: form.schedule,
    week_count: form.schedule === 'fixed_weeks' ? Number(form.weekCount) : null,
  };
}

export function buildChallengeStepsBody(form: ChallengeEditorForm): { steps: ChallengeStepBody[] } {
  return {
    steps: form.steps.map((step) =>
      step.kind === 'silent'
        ? {
            kind: 'silent',
            practice_type: step.practiceType as ChallengePracticeType,
            duration_minutes: Number(step.durationMinutes),
          }
        : {
            kind: 'guided',
            guided_template_id: step.guidedTemplateId as number,
          },
    ),
  };
}

export function challengeDetailsDirty(form: ChallengeEditorForm, baseline: ChallengeEditorForm): boolean {
  return JSON.stringify(buildChallengeDetailsBody(form)) !== JSON.stringify(buildChallengeDetailsBody(baseline));
}

export function challengeStepsDirty(form: ChallengeEditorForm, baseline: ChallengeEditorForm): boolean {
  return JSON.stringify(buildChallengeStepsBody(form)) !== JSON.stringify(buildChallengeStepsBody(baseline));
}

export function moveChallengeStep(
  steps: ChallengeStepDraft[],
  index: number,
  direction: -1 | 1,
): ChallengeStepDraft[] {
  const nextIndex = index + direction;
  if (index < 0 || index >= steps.length || nextIndex < 0 || nextIndex >= steps.length) {
    return steps;
  }
  const copy = steps.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export function removeChallengeStep(steps: ChallengeStepDraft[], index: number): ChallengeStepDraft[] {
  if (steps.length <= CHALLENGE_STEP_MIN) return steps;
  return steps.filter((_, stepIndex) => stepIndex !== index);
}

export function addChallengeStep(
  steps: ChallengeStepDraft[],
  step: ChallengeStepDraft,
): ChallengeStepDraft[] {
  if (steps.length >= CHALLENGE_STEP_MAX) return steps;
  return [...steps, step];
}

export type ChallengeSaveOutcome = {
  complete: boolean;
  canSubmit: boolean;
  failedPart: 'details' | 'steps' | null;
};

/**
 * A partial save keeps the local editor. Submit stays closed until every
 * dirty part has been stored.
 */
export function challengeSaveOutcome(input: {
  detailsDirty: boolean;
  stepsDirty: boolean;
  detailsFailed: boolean;
  stepsFailed: boolean;
  detailsAttempted?: boolean;
}): ChallengeSaveOutcome {
  const detailsAttempted = input.detailsAttempted ?? input.detailsDirty;
  if (detailsAttempted && input.detailsFailed) {
    return { complete: false, canSubmit: false, failedPart: 'details' };
  }
  if (input.stepsDirty && input.stepsFailed) {
    return { complete: false, canSubmit: false, failedPart: 'steps' };
  }
  return { complete: true, canSubmit: true, failedPart: null };
}

export function challengeSavePlan(input: {
  mode: 'create' | 'edit';
  revisingApproved: boolean;
  detailsDirty: boolean;
  stepsDirty: boolean;
}): { sendDetails: boolean; sendSteps: boolean } {
  if (input.mode === 'create') {
    return { sendDetails: true, sendSteps: true };
  }
  return {
    sendDetails: input.detailsDirty || input.revisingApproved,
    sendSteps: input.stepsDirty,
  };
}

export function shouldSaveChallengeSteps(input: {
  detailsAttempted: boolean;
  detailsFailed: boolean;
  stepsDirty: boolean;
}): boolean {
  if (!input.stepsDirty) return false;
  if (input.detailsAttempted && input.detailsFailed) return false;
  return true;
}

export type SessionOptionOwner = '' | 'self' | 'platform' | 'other_guide';

export function buildSessionOptionsPath(input: { q?: string; ownerKind?: SessionOptionOwner }): string {
  const params = new URLSearchParams();
  const query = input.q?.trim() ?? '';
  if (query) params.set('q', query);
  if (input.ownerKind) params.set('owner_kind', input.ownerKind);
  const search = params.toString();
  return `/api/studio/challenges/session-options/${search ? `?${search}` : ''}`;
}

export type ChallengePracticeSummary =
  | { kind: 'silent'; practiceType: ChallengePracticeType | ''; minutes: number | null }
  | { kind: 'guided'; title: string; seconds: number | null };

export type ChallengeFormSummary = {
  practices: ChallengePracticeSummary[];
  daysPerWeek: number;
  schedule: ChallengeSchedule;
  weekCount: number | null;
};

function wholePracticeMinutes(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 1) return null;
  return minutes;
}

/** Display facts already present on the form. Missing durations stay empty. */
export function challengeFormSummary(form: ChallengeEditorForm): ChallengeFormSummary {
  const weekCount =
    form.schedule === 'fixed_weeks' && /^\d+$/.test(form.weekCount) && Number(form.weekCount) >= 1
      ? Number(form.weekCount)
      : null;
  return {
    daysPerWeek: form.daysPerWeek,
    schedule: form.schedule,
    weekCount,
    practices: form.steps.map((step) => {
      if (step.kind === 'guided') {
        const seconds = step.guidedDurationSeconds;
        return {
          kind: 'guided' as const,
          title: step.guidedTitle.trim(),
          seconds:
            typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null,
        };
      }
      return {
        kind: 'silent' as const,
        practiceType: step.practiceType,
        minutes: wholePracticeMinutes(step.durationMinutes),
      };
    }),
  };
}

export function challengeListTitle(
  row: { title_en?: string | null; title_he?: string | null },
  locale: 'en' | 'he',
): string {
  const en = row.title_en?.trim() ?? '';
  const he = row.title_he?.trim() ?? '';
  if (locale === 'he') return he || en;
  return en || he;
}

export type ChallengeServerStep = {
  kind: 'silent' | 'guided';
  practice_type: string | null;
  duration_minutes: number | null;
  guided_template_id: number | null;
  title: string | null;
  duration_seconds: number | null;
};

export type ChallengeCoverPhase = 'none' | 'pending' | 'uploading' | 'uploaded' | 'failed';

export type ChallengeCoverVersion = {
  status: ChallengeVersionStatus;
  versionId: number;
  versionNumber: number;
  coverUrl: string | null;
  coverStoragePath: string | null;
};

export function challengeCoverFormData(file: Blob): FormData {
  const body = new FormData();
  body.append('image', file);
  return body;
}

export function challengeCoverPhase(input: {
  hasLocalFile: boolean;
  uploading: boolean;
  failed: boolean;
  hasCoverUrl: boolean;
}): ChallengeCoverPhase {
  if (input.uploading) return 'uploading';
  if (input.failed) return 'failed';
  if (input.hasLocalFile) return 'pending';
  if (input.hasCoverUrl) return 'uploaded';
  return 'none';
}

/**
 * A cover is optional. Submit stays closed while a chosen file is still
 * unsent, while the upload is running, or while a failed upload is unresolved.
 */
export function canSubmitChallenge(input: {
  status: string | null | undefined;
  dirty: boolean;
  coverPending: boolean;
  coverUploading: boolean;
  coverFailed: boolean;
}): boolean {
  return (
    isChallengeDraftEditable(input.status) &&
    !input.dirty &&
    !input.coverPending &&
    !input.coverUploading &&
    !input.coverFailed
  );
}

/** After a failed upload, the draft id stays and another challenge is not created. */
export function challengeCoverFailureKeepsDraft(createdId: number): { challengeId: number; createAnother: false } {
  return { challengeId: createdId, createAnother: false };
}

/**
 * Adopt the draft the cover response opened.
 * Local titles, descriptions, schedule, and steps stay untouched.
 */
export function applyChallengeCoverResponse<T>(
  localForm: T,
  draft: {
    id: number;
    version_number: number;
    status: ChallengeVersionStatus;
    cover_url?: string | null;
    cover_storage_path?: string | null;
  },
): { form: T; version: ChallengeCoverVersion } {
  return {
    form: localForm,
    version: {
      status: draft.status,
      versionId: draft.id,
      versionNumber: draft.version_number,
      coverUrl: draft.cover_url?.trim() ? draft.cover_url : null,
      coverStoragePath: draft.cover_storage_path?.trim() ? draft.cover_storage_path : null,
    },
  };
}

export function patchChallengeDraftVersion<T extends {
  id: number;
  version_number: number;
  status: ChallengeVersionStatus;
  cover_url?: string | null;
  cover_storage_path?: string | null;
}>(
  current: T,
  incoming: {
    id: number;
    version_number: number;
    status: ChallengeVersionStatus;
    cover_url?: string | null;
    cover_storage_path?: string | null;
  },
): T {
  return {
    ...current,
    id: incoming.id,
    version_number: incoming.version_number,
    status: incoming.status,
    cover_url: incoming.cover_url ?? null,
    cover_storage_path: incoming.cover_storage_path ?? null,
  };
}

export function challengeCoverErrorKey(input: {
  reasonCode: string | null;
  field: string | null;
}): 'versionNotEditable' | 'permission' | 'coverUpload' | 'image' | 'generic' {
  if (input.reasonCode === 'version_not_editable') return 'versionNotEditable';
  if (input.reasonCode === 'permission_denied' || input.reasonCode === 'not_owner') return 'permission';
  if (input.reasonCode === 'cover_upload_failed') return 'coverUpload';
  if (input.field === 'image' || input.reasonCode === 'validation_failed') return 'image';
  return 'generic';
}

type CoverRetryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function markChallengeCoverRetry(challengeId: number, storage?: CoverRetryStorage): void {
  const target = storage ?? (typeof sessionStorage === 'undefined' ? null : sessionStorage);
  if (!target) return;
  target.setItem(CHALLENGE_COVER_RETRY_STORAGE_KEY, String(challengeId));
}

export function takeChallengeCoverRetry(challengeId: number, storage?: CoverRetryStorage): boolean {
  const target = storage ?? (typeof sessionStorage === 'undefined' ? null : sessionStorage);
  if (!target) return false;
  const stored = target.getItem(CHALLENGE_COVER_RETRY_STORAGE_KEY);
  if (stored !== String(challengeId)) return false;
  target.removeItem(CHALLENGE_COVER_RETRY_STORAGE_KEY);
  return true;
}

export function challengeFormFromServer(input: {
  draft: {
    title_en: string;
    title_he: string;
    description_en: string;
    description_he: string;
    days_per_week: number;
    schedule: ChallengeSchedule;
    week_count: number | null;
  };
  steps: ChallengeServerStep[];
}): ChallengeEditorForm {
  return {
    titleEn: input.draft.title_en,
    titleHe: input.draft.title_he,
    descriptionEn: input.draft.description_en,
    descriptionHe: input.draft.description_he,
    daysPerWeek: input.draft.days_per_week,
    schedule: input.draft.schedule,
    weekCount: input.draft.week_count == null ? '' : String(input.draft.week_count),
    steps: input.steps.map((step, index) =>
      step.kind === 'guided'
        ? {
            ...guidedChallengeStep(`step-${index + 1}`),
            guidedTemplateId: step.guided_template_id,
            guidedTitle: step.title ?? '',
            guidedDurationSeconds: step.duration_seconds,
          }
        : {
            ...silentChallengeStep(`step-${index + 1}`),
            practiceType: (CHALLENGE_PRACTICE_TYPES as readonly string[]).includes(step.practice_type ?? '')
              ? (step.practice_type as ChallengePracticeType)
              : '',
            durationMinutes: step.duration_minutes == null ? '' : String(step.duration_minutes),
          },
    ),
  };
}
