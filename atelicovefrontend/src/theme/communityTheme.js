import { alpha, createTheme } from '@mui/material/styles';
import { communityColors, communityTokens } from './tokens';

export const primaryFontFamily =
  '"Plus Jakarta Sans", "Inter", "Segoe UI", Arial, sans-serif';

const softShadow = '0 8px 24px rgba(49, 69, 58, 0.06)';
const floatingShadow = '0 14px 34px rgba(49, 69, 58, 0.10)';

const communityTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#91AA93',
      main: communityTokens.brand.primary,
      dark: '#526F59',
      contrastText: '#142219',
    },
    secondary: {
      light: '#7F898D',
      main: '#5E696E',
      dark: '#414B50',
      contrastText: communityColors.white,
    },
    background: communityTokens.background,
    surface: communityTokens.surface,
    border: communityTokens.border,
    brand: communityTokens.brand,
    navigation: communityTokens.navigation,
    text: {
      ...communityTokens.text,
      disabled: '#899195',
    },
    divider: communityTokens.border.subtle,
    action: {
      active: communityTokens.text.secondary,
      hover: communityTokens.surface.hover,
      selected: communityTokens.surface.selected,
      disabled: '#92999C',
      disabledBackground: '#E5E3DF',
      focus: alpha(communityTokens.brand.primary, 0.18),
    },
    success: {
      light: '#E4EEE5',
      main: '#4E7958',
      dark: '#355A3E',
      contrastText: communityColors.white,
    },
    warning: {
      light: '#F7E9CA',
      main: '#9A6300',
      dark: '#704800',
      contrastText: communityColors.white,
    },
    error: {
      light: '#F6DEDC',
      main: '#B23A3A',
      dark: '#862828',
      contrastText: communityColors.white,
    },
    info: {
      light: '#E3EDF2',
      main: '#315F78',
      dark: communityColors.navy,
      contrastText: communityColors.white,
    },
  },
  shape: {
    borderRadius: 10,
  },
  customShadows: {
    soft: softShadow,
    floating: floatingShadow,
  },
  typography: {
    fontFamily: primaryFontFamily,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 500 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 600, textTransform: 'none' },
    caption: { fontWeight: 400 },
    overline: { fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: theme => ({
        html: {
          backgroundColor: theme.palette.background.default,
          fontFamily: primaryFontFamily,
        },
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          fontFamily: primaryFontFamily,
          fontWeight: 400,
        },
        '#root': {
          fontFamily: primaryFontFamily,
          minHeight: '100vh',
        },
        'button, input, optgroup, select, textarea': {
          font: 'inherit',
        },
        table: {
          fontFamily: 'inherit',
        },
        '::selection': {
          backgroundColor: alpha(theme.palette.brand.primary, 0.24),
        },
      }),
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 9,
          fontWeight: 600,
          minHeight: 36,
          paddingInline: theme.spacing(1.75),
          '&.Mui-focusVisible': {
            outline: `3px solid ${alpha(theme.palette.brand.primary, 0.34)}`,
            outlineOffset: 2,
          },
        }),
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.brand.primary,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.common.white,
          },
          '&.Mui-disabled': {
            backgroundColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: theme.palette.border.default,
          '&:hover': {
            backgroundColor: theme.palette.surface.hover,
            borderColor: theme.palette.brand.primary,
          },
        }),
        text: ({ theme }) => ({
          '&:hover': {
            backgroundColor: theme.palette.surface.hover,
          },
        }),
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          backgroundColor: theme.palette.surface.default,
          border: `1px solid ${theme.palette.border.subtle}`,
          borderRadius: 12,
          boxShadow: softShadow,
        }),
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: ({ theme }) => ({
          borderColor: theme.palette.border.subtle,
        }),
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: 9,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.border.default,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${alpha(theme.palette.brand.primary, 0.18)}`,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.brand.primary,
            borderWidth: 1,
          },
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: theme.palette.border.default,
        }),
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.secondary,
          fontWeight: 500,
          '&.Mui-focused': {
            color: theme.palette.primary.dark,
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottomColor: theme.palette.border.subtle,
          fontFamily: 'inherit',
        }),
        head: ({ theme }) => ({
          backgroundColor: theme.palette.background.subtle,
          color: theme.palette.text.secondary,
          fontWeight: 600,
        }),
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          '&.MuiPaper-root': {
            border: `1px solid ${theme.palette.border.subtle}`,
            boxShadow: softShadow,
          },
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.MuiTableRow-hover:hover': {
            backgroundColor: theme.palette.surface.hover,
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: theme.palette.surface.selected,
          },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        outlined: ({ theme }) => ({
          backgroundColor: alpha(theme.palette.background.paper, 0.72),
          borderColor: theme.palette.border.default,
        }),
        label: {
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.navigation.background,
          borderRadius: 7,
          fontFamily: 'inherit',
          fontSize: '0.75rem',
          fontWeight: 400,
        }),
        arrow: ({ theme }) => ({
          color: theme.palette.navigation.background,
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.border.subtle}`,
          borderRadius: 14,
          boxShadow: floatingShadow,
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          border: `1px solid ${theme.palette.border.subtle}`,
          borderRadius: 10,
          boxShadow: floatingShadow,
          marginTop: theme.spacing(0.5),
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 7,
          fontWeight: 500,
          marginInline: theme.spacing(0.5),
          minHeight: 38,
          '&:hover': {
            backgroundColor: theme.palette.surface.hover,
          },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: theme.palette.surface.selected,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.secondary,
          '&:hover': {
            backgroundColor: theme.palette.surface.hover,
            color: theme.palette.text.primary,
          },
          '&.Mui-focusVisible': {
            outline: `3px solid ${alpha(theme.palette.brand.primary, 0.34)}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.border.subtle,
        }),
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.brand.soft,
        }),
        bar: ({ theme }) => ({
          backgroundColor: theme.palette.brand.primary,
        }),
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default communityTheme;
