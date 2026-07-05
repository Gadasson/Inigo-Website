/** Values from Django GuidedSessionTemplate — do not invent alternatives. */

export const GUIDED_SESSION_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'Hebrew' },
] as const;

export const GUIDED_SESSION_SOUND_GENDERS = [
  { value: 'male', label: 'Male voice' },
  { value: 'female', label: 'Female voice' },
  { value: 'neutral', label: 'Neutral voice' },
] as const;

export const GUIDED_SESSION_DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

export const GUIDED_SESSION_ACCESS_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'plus', label: 'Plus' },
  { value: 'premium', label: 'Premium' },
  { value: 'pro', label: 'Pro' },
] as const;

export const GUIDED_SESSION_CREATE_DEFAULTS = {
  environment: 'indoor',
  background_music: 'ambient',
  access_tier: 'free' as const,
  tags: [] as string[],
  sub_category_codes: [] as string[],
};
