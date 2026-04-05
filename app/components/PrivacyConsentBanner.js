"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Slide,
  Link,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { userTrackingService } from "../services/userTrackingService";

export const PrivacyConsentBanner = ({ onPrivacyClick, onConsent }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Only show the banner if the user has never made a decision (no record at all).
    // If they previously accepted OR declined, respect that choice and don't show again.
    const consent = userTrackingService.getPrivacyConsent();
    if (!consent) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    userTrackingService.setPrivacyConsent(true);
    setOpen(false);
    if (onConsent) onConsent();
  };

  // Decline: saves the decision so the banner never re-appears, but still allows full use.
  // Chat history will not be saved server-side when consent is false.
  const handleDecline = () => {
    userTrackingService.setPrivacyConsent(false);
    setOpen(false);
    if (onConsent) onConsent();
  };

  if (!open) return null;

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={4}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: { xs: 2, sm: 2.5 },
          mx: { xs: 1.5, sm: "auto" },
          mb: { xs: "calc(78px + env(safe-area-inset-bottom))", sm: 2 },
          borderRadius: "16px",
          bgcolor: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          maxWidth: { sm: "520px" },
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
            We value your privacy
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
            We store an anonymous ID in your browser to power reviews, rate limiting, and chat history.
            We do not collect your name, email, or any identifying information unless you provide it
            voluntarily (e.g. in a bug report). By clicking <strong>Accept</strong>, you consent to our{" "}
            <Link
              component="button"
              variant="body2"
              onClick={onPrivacyClick}
              sx={{ fontSize: "0.8rem", fontWeight: 600 }}
            >
              Privacy Policy
            </Link>
            .
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 0.5,
              flexDirection: isMobile ? "column-reverse" : "row",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleDecline}
              size="small"
              fullWidth={isMobile}
              sx={{ borderRadius: "10px", fontWeight: 600 }}
            >
              Essential only
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAccept}
              size="small"
              fullWidth={isMobile}
              sx={{ borderRadius: "10px", fontWeight: 700 }}
            >
              Accept all
            </Button>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};
