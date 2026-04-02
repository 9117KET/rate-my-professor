"use client";

import { ThemeProvider, createTheme, responsiveFontSizes, CssBaseline } from "@mui/material";
import { memo } from "react";
import React from "react";

let theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#001B3F",
      light: "#0A3164",
      dark: "#00102A",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E31E24",
      light: "#FF3C42",
      dark: "#B71C1C",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#212B36",
      secondary: "#637381",
      disabled: "#919EAB",
    },
    divider: "rgba(0,0,0,0.08)",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h4: {
      fontWeight: 800,
      color: "#001B3F",
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    subtitle1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.65,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    caption: {
      fontSize: "0.75rem",
      letterSpacing: "0.01em",
    },
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    "0 2px 6px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
    "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    "0 6px 18px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)",
    "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
    "0 10px 28px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05)",
    "0 12px 32px rgba(0,0,0,0.11), 0 4px 12px rgba(0,0,0,0.06)",
    "0 14px 36px rgba(0,0,0,0.11), 0 4px 14px rgba(0,0,0,0.06)",
    "0 16px 40px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.06)",
    "0 18px 44px rgba(0,0,0,0.12), 0 6px 18px rgba(0,0,0,0.07)",
    "0 20px 48px rgba(0,0,0,0.13), 0 8px 20px rgba(0,0,0,0.07)",
    "0 22px 52px rgba(0,0,0,0.13), 0 8px 22px rgba(0,0,0,0.07)",
    "0 24px 56px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)",
    "0 26px 60px rgba(0,0,0,0.14), 0 10px 26px rgba(0,0,0,0.08)",
    "0 28px 64px rgba(0,0,0,0.15), 0 10px 28px rgba(0,0,0,0.08)",
    "0 30px 68px rgba(0,0,0,0.15), 0 12px 30px rgba(0,0,0,0.09)",
    "0 32px 72px rgba(0,0,0,0.15), 0 12px 32px rgba(0,0,0,0.09)",
    "0 34px 76px rgba(0,0,0,0.16), 0 14px 34px rgba(0,0,0,0.09)",
    "0 36px 80px rgba(0,0,0,0.16), 0 14px 36px rgba(0,0,0,0.10)",
    "0 38px 84px rgba(0,0,0,0.17), 0 16px 38px rgba(0,0,0,0.10)",
    "0 40px 88px rgba(0,0,0,0.17), 0 16px 40px rgba(0,0,0,0.10)",
    "0 42px 92px rgba(0,0,0,0.17), 0 18px 42px rgba(0,0,0,0.11)",
    "0 44px 96px rgba(0,0,0,0.18), 0 18px 44px rgba(0,0,0,0.11)",
    "0 46px 100px rgba(0,0,0,0.18), 0 20px 46px rgba(0,0,0,0.11)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,27,63,0.18) transparent",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          textTransform: "none",
          minHeight: 42,
          fontSize: "0.875rem",
          transition: "all 0.18s ease",
        },
        contained: {
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0A3164 0%, #001B3F 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #1A4A7A 0%, #0A3164 100%)",
          },
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #FF3C42 0%, #E31E24 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #FF5A5F 0%, #FF3C42 100%)",
          },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
            backgroundColor: "rgba(0,27,63,0.04)",
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(0,27,63,0.3)",
          "&:hover": {
            borderColor: "#001B3F",
            backgroundColor: "rgba(0,27,63,0.04)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(0,27,63,0.05)",
          },
        },
        sizeLarge: {
          minHeight: 50,
          fontSize: "0.9375rem",
          padding: "12px 28px",
        },
        sizeSmall: {
          minHeight: 34,
          fontSize: "0.8125rem",
          padding: "5px 14px",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          color: "#212B36",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.10)",
          "@media (max-width:600px)": {
            margin: "16px",
            width: "calc(100% - 32px)",
            maxHeight: "calc(100% - 48px)",
            borderRadius: 20,
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.125rem",
          fontWeight: 700,
          padding: "20px 24px 12px",
          "@media (max-width:600px)": {
            padding: "18px 20px 10px",
            fontSize: "1.0625rem",
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "8px 24px 16px",
          "@media (max-width:600px)": {
            padding: "8px 20px 12px",
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 24px 20px",
          gap: 8,
          "@media (max-width:600px)": {
            padding: "10px 20px 18px",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            transition: "box-shadow 0.18s ease",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0,27,63,0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#001B3F",
              borderWidth: "2px",
            },
            "&.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(0,27,63,0.08)",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#001B3F",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: "0.8125rem",
          height: 30,
          "@media (max-width:600px)": {
            height: 34,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: "all 0.18s ease",
          "@media (max-width:600px)": {
            padding: 10,
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 60,
          backgroundColor: "rgba(255,255,255,0.96)",
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 56,
          padding: "6px 0",
          color: "#919EAB",
          "&.Mui-selected": {
            color: "#001B3F",
          },
          "& .MuiBottomNavigationAction-label": {
            fontSize: "0.6875rem",
            fontWeight: 500,
            "&.Mui-selected": {
              fontSize: "0.6875rem",
              fontWeight: 700,
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          margin: "2px 4px",
          "@media (max-width:600px)": {
            minHeight: 50,
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          "@media (max-width:600px)": {
            fontSize: "1.625rem",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0,0,0,0.07)",
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme, { factor: 2 });

const ClientLayout = memo(({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
});

ClientLayout.displayName = "ClientLayout";

export default ClientLayout;
