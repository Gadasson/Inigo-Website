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
  type ChallengeSessionOption,
  type StudioChallengeDetail,
} from '@/lib/api/studioChallenges';
import {
  addChallengeStep,
  buildChallengeDetailsBody,
  buildChallengeStepsBody,
  canReviseApprovedChallenge,
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
  moveChallengeStep,
  removeChallengeStep,
  shouldSaveChallengeSteps,
  silentChallengeStep,
  validateChallengeForm,
  CHALLENGE_PRACTICE_TYPES,
  type ChallengeEditorForm,
  type ChallengeFormIssue,
  type ChallengePracticeSummary,
  type ChallengeStepDraft,
} from '@/lib/studio/challengeEditor';
import { formatDurationClock } from '@/lib/studio/formatDuration';

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; challengeId: number };

function nextStepId(): string {
  return `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
  const busyRef = useRef(false);

  const status = detail?.draft?.status ?? (props.mode === 'create' ? 'draft' : null);
  const editable =
    props.mode === 'create' || isChallengeDraftEditable(status) || (revising && canReviseApprovedChallenge(status));
  const detailsDirty = challengeDetailsDirty(form, baseline);
  const stepsDirty = challengeStepsDirty(form, baseline);
  const dirty = detailsDirty || stepsDirty;

  const challengeId = props.mode === 'edit' ? props.challengeId : null;

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
        setRevising(false);
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

  async function save() {
    if (busyRef.current || !editable) return;
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
    if (busyRef.current || props.mode !== 'edit' || dirty || !isChallengeDraftEditable(status)) return;
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

      {issue ? (
        <p className="studio-form__error" role="alert">
          {t(`issue.${issue}`)}
        </p>
      ) : null}
      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {savedNote ? <p className="studio-form__section-note">{savedNote}</p> : null}

      <div className="studio-form__actions studio-challenge-actions">
        {editable ? (
          <button type="button" className="studio-form__submit" disabled={busy} onClick={() => void save()}>
            {busy ? t('saving') : t('save')}
          </button>
        ) : null}
        {props.mode === 'edit' && isChallengeDraftEditable(status) ? (
          <button type="button" className="creator-workspace__media-btn" disabled={busy || dirty} onClick={() => void submit()}>
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
