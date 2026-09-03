/**
 * MaAI design system — light, clean, clinical.
 *
 * One strong primary (a trustworthy clinical blue), a restrained neutral
 * surface scale, and semantic colors reserved exclusively for risk/status —
 * never reused for branding, so risk color-coding is never ambiguous.
 *
 * Token *names* are kept stable across the whole app so every screen keeps
 * compiling against the same imports; only values changed when this file
 * was rewritten from the previous dark theme.
 */

export const COLORS = {
  // Neutral surfaces
  background: '#F6F8FB',
  cardBg: '#FFFFFF',
  cardSecondaryBg: '#F1F5F9',
  inputBg: '#FFFFFF',

  // Deep-surface tokens kept for API compatibility with the old dark theme;
  // now just point at readable light equivalents so nothing regresses to
  // hardcoded dark hex if a screen still references them mid-migration.
  surfaceDeep: '#F6F8FB',
  surfaceElevated: '#FFFFFF',
  surfaceSunken: '#F1F5F9',
  surfaceInput: '#FFFFFF',
  overlayDeep: 'rgba(15, 23, 42, 0.55)',
  overlayDeepAlt: 'rgba(15, 23, 42, 0.7)',
  borderSubtle: '#E2E8F0',
  borderStrong: '#CBD5E1',
  onDarkPrimary: '#0F172A',
  onDarkSecondary: '#475569',
  onDarkMuted: '#64748B',

  // Primary — one clinical blue, used for CTAs / active states / links only
  primary: '#1D6FE0',
  primaryLight: 'rgba(29, 111, 224, 0.10)',
  primaryDark: '#1552AD',
  primaryBorder: 'rgba(29, 111, 224, 0.30)',

  // Accent — used sparingly for the Vision modality and secondary emphasis
  accent: '#D9480F',
  accentLight: 'rgba(217, 72, 15, 0.10)',
  accentDark: '#B8390C',

  // Voice modality accent — kept distinct from primary/accent/risk colors
  voiceAccent: '#7C3AED',
  voiceAccentLight: 'rgba(124, 58, 237, 0.10)',
  voiceAccentDark: '#6D28D9',
  voiceAccentBorder: 'rgba(124, 58, 237, 0.28)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverted: '#FFFFFF',

  // Risk semantics — the only place red/amber/green appear
  riskHigh: '#DC2626',
  riskHighBg: 'rgba(220, 38, 38, 0.08)',
  riskHighLight: 'rgba(220, 38, 38, 0.08)',
  riskHighBorder: 'rgba(220, 38, 38, 0.30)',

  riskMedium: '#B45309',
  riskMediumBg: 'rgba(217, 119, 6, 0.10)',
  riskMediumLight: 'rgba(217, 119, 6, 0.10)',
  riskMediumBorder: 'rgba(217, 119, 6, 0.30)',

  riskLow: '#15803D',
  riskLowBg: 'rgba(22, 163, 74, 0.10)',
  riskLowLight: 'rgba(22, 163, 74, 0.10)',
  riskLowBorder: 'rgba(22, 163, 74, 0.28)',

  info: '#0284C7',
  infoLight: 'rgba(2, 132, 199, 0.10)',

  // Borders & dividers
  border: '#E2E8F0',
  borderLight: '#EEF2F6',
  divider: '#E2E8F0',
  disabled: '#CBD5E1',
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Alerts
  urgentBadge: '#DC2626',
  followupBadge: '#0284C7',
  priorityBadge: '#B45309',
};

export const TYPOGRAPHY = {
  display: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 21, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1 },
  body: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0 },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const, letterSpacing: 0 },
  caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.1 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.4 },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.6 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/** Minimum interactive sizes, referenced instead of ad hoc numbers. */
export const COMPONENT_TOKENS = {
  minTouchTarget: 44,
  buttonHeight: 50,
  inputHeight: 48,
};

export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
  // Kept for API compatibility with call sites written during the dark-theme
  // era; now just a slightly stronger card shadow rather than a neon glow.
  glowPrimary: {
    shadowColor: '#1D6FE0',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  glowAccent: {
    shadowColor: '#D9480F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
};
