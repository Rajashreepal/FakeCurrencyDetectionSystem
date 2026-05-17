import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7C5CFF', light: '#A892FF', dark: '#4C35B8' },
    secondary: { main: '#22D3EE', light: '#67E8F9', dark: '#0891B2' },
    success: { main: '#34D399' },
    warning: { main: '#FBBF24' },
    error: { main: '#FB7185' },
    background: { default: '#050816', paper: 'rgba(15, 23, 42, 0.74)' },
    text: { primary: '#F8FAFC', secondary: '#AAB7CF' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.065em' },
    h2: { fontWeight: 800, letterSpacing: '-0.045em' },
    h3: { fontWeight: 750, letterSpacing: '-0.035em' },
    h4: { fontWeight: 750, letterSpacing: '-0.025em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 24 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '11px 22px',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))',
          border: '1px solid rgba(255,255,255,.12)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            background: 'rgba(255,255,255,.035)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255,255,255,.035)',
        },
      },
    },
  },
});
