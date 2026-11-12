// Tema global do FightMatch
export const COLORS = {
  // Fundo
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#242424',
  card: '#1E1E1E',

  // Primária — vermelho sangue
  primary: '#E63946',
  primaryDark: '#C1121F',
  primaryLight: '#FF6B6B',

  // Acentos
  accent: '#FFB703',
  accentDark: '#E09200',

  // Texto
  textPrimary: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#5A5A5A',

  // Status
  success: '#2DC653',
  error: '#E63946',
  warning: '#FFB703',

  // Bordas
  border: '#2A2A2A',
  borderLight: '#333333',

  // Especiais
  match: '#E63946',
  online: '#2DC653',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // Texto
  textXs: 11,
  textSm: 13,
  textMd: 15,
  textLg: 17,
  textXl: 20,
  textXxl: 24,
  textTitle: 30,

  // Border radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
};
