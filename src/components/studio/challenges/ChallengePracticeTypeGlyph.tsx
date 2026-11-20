import type { ChallengePracticeType } from '@/lib/studio/challengeEditor';
import { challengePracticeTypeIconName } from '@/lib/studio/challengePracticeTypeIcon';

type Props = {
  practiceType: ChallengePracticeType | '';
};

/**
 * Compact line glyph for the quiet-step practice picker.
 * jump_rope uses the same jump-rope mark the app maps for that type.
 */
export default function ChallengePracticeTypeGlyph({ practiceType }: Props) {
  const name = challengePracticeTypeIconName(practiceType);
  if (!name) return null;

  return (
    <svg
      className="studio-challenge-practice-glyph"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      data-practice-icon={name}
    >
      {practiceType === 'meditation' ? (
        <>
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </>
      ) : null}
      {practiceType === 'walking' ? (
        <path
          d="M9 4.5c1.1 0 1.8 1 1.5 2.1L9.2 12M8.2 12c-1.4.9-1.8 2.3-1.1 3.7M9.6 12c1.5.7 2.3 2.1 1.9 3.8M15 6c1.1 0 1.8 1 1.5 2.1L15.2 14M14.2 14c-1.4.9-1.8 2.2-1.1 3.6M15.6 14c1.5.7 2.3 2 1.9 3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ) : null}
      {practiceType === 'breathing' ? (
        <>
          <path
            d="M4 15c3-5 5-5 8 0s5 5 8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M5 10c2.5-4 4.5-4 7 0s4.5 4 7 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {practiceType === 'dance' ? (
        <path
          d="M12 3.5c1.2 0 2.2 1 2.2 2.2S13.2 7.9 12 7.9 9.8 6.9 9.8 5.7 10.8 3.5 12 3.5zm-1.2 5.2h2.4l1.1 4.2 2.4 1.4-.8 1.4-2.2-1.1-.6 2.6 2.6 2.8-1.3 1.2-2.8-2.7-2.8 2.7-1.3-1.2 2.6-2.8-.6-2.6-2.2 1.1-.8-1.4 2.4-1.4 1.1-4.2z"
          fill="currentColor"
        />
      ) : null}
      {practiceType === 'jump_rope' ? (
        <>
          <circle cx="12" cy="6.5" r="2" fill="currentColor" />
          <path
            d="M12 8.5v6.5M9.5 12c-1.6.3-2.4 1.6-1.6 2.9M14.5 12c1.6.3 2.4 1.6 1.6 2.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M5.5 8c2.4-3.6 5.2-4.8 6.5-.8 1.3-4 4.1-2.8 6.5.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M10 17.5c-.5 1.3-.2 2.3.5 3M14 17.5c.5 1.3.2 2.3-.5 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}
