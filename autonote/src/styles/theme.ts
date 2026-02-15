// Study Dark - Professional Academic Theme 📚

export const colors = {
  // Backgrounds - Deep academic dark
  background: '#0f1216',
  backgroundAlt: '#1a1d23', 
  backgroundDeep: '#0a0c10',

  // Professional academic accents
  primary: '#4a9eff',
  primaryLight: '#66b3ff',
  primaryDark: '#2e7ad3',
  secondary: '#7c3aed',
  secondaryLight: '#9d5aff',
  accent: '#06b6d4',

  // Study-focused highlights
  accent: '#06b6d4',
  accentAlt: '#22d3ee',
  accentGlow: 'rgba(34, 211, 238, 0.3)',

  // Glass effects - clean and modern
  card: 'rgba(74, 158, 255, 0.08)',
  cardStrong: 'rgba(74, 158, 255, 0.12)',
  cardHover: 'rgba(74, 158, 255, 0.16)',
  border: 'rgba(74, 158, 255, 0.15)',
  borderGlow: 'rgba(74, 158, 255, 0.4)',

  // Text - high contrast for readability
  text: '#f8fafc',
  textSecondary: '#e2e8f0',
  muted: '#94a3b8',

  // Status colors - academic friendly
  success: '#10b981',
  warning: '#f59e0b', 
  danger: '#ef4444',

  // Recording state - professional red
  recording: '#dc2626',
  recordingGlow: 'rgba(220, 38, 38, 0.3)',
};

export const gradients = {
  // Academic gradient backgrounds
  screen: ['#0a0c10', '#0f1216', '#1a1d23'],
  screenStudy: ['#0a0c10', '#1a1d23', '#2a2d33'],

  // Primary gradients - cool academic blues
  accent: ['#4a9eff', '#66b3ff'],
  primary: ['#2e7ad3', '#4a9eff', '#66b3ff'],
  primaryShine: ['#4a9eff', '#66b3ff', '#4a9eff'],

  // Secondary academic gradients
  secondary: ['#7c3aed', '#9d5aff'],
  study: ['#1a1d23', '#2a2d33'],

  // Aurora academic - blue and cyan blend
  aurora: ['#0f1216', '#1a2332', '#0f1216'],
  auroraBlue: ['rgba(74, 158, 255, 0.1)', 'rgba(26, 35, 50, 0.3)', 'rgba(74, 158, 255, 0.1)'],
} as const;

export const glass = {
  backgroundColor: 'rgba(74, 158, 255, 0.06)',
  backgroundColorStrong: 'rgba(74, 158, 255, 0.12)',
  borderColor: 'rgba(74, 158, 255, 0.15)',
  borderColorActive: 'rgba(74, 158, 255, 0.4)',
  shadowColor: '#4a9eff',
  blurIntensity: 60,
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
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

// Animation timing
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  enter: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
};

// Shadows with royal gold glow
export const shadows = {
  sm: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};
