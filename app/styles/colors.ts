// Blue-Green gradient theme for flood detection dashboard
export const theme = {
  // Neutral / grayscale primary to avoid bluish accents
  primary: {
    light: '#D1D5DB',
    main: '#9CA3AF',
    dark: '#6B7280',
  },
  secondary: {
    light: '#34D399',
    main: '#10B981',
    dark: '#059669',
  },
  background: {
    dark: '#050506',
    panel: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
  },
  status: {
    safe: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    critical: '#DC2626',
  },
  neutral: {
    white: '#E6EEF8',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#0B1120',
    },
  },
};

export const waterLevelColors = {
  veryLow: '#10B981',
  low: '#84CC16',
  // use neutral for the normal water-level color to avoid blue highlights
  normal: '#9CA3AF',
  high: '#F59E0B',
  critical: '#EF4444',
};

export const floodRiskColors = {
  none: '#10B981',
  low: '#84CC16',
  medium: '#FBBF24',
  high: '#F97316',
  critical: '#DC2626',
};
