/** Short helper copy for Studio guided session form fields. */
export const GUIDED_SESSION_FIELD_HINTS = {
  description:
    'What someone will feel or learn. This appears in the library and when sharing.',
  voice: 'Preferred voice style for guided audio, when recorded.',
  difficulty: 'Helps people choose a session that matches their experience.',
  practice: 'The practice type — meditation, breathing, yoga, and so on. Used for browsing.',
  focus: 'The emotional theme or intention — how the session feels in the library.',
  instructor: 'The name shown as the guide for this session.',
  environment: 'The setting or atmosphere — e.g. indoor, outdoor, nature.',
  backgroundMusic: 'The mood or style of background sound — e.g. ambient, silence.',
  backgroundMusicCreator: 'Optional credit for the music or sound used.',
  accessTier: 'Who can access this session in the app — free or paid tiers.',
  tags: 'Optional keywords for discovery. Separate with commas.',
} as const;

export type GuidedSessionFieldHintKey = keyof typeof GUIDED_SESSION_FIELD_HINTS;
