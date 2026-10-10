'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { CHALLENGES_CAPABILITY } from '@/lib/api/studioBootstrap';
import { studioAreaManageHref } from '@/lib/studio/studioAreas';
import StudioConfirmDialog from '@/components/studio/StudioConfirmDialog';
import StudioFieldHint from '@/components/studio/StudioFieldHint';
import ChallengeSessionPicker from '@/components/studio/challenges/ChallengeSessionPicker';
import {
  archiveStudioChallenge,
  createStudioChallenge,
  getStudioChallenge,
  parseChallengeApiFailure,
  patchStudioChallenge,
  replaceStudioChallengeSteps,
  submitStudioChallenge,
  uploadStudioChallengeCover,
  type ChallengeSessionOption,
  type StudioChallengeDetail,
} from '@/lib/api/studioChallenges';
import {
  addChallengeStep,
  applyChallengeCoverResponse,
  buildChallengeDetailsBody,
  buildChallengeStepsBody,
  canReviseApprovedChallenge,
  canSubmitChallenge,
  challengeCoverErrorKey,
  challengeCoverPhase,
  challengeDetailsDirty,
  challengeFormFromServer,
  challengeFormSummary,
  challengeSaveOutcome,
  challengeSavePlan,
  challengeStepsDirty,
  emptyChallengeForm,
  guidedChallengeStep,
  isChallengeDraftEditable,
  isChallengePendingReview,
  markChallengeCoverRetry,
  moveChallengeStep,
  patchChallengeDraftVersion,
  removeChallengeStep,
  shouldSaveChallengeSteps,
  silentChallengeStep,
  takeChallengeCoverRetry,
  validateChallengeForm,
  CHALLENGE_PRACTICE_TYPES,
  type ChallengeEditorForm,
  type ChallengeFormIssue,
  type ChallengePracticeSummary,
  type ChallengeStepDraft,
} from '@/lib/studio/challengeEditor';
import { formatDurationClock } from '@/lib/studio/formatDuration';
import { validateRecipeCoverMeta } from '@/lib/studio/recipeEditor';

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; challengeId: number };

function nextStepId(): string {
  return `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

function ChallengePracticeSummaryView({ form }: { form: ChallengeEditorForm }) {
  const t = useTranslations('challenges');
  const summary = challengeFormSummary(form);

  function minutePhrase(minutes: number): string {
    if (minutes === 1) return t('summaryMinuteOne');
    return t('summaryMinutes', { minutes });
  }

  function practiceLabel(practice: ChallengePracticeSummary): string {
    if (practice.kind === 'silent') {
      const name = practice.practiceType ? t(`practice.${practice.practiceType}`) : t('kindSilent');
      return practice.minutes == null ? name : `${name} ${minutePhrase(practice.minutes)}`;
    }
    const name = practice.title || t('kindGuided');
    if (practice.seconds == null) return name;
    if (practice.seconds % 60 === 0) return `${name} ${minutePhrase(practice.seconds / 60)}`;
    return `${name} ${formatDurationClock(practice.seconds)}`;
  }

  function daysPhrase(days: number): string {
    if (days === 1) return t('summaryDayOne');
    if (days === 2) return t('summaryDayTwo');
    return t('summaryDays', { count: days });
  }

  function weekPhrase(weeks: number): string {
    if (weeks === 1) return t('summaryWeekOne');
    if (weeks === 2) return t('summaryWeekTwo');
    return t('summaryWeeks', { count: weeks });
  }

  const days = daysPhrase(summary.daysPerWeek);
  const goal =
    summary.schedule === 'ongoing'
      ? t('summaryGoalOngoing', { days })
      : summary.weekCount == null
        ? t('summaryGoalDays', { days })
        : t('summaryGoalFixed', { days, period: weekPhrase(summary.weekCount) });

  const task = summary.practices.map((practice) => practiceLabel(practice)).join(t('summaryThen'));

  return (
    <div className="studio-challenge-summary" aria-live="polite">
      <p>{`${t('summaryDaily')} ${task}.`}</p>
      <p>{goal}</p>
    </div>
  );
}

export default function ChallengeEditor(props: Props) {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const t = useTranslations('challenges');
  const [form, setForm] = useState<ChallengeEditorForm>(emptyChallengeForm);
  const [baseline, setBaseline] = useState<ChallengeEditorForm>(emptyChallengeForm);
  const [detail, setDetail] = useState<StudioChallengeDetail | null>(null);
  const [revising, setRevising] = useState(false);
  const [loading, setLoading] = useState(props.mode === 'edit');
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<ChallengeFormIssue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [pickerStepId, setPickerStepId] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUploadFailed, setCoverUploadFailed] = useState(false);
  const [coverRetryNotice, setCoverRetryNotice] = useState(false);
  const busyRef = useRef(false);
  const createdIdRef = useRef<number | null>(null);
  const coverPreviewUrl = useRef<string | null>(null);

  const status = detail?.draft?.status ?? (props.mode === 'create' ? 'draft' : null);
  const editable =
    props.mode === 'create' || isChallengeDraftEditable(status) || (revising && canReviseApprovedChallenge(status));
  const detailsDirty = challengeDetailsDirty(form, baseline);
  const stepsDirty = challengeStepsDirty(form, baseline);
  const dirty = detailsDirty || stepsDirty;
  const coverPending = coverFile != null;
  const submitAllowed = canSubmitChallenge({
    status,
    dirty,
    coverPending,
    coverUploading,
    coverFailed: coverUploadFailed,
  });

  const challengeId = props.mode === 'edit' ? props.challengeId : null;

  useEffect(() => {
    return () => {
      if (coverPreviewUrl.current) URL.revokeObjectURL(coverPreviewUrl.current);
    };
  }, []);

  useEffect(() => {
    if (challengeId == null) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getIdToken();
        const loaded = await getStudioChallenge(challengeId, token);
        if (cancelled || !loaded.draft) return;
        const next = challengeFormFromServer({ draft: loaded.draft, steps: loaded.steps });
        setDetail(loaded);
        setForm(next);
        setBaseline(next);
        setCoverUrl(loaded.draft.cover_url?.trim() ? loaded.draft.cover_url : null);
        setRevising(false);
        if (takeChallengeCoverRetry(challengeId)) {
          setCoverUploadFailed(true);
          setCoverRetryNotice(true);
        }
      } catch (err) {
        if (!cancelled) setError(parseChallengeApiFailure(err).detail);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [challengeId, getIdToken]);

  const statusLabel = useMemo(() => {
    if (detail?.archived_at) return t('status.archived');
    if (status === 'pending_review') return t('status.pending_review');
    if (status === 'approved' && !revising) return t('status.approved');
    if (revising) return t('status.draft');
    return t('status.draft');
  }, [detail?.archived_at, revising, status, t]);

  function updateStep(id: string, patch: Partial<ChallengeStepDraft>) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    }));
    setSavedNote(null);
  }

  function clearSelectedCover() {
    setCoverFile(null);
    setCoverUploadFailed(false);
    setCoverRetryNotice(false);
    if (coverPreviewUrl.current) {
      URL.revokeObjectURL(coverPreviewUrl.current);
      coverPreviewUrl.current = null;
    }
    setCoverPreview(null);
  }

  function adoptCover(uploaded: StudioChallengeDetail) {
    if (!uploaded.draft) return;
    const applied = applyChallengeCoverResponse(form, uploaded.draft);
    setCoverUrl(applied.version.coverUrl);
    setDetail((current) => {
      if (!current?.draft || !uploaded.draft) return uploaded;
      return {
        ...uploaded,
        draft: patchChallengeDraftVersion(current.draft, uploaded.draft),
      };
    });
    setRevising(false);
  }

  async function chooseCover(file: File | null) {
    if (!file || busyRef.current || !editable) return;
    const size = await readImageSize(file);
    const coverIssue = validateRecipeCoverMeta({
      mimeType: file.type,
      sizeBytes: file.size,
      width: size?.width,
      height: size?.height,
    });
    if (coverIssue) {
      setError(t(`coverIssue.${coverIssue}`));
      return;
    }
    if (coverPreviewUrl.current) URL.revokeObjectURL(coverPreviewUrl.current);
    const preview = URL.createObjectURL(file);
    coverPreviewUrl.current = preview;
    setCoverPreview(preview);
    setCoverFile(file);
    setCoverUploadFailed(false);
    setCoverRetryNotice(false);
    setError(null);
  }

  async function uploadCover() {
    if (busyRef.current || !editable || !coverFile) return;
    const validation = validateChallengeForm(form);
    setIssue(validation);
    if (validation) return;

    busyRef.current = true;
    setBusy(true);
    setCoverUploading(true);
    setCoverUploadFailed(false);
    setError(null);
    setSavedNote(null);
    try {
      const token = await getIdToken();
      let id = props.mode === 'edit' ? props.challengeId : createdIdRef.current;
      if (id == null) {
        const created = await createStudioChallenge(
          { ...buildChallengeDetailsBody(form), steps: buildChallengeStepsBody(form).steps },
          token,
        );
        id = created.id;
        createdIdRef.current = id;
      }
      try {
        const uploaded = await uploadStudioChallengeCover(id, coverFile, token);
        adoptCover(uploaded);
        clearSelectedCover();
        if (props.mode === 'create') {
          router.replace(`/studio/challenges/${id}`);
          return;
        }
      } catch (err) {
        setCoverUploadFailed(true);
        setCoverRetryNotice(false);
        setError(t(`errors.${challengeCoverErrorKey(parseChallengeApiFailure(err))}`));
        if (props.mode === 'create') {
          markChallengeCoverRetry(id);
          router.replace(`/studio/challenges/${id}`);
        }
      }
    } catch (err) {
      setError(parseChallengeApiFailure(err).detail);
    } finally {
      busyRef.current = false;
      setBusy(false);
      setCoverUploading(false);
    }
  }

  async function save() {
    if (busyRef.current || !editable) return;
    if (props.mode === 'create' && coverFile) {
      await uploadCover();
      return;
    }
    const validation = validateChallengeForm(form);
    setIssue(validation);
    if (validation) return;
    const revisingApproved = revising && canReviseApprovedChallenge(status);
    const plan = challengeSavePlan({
      mode: props.mode,
      revisingApproved,
      detailsDirty,
      stepsDirty,
    });
    if (props.mode === 'edit' && !plan.sendDetails && !plan.sendSteps) {
      setSavedNote(t('saved'));
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    setSavedNote(null);
    const detailsFailed = { current: false };
    const stepsFailed = { current: false };
    try {
      const token = await getIdToken();
      const details = buildChallengeDetailsBody(form);
      const steps = buildChallengeStepsBody(form).steps;
      if (props.mode === 'create') {
        const created = await createStudioChallenge({ ...details, steps }, token);
        router.replace(`/studio/challenges/${created.id}`);
        return;
      }

      let latest = detail;
      if (plan.sendDetails) {
        try {
          latest = await patchStudioChallenge(props.challengeId, details, token);
        } catch (err) {
          detailsFailed.current = true;
          setError(t('saveDetailsFailed', { detail: parseChallengeApiFailure(err).detail }));
        }
      }
      if (
        plan.sendSteps &&
        shouldSaveChallengeSteps({
          detailsAttempted: plan.sendDetails,
          detailsFailed: detailsFailed.current,
          stepsDirty,
        })
      ) {
        try {
          latest = await replaceStudioChallengeSteps(props.challengeId, steps, token);
        } catch (err) {
          stepsFailed.current = true;
          setError(t('saveStepsFailed', { detail: parseChallengeApiFailure(err).detail }));
        }
      }

      const outcome = challengeSaveOutcome({
        detailsDirty,
        stepsDirty,
        detailsFailed: detailsFailed.current,
        stepsFailed: stepsFailed.current,
        detailsAttempted: plan.sendDetails,
      });
      if (outcome.complete && latest?.draft) {
        const next = challengeFormFromServer({ draft: latest.draft, steps: latest.steps });
        setDetail(latest);
        setForm(next);
        setBaseline(next);
        if (typeof latest.draft.cover_url === 'string' || latest.draft.cover_url === null) {
          setCoverUrl(latest.draft.cover_url?.trim() ? latest.draft.cover_url : null);
        }
        setRevising(false);
        setSavedNote(t('saved'));
      }
    } catch (err) {
      setError(parseChallengeApiFailure(err).detail);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function submit() {
    if (busyRef.current || props.mode !== 'edit' || !submitAllowed) return;
    const validation = validateChallengeForm(form);
    setIssue(validation);
    if (validation) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      const updated = await submitStudioChallenge(props.challengeId, token);
      if (updated.draft) {
        const next = challengeFormFromServer({ draft: updated.draft, steps: updated.steps });
        setDetail(updated);
        setForm(next);
        setBaseline(next);
      }
      setSavedNote(t('submitted'));
    } catch (err) {
      setError(parseChallengeApiFailure(err).detail);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function archive() {
    if (busyRef.current || props.mode !== 'edit') return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      const updated = await archiveStudioChallenge(props.challengeId, token);
      setDetail(updated);
      setConfirmArchive(false);
    } catch (err) {
      setError(parseChallengeApiFailure(err).detail);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function chooseSession(stepId: string, option: ChallengeSessionOption) {
    updateStep(stepId, {
      kind: 'guided',
      guidedTemplateId: option.id,
      guidedTitle: option.title,
      guidedDurationSeconds: option.duration_seconds,
      guidedMediaKind: option.media_kind,
    });
    setPickerStepId(null);
  }

  if (loading) {
    return <p className="studio-form-page__status">{t('loadingEditor')}</p>;
  }

  const previewSrc = coverPreview || coverUrl;
  const coverPhase = challengeCoverPhase({
    hasLocalFile: coverFile != null,
    uploading: coverUploading,
    failed: coverUploadFailed,
    hasCoverUrl: Boolean(coverUrl),
  });

  return (
    <div className="studio-form-page">
      <Link href={studioAreaManageHref(CHALLENGES_CAPABILITY)} className="studio-form-page__back">
        <span className="studio-back-arrow" aria-hidden>
          ←
        </span>{' '}
        {t('backToList')}
      </Link>
      <header className="studio-form-page__header">
        <h1 className="studio-form-page__title">{props.mode === 'create' ? t('createTitle') : t('editTitle')}</h1>
        <p className="studio-form-page__lede">{statusLabel}</p>
      </header>

      {isChallengePendingReview(status) ? <p className="studio-form__section-note">{t('pendingNote')}</p> : null}
      {canReviseApprovedChallenge(status) ? (
        <p className="studio-form__section-note">{t('approvedNote')}</p>
      ) : null}
      {detail?.published_version_id && (revising || isChallengeDraftEditable(status)) ? (
        <p className="studio-form__section-note">{t('newVersionNote')}</p>
      ) : null}

      {canReviseApprovedChallenge(status) && !revising ? (
        <button type="button" className="studio-form__submit" disabled={busy} onClick={() => setRevising(true)}>
          {t('revise')}
        </button>
      ) : null}

      <div className="studio-form__field">
        <label htmlFor="challenge-title-he">{t('titleHe')}</label>
        <input
          id="challenge-title-he"
          value={form.titleHe}
          disabled={!editable || busy}
          onChange={(event) => setForm({ ...form, titleHe: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="challenge-title-en">{t('titleEn')}</label>
        <input
          id="challenge-title-en"
          dir="ltr"
          value={form.titleEn}
          disabled={!editable || busy}
          onChange={(event) => setForm({ ...form, titleEn: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="challenge-description-he">{t('descriptionHe')}</label>
        <textarea
          id="challenge-description-he"
          value={form.descriptionHe}
          disabled={!editable || busy}
          onChange={(event) => setForm({ ...form, descriptionHe: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="challenge-description-en">{t('descriptionEn')}</label>
        <textarea
          id="challenge-description-en"
          dir="ltr"
          value={form.descriptionEn}
          disabled={!editable || busy}
          onChange={(event) => setForm({ ...form, descriptionEn: event.target.value })}
        />
      </div>

      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <label htmlFor="challenge-days">{t('daysPerWeek')}</label>
          <StudioFieldHint id="challenge-days-hint" text={t('daysPerWeekMore')} label={t('fieldHelp')} />
        </div>
        <p id="challenge-days-lede" className="studio-form__field-lede">
          {t('daysPerWeekLede')}
        </p>
        <select
          id="challenge-days"
          aria-describedby="challenge-days-lede"
          value={form.daysPerWeek}
          disabled={!editable || busy}
          onChange={(event) => setForm({ ...form, daysPerWeek: Number(event.target.value) })}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>
      <div className="studio-form__field">
        <label htmlFor="challenge-schedule">{t('schedule')}</label>
        <p id="challenge-schedule-lede" className="studio-form__field-lede">
          {form.schedule === 'fixed_weeks' ? t('scheduleFixedLede') : t('scheduleOngoingLede')}
        </p>
        <select
          id="challenge-schedule"
          aria-describedby="challenge-schedule-lede"
          value={form.schedule}
          disabled={!editable || busy}
          onChange={(event) =>
            setForm({
              ...form,
              schedule: event.target.value === 'fixed_weeks' ? 'fixed_weeks' : 'ongoing',
            })
          }
        >
          <option value="ongoing">{t('scheduleOngoing')}</option>
          <option value="fixed_weeks">{t('scheduleFixed')}</option>
        </select>
      </div>
      {form.schedule === 'fixed_weeks' ? (
        <div className="studio-form__field">
          <label htmlFor="challenge-weeks">{t('weekCount')}</label>
          <input
            id="challenge-weeks"
            inputMode="numeric"
            value={form.weekCount}
            disabled={!editable || busy}
            onChange={(event) => setForm({ ...form, weekCount: event.target.value.replace(/\D/g, '') })}
          />
        </div>
      ) : null}

      <h2 className="studio-form__legend">{t('stepsTitle')}</h2>
      <p className="studio-form__field-lede">{t('stepsLede')}</p>
      <p className="studio-form__field-lede">{t('stepsOrderLede')}</p>
      <ol className="studio-challenge-steps">
        {form.steps.map((step, index) => (
          <li key={step.id} className="studio-challenge-step">
            <p className="studio-challenge-step__index">{t('practicePosition', { position: index + 1 })}</p>
            <div className="studio-form__field">
              <label htmlFor={`step-kind-${step.id}`}>{t('stepKind')}</label>
              <p id={`step-kind-${step.id}-lede`} className="studio-form__field-lede">
                {step.kind === 'silent' ? t('kindSilentLede') : t('kindGuidedLede')}
              </p>
              <select
                id={`step-kind-${step.id}`}
                aria-describedby={`step-kind-${step.id}-lede`}
                value={step.kind}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateStep(
                    step.id,
                    event.target.value === 'guided' ? guidedChallengeStep(step.id) : silentChallengeStep(step.id),
                  )
                }
              >
                <option value="silent">{t('kindSilent')}</option>
                <option value="guided">{t('kindGuided')}</option>
              </select>
            </div>
            {step.kind === 'silent' ? (
              <>
                <div className="studio-form__field">
                  <label htmlFor={`step-practice-${step.id}`}>{t('practiceType')}</label>
                  <select
                    id={`step-practice-${step.id}`}
                    value={step.practiceType}
                    disabled={!editable || busy}
                    onChange={(event) =>
                      updateStep(step.id, { practiceType: event.target.value as ChallengeStepDraft['practiceType'] })
                    }
                  >
                    {CHALLENGE_PRACTICE_TYPES.map((practice) => (
                      <option key={practice} value={practice}>
                        {t(`practice.${practice}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="studio-form__field">
                  <label htmlFor={`step-minutes-${step.id}`}>{t('durationMinutes')}</label>
                  <input
                    id={`step-minutes-${step.id}`}
                    inputMode="numeric"
                    value={step.durationMinutes}
                    disabled={!editable || busy}
                    onChange={(event) => updateStep(step.id, { durationMinutes: event.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </>
            ) : (
              <div className="studio-challenge-step__guided">
                {step.guidedTemplateId ? (
                  <p>
                    {step.guidedTitle || t('selectedSession')}
                    {step.guidedDurationSeconds != null
                      ? ` · ${formatDurationClock(step.guidedDurationSeconds)}`
                      : ''}
                    {step.guidedMediaKind === 'audio' || step.guidedMediaKind === 'video'
                      ? ` · ${t(`media.${step.guidedMediaKind}`)}`
                      : ''}
                  </p>
                ) : (
                  <p>{t('chooseSession')}</p>
                )}
                {editable ? (
                  <button
                    type="button"
                    className="creator-workspace__media-btn"
                    disabled={busy}
                    onClick={() => setPickerStepId(pickerStepId === step.id ? null : step.id)}
                  >
                    {t('browseSessions')}
                  </button>
                ) : null}
                {pickerStepId === step.id ? (
                  <ChallengeSessionPicker disabled={busy} onSelect={(option) => chooseSession(step.id, option)} />
                ) : null}
              </div>
            )}
            {editable ? (
              <div className="studio-challenge-step__actions">
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === 0}
                  onClick={() =>
                    setForm((current) => ({ ...current, steps: moveChallengeStep(current.steps, index, -1) }))
                  }
                >
                  {t('moveUp')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === form.steps.length - 1}
                  onClick={() =>
                    setForm((current) => ({ ...current, steps: moveChallengeStep(current.steps, index, 1) }))
                  }
                >
                  {t('moveDown')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || form.steps.length <= 1}
                  onClick={() =>
                    setForm((current) => ({ ...current, steps: removeChallengeStep(current.steps, index) }))
                  }
                >
                  {t('removeStep')}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {editable ? (
        <div className="studio-challenge-step__actions">
          <button
            type="button"
            className="creator-workspace__media-btn"
            disabled={busy || form.steps.length >= 5}
            onClick={() =>
              setForm((current) => ({
                ...current,
                steps: addChallengeStep(current.steps, silentChallengeStep(nextStepId())),
              }))
            }
          >
            {t('addPractice')}
          </button>
        </div>
      ) : null}

      <ChallengePracticeSummaryView form={form} />

      <section className="studio-challenge-cover-section" aria-labelledby="challenge-cover-title">
        <h2 id="challenge-cover-title" className="studio-form__legend">
          {t('coverTitle')}
        </h2>
        <p className="studio-form__field-lede">{t('coverLede')}</p>
        <p className="studio-form__field-lede">{t('coverOptional')}</p>
        <p className="studio-form__field-lede">{t('coverLimits')}</p>
        <p className="studio-form__field-lede">{t('coverLimitsMore')}</p>
        {detail?.published_version_id && (revising || isChallengeDraftEditable(status)) ? (
          <p className="studio-form__field-lede">{t('coverPublicNote')}</p>
        ) : null}
        {previewSrc ? (
          // The image is a local preview or the URL returned by the server.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="studio-challenge-cover" src={previewSrc} alt={t('coverAlt')} />
        ) : null}
        {coverPhase !== 'none' ? (
          <p className={coverPhase === 'failed' ? 'studio-form__error' : 'studio-form-page__status'} role="status">
            {t(`coverPhase.${coverPhase}`)}
          </p>
        ) : null}
        <div className="studio-form__field">
          <label htmlFor="challenge-cover">{t('coverChoose')}</label>
          <input
            id="challenge-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={!editable || busy}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = '';
              void chooseCover(file);
            }}
          />
        </div>
        <div className="studio-challenge-cover-actions">
          {editable && coverFile ? (
            <button type="button" className="studio-form__submit" disabled={busy} onClick={() => void uploadCover()}>
              {coverUploading ? t('coverPhase.uploading') : t('coverUpload')}
            </button>
          ) : null}
          {editable && coverFile && !coverUploading ? (
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
              disabled={busy}
              onClick={clearSelectedCover}
            >
              {t('coverCancel')}
            </button>
          ) : null}
          {editable && coverUploadFailed && !coverFile ? (
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
              disabled={busy}
              onClick={clearSelectedCover}
            >
              {t('coverContinue')}
            </button>
          ) : null}
        </div>
      </section>

      {issue ? (
        <p className="studio-form__error" role="alert">
          {t(`issue.${issue}`)}
        </p>
      ) : null}
      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : coverRetryNotice ? (
        <p className="studio-form__error" role="alert">
          {t('errors.coverRetry')}
        </p>
      ) : null}
      {savedNote ? <p className="studio-form__section-note">{savedNote}</p> : null}

      <div className="studio-form__actions studio-challenge-actions">
        {editable ? (
          <button type="button" className="studio-form__submit" disabled={busy} onClick={() => void save()}>
            {busy && !coverUploading ? t('saving') : t('save')}
          </button>
        ) : null}
        {props.mode === 'edit' && isChallengeDraftEditable(status) ? (
          <button type="button" className="creator-workspace__media-btn" disabled={busy || !submitAllowed} onClick={() => void submit()}>
            {t('submit')}
          </button>
        ) : null}
        {props.mode === 'edit' && !detail?.archived_at ? (
          <button
            type="button"
            className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
            disabled={busy}
            onClick={() => setConfirmArchive(true)}
          >
            {t('archive')}
          </button>
        ) : null}
      </div>

      <StudioConfirmDialog
        open={confirmArchive}
        title={t('archiveTitle')}
        message={t('archiveBody')}
        cancelLabel={t('archiveCancel')}
        confirmLabel={t('archiveConfirm')}
        confirmBusy={busy}
        confirmBusyLabel={t('saving')}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={() => void archive()}
      />
    </div>
  );
}
