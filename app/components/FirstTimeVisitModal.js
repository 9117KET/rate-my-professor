"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { userTrackingService } from "../services/userTrackingService";
import { reviewsService } from "../services/reviewsService";

// Local storage key for tracking if the user has seen the first-time modal
const FIRST_VISIT_KEY = "rate_my_professor_first_visit_shown";

export const FirstTimeVisitModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRateNow = () => {
    // Open the review submission modal
    setShowReviewModal(true);
  };

  const handleSkip = () => {
    // Mark that the user has seen the first-time visit modal
    if (typeof window !== "undefined") {
      localStorage.setItem(FIRST_VISIT_KEY, "true");
    }
    onClose();
  };

  const handleReviewSubmit = async (reviewData) => {
    setIsSubmitting(true);

    try {
      // Mark that the user has seen the first-time visit modal
      if (typeof window !== "undefined") {
        localStorage.setItem(FIRST_VISIT_KEY, "true");
        // Also mark that user has submitted a review
        localStorage.setItem("has_submitted_review", "true");
      }

      // Use the reviewsService to save the review
      await reviewsService.addReview(reviewData);

      // Close both modals
      setShowReviewModal(false);
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      // Keep the modal open if there's an error
      setIsSubmitting(false);
    }
  };

  const handleReviewModalClose = () => {
    setShowReviewModal(false);
  };

  return (
    <>
      <Dialog
        open={open && !showReviewModal}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            pb: { xs: 1, sm: 1.5 },
            textAlign: "center",
          }}
        >
          Welcome to Rate My Professor!
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Share Your Experience
            </Typography>

            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              Help other students by rating a professor you&apos;ve had. Your
              input makes our community more valuable!
            </Typography>

            <Typography
              variant="body2"
              paragraph
              color="text.secondary"
              sx={{ mt: 2, fontStyle: "italic" }}
            >
              You can always rate more professors later or explore other
              reviews.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 2, sm: 3 },
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleRateNow}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Rate a Professor Now
          </Button>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={handleSkip}
            sx={{
              py: 1.5,
              fontSize: "1rem",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            I&apos;ll Do This Later
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review submission modal */}
      <SubmitReviewModal
        open={showReviewModal}
        onClose={handleReviewModalClose}
        onSubmit={handleReviewSubmit}
        loading={isSubmitting}
        disableClose={false}
      />
    </>
  );
};

// Helper function to check if this is the user's first visit
export const isFirstTimeVisit = () => {
  if (typeof window === "undefined") {
    return false;
  }

  // Check if user has a user ID but hasn't seen the first visit modal
  const hasUserId = !!userTrackingService.getOrCreateUserId();
  const hasSeenFirstVisit = localStorage.getItem(FIRST_VISIT_KEY) === "true";

  // Only consider it a first visit if they have a user ID, haven't seen the first visit modal,
  // and have already consented to privacy and seen the welcome modal
  const privacyConsent = userTrackingService.getPrivacyConsent();
  const hasSeenWelcome = localStorage.getItem("has_seen_welcome") === "true";

  return (
    hasUserId &&
    !hasSeenFirstVisit &&
    privacyConsent?.consented &&
    hasSeenWelcome
  );
};
