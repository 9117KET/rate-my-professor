"use client";

import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material";
import { memo } from "react";
import React from "react";

let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
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
      fontSize: "1.8rem",
      "@media (min-width:600px)": {
        fontSize: "2rem",
      },
      "@media (min-width:900px)": {
        fontSize: "2.4rem",
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.4rem",
      "@media (min-width:600px)": {
        fontSize: "1.5rem",
      },
      "@media (min-width:900px)": {
        fontSize: "1.8rem",
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.1rem",
      "@media (min-width:600px)": {
        fontSize: "1.2rem",
      },
      "@media (min-width:900px)": {
        fontSize: "1.25rem",
      },
    },
    subtitle1: {
      opacity: 0.9,
      fontSize: "0.9rem",
      "@media (min-width:600px)": {
        fontSize: "1rem",
      },
    },
    body1: {
      fontSize: "0.9rem",
      "@media (min-width:600px)": {
        fontSize: "1rem",
      },
    },
    body2: {
      fontSize: "0.8rem",
      "@media (min-width:600px)": {
        fontSize: "0.875rem",
      },
    },
    button: {
      fontSize: "0.8rem",
      "@media (min-width:600px)": {
        fontSize: "0.875rem",
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          boxShadow: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          "@media (min-width:600px)": {
            padding: "8px 20px",
          },
          "@media (min-width:900px)": {
            padding: "10px 24px",
          },
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
          "& .MuiInputLabel-root": {
            fontSize: "0.9rem",
            "@media (min-width:600px)": {
              fontSize: "1rem",
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "0.9rem",
            "@media (min-width:600px)": {
              fontSize: "1rem",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "8px",
          "@media (max-width:600px)": {
            margin: "16px",
            width: "calc(100% - 32px)",
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.2rem",
          "@media (min-width:600px)": {
            fontSize: "1.4rem",
          },
          fontWeight: 600,
          padding: "16px 24px",
          "@media (max-width:600px)": {
            padding: "16px 16px",
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          "@media (max-width:600px)": {
            padding: "16px 16px",
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          "@media (max-width:600px)": {
            padding: "16px 16px",
          },
        },
      },
    },
  },
});

// Apply responsive font sizes to the theme
theme = responsiveFontSizes(theme);

const ClientLayout = memo(({ children }) => {
  console.log("ClientLayout rendering");

  // Ensure this component only renders on the client side
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return placeholder on server-side to avoid hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
});

ClientLayout.displayName = "ClientLayout";

export default ClientLayout;
