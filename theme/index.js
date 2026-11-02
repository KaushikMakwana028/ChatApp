import Colors from './colors';

export { Colors };

export const Typography = {
  fontFamily: undefined, // Uses native system font
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};

export const Layout = {
  headerHeight: 56,
  tabHeight: 46,
  avatarSizes: {
    sm: 36,
    md: 48,
    lg: 60,
    xl: 110,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    bubble: 8,
    pill: 24,
  },
};

export default {
  Colors,
  Typography,
  Layout,
};
