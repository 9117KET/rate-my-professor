"use client";

import { ThemeProvider, createTheme } from "@mui/material";
import { memo } from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#001B3F",
      light: "#1A324D",
      dark: "#00142E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E31E24",
      light: "#FF2F35",
      dark: "#C31419",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: {
      fontWeight: 600,
      color: "#001B3F",
    },
    subtitle1: {
      opacity: 0.9,
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
            backgroundColor: "#E31E24",
          },
        },
        contained: {
          backgroundColor: "#E31E24",
          "&:hover": {
            backgroundColor: "#C31419",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#001B3F",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: "#001B3F",
            },
          },
        },
      },
    },
  },
});

const ClientLayout = memo(({ children }) => {
  console.log("ClientLayout rendering");
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
});

ClientLayout.displayName = "ClientLayout";

export default ClientLayout;
