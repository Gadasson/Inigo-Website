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

export const GUIDED_SESSION_CATEGORIES = [
  { value: 'mindful-living', label: 'Mindful Living' },
  { value: 'nature-connection', label: 'Nature Connection' },
  { value: 'inner-journey', label: 'Inner Journey' },
  { value: 'stress-relief', label: 'Stress Relief' },
  { value: 'focus-concentration', label: 'Focus & Concentration' },
  { value: 'love', label: 'Love' },
] as const;

export const GUIDED_SESSION_PRIMARY_CATEGORIES = [
  { value: 'meditation', label: 'Meditation' },
  { value: 'breathing', label: 'Breathing' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates-core', label: 'Pilates / Core' },
  { value: 'qigong', label: 'Qigong' },
  { value: 'somatic-body-awareness', label: 'Somatic / Body Awareness' },
  { value: 'relaxation-rest', label: 'Relaxation / Rest' },
  { value: 'sound-healing', label: 'Sound Healing' },
] as const;

export const GUIDED_SESSION_CREATE_DEFAULTS = {
  environment: 'indoor',
  background_music: 'ambient',
  access_tier: 'free' as const,
  tags: [] as string[],
  sub_category_codes: [] as string[],
};
