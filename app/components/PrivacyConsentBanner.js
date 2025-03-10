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

export const PrivacyConsentBanner = ({ onPrivacyClick }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Check if user has already consented
    const consent = userTrackingService.getPrivacyConsent();
    if (!consent || !consent.consented) {
      // Show banner if no consent found
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    userTrackingService.setPrivacyConsent(true);
    setOpen(false);
  };

  const handleViewPrivacy = () => {
    if (onPrivacyClick) {
      onPrivacyClick();
    }
  };

  if (!open) return null;

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: { xs: 2, sm: 3 },
          m: { xs: 1, sm: 2 },
          borderRadius: 2,
          bgcolor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
          maxWidth: { sm: "600px", md: "800px" },
          mx: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Privacy Notice
        </Typography>
        <Typography variant="body2" paragraph>
          We use cookies and local storage to improve your experience and
          collect anonymous usage data. We store your reviews, reactions, and
          replies with an anonymous ID that doesn&apos;t identify you personally.
        </Typography>
        <Typography variant="body2" paragraph>
          By clicking &quot;Accept&quot;, you consent to our data practices as described
          in our{" "}
          <Link
            component="button"
            variant="body2"
            onClick={handleViewPrivacy}
            sx={{ textDecoration: "underline" }}
          >
            Privacy Policy
          </Link>
          . You can manage or delete your data at any time from the &quot;My Data&quot;
          section.
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 2,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={handleViewPrivacy}
            fullWidth={isMobile}
          >
            View Privacy Policy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAccept}
            fullWidth={isMobile}
          >
            Accept
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
};
