// Claude Mobile + ElevenLabs Inspired Theme
// Warm, clean, minimal

export const colors = {
  // Backgrounds — warm cream palette
  background: '#F5F0EB',
  backgroundAlt: '#FFFFFF',
  backgroundDeep: '#EDE8E3',

  // Primary accent — warm amber
  primary: '#D97706',
  primaryLight: '#F59E0B',
  primaryDark: '#B45309',
  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  accent: '#D97706',
  accentAlt: '#F59E0B',
  accentGlow: 'rgba(217, 119, 6, 0.2)',

  // Cards — clean white
  card: '#FFFFFF',
  cardStrong: '#FAFAF7',
  cardHover: '#F5F5F0',
  border: 'rgba(0, 0, 0, 0.08)',
  borderGlow: 'rgba(217, 119, 6, 0.3)',

  // Text — high contrast dark
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  muted: '#9CA3AF',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  // Recording — red
  recording: '#EF4444',
  recordingGlow: 'rgba(239, 68, 68, 0.15)',

  // Legacy aliases for backward compatibility
  gold: '#D97706',
  goldLight: '#F59E0B',
  goldDark: '#B45309',
  navy: '#1A1A1A',
  navyLight: '#4A4A4A',
};

export const gradients = {
  screen: ['#F5F0EB', '#F5F0EB', '#F5F0EB'],
  screenStudy: ['#F5F0EB', '#EDE8E3', '#F5F0EB'],
  accent: ['#D97706', '#F59E0B'],
  primary: ['#B45309', '#D97706', '#F59E0B'],
  primaryShine: ['#D97706', '#F59E0B', '#D97706'],
  secondary: ['#7C3AED', '#A78BFA'],
  study: ['#F5F0EB', '#EDE8E3'],
  aurora: ['#F5F0EB', '#F5F0EB', '#F5F0EB'],
  auroraBlue: ['rgba(217, 119, 6, 0.05)', 'rgba(217, 119, 6, 0.02)', 'rgba(217, 119, 6, 0.05)'],
  auroraGold: ['rgba(217, 119, 6, 0.05)', 'rgba(217, 119, 6, 0.02)', 'rgba(217, 119, 6, 0.05)'],
  gold: ['#B45309', '#D97706', '#F59E0B'],
} as const;

export const glass = {
  backgroundColor: '#FFFFFF',
  backgroundColorStrong: '#FAFAF7',
  borderColor: 'rgba(0, 0, 0, 0.08)',
  borderColorActive: 'rgba(217, 119, 6, 0.3)',
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  blurIntensity: 0,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 40,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  enter: 400,
  spring: {
    damping: 18,
    stiffness: 140,
    mass: 1,
  },
  springBouncy: {
    damping: 14,
    stiffness: 160,
    mass: 0.8,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};
