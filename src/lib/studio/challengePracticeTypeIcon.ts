import type { ChallengePracticeType } from '@/lib/studio/challengeEditor';

/**
 * Icon names aligned with the app quiet-practice glyphs
 * (MaterialCommunityIcons where the app uses that set).
 */
export function challengePracticeTypeIconName(
  type: ChallengePracticeType | '',
): string | null {
  switch (type) {
    case 'meditation':
      return 'meditation';
    case 'walking':
      return 'walk';
    case 'breathing':
      return 'weather-windy';
    case 'dance':
      return 'dance-ballroom';
    case 'jump_rope':
      return 'jump-rope';
    default:
      return null;
  }
}
