"use client";

import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
      light: "#e3f2fd",
      dark: "#1976d2",
      contrastText: "#000000",
    },
    secondary: {
      main: "#ff4081",
      light: "#fce4ec",
      dark: "#c51162",
      contrastText: "#000000",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: {
      fontWeight: 600,
    },
    subtitle1: {
      opacity: 0.8,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#2196f3",
            },
          },
        },
      },
    },
  },
});

const ClientLayout = ({ children }) => {
  // Client-side logic here
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default ClientLayout;
