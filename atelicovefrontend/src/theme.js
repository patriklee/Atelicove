import { createTheme } from '@mui/material/styles';

export const primaryFontFamily =
  '"Plus Jakarta Sans", "Inter", "Segoe UI", Arial, sans-serif';

const theme = createTheme({
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
    button: { fontWeight: 500 },
    caption: { fontWeight: 400 },
    overline: { fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily: primaryFontFamily,
        },
        body: {
          fontFamily: primaryFontFamily,
          fontWeight: 400,
        },
        '#root': {
          fontFamily: primaryFontFamily,
        },
        'button, input, optgroup, select, textarea': {
          font: 'inherit',
        },
        table: {
          fontFamily: 'inherit',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: 'inherit',
        },
        head: {
          fontWeight: 500,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: 'inherit',
          fontWeight: 400,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          fontWeight: 500,
        },
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

export default theme;
