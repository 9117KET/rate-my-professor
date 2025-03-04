"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { reviewsService } from "../services/reviewsService";

export const SubmitReviewModal = ({ open, onClose, onSubmit, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [formData, setFormData] = useState({
    professor: "",
    subject: "",
    stars: 0,
    review: "",
  });
  const [userIp, setUserIp] = useState(null);
  const [reviewError, setReviewError] = useState("");

  // Character limits
  const MIN_REVIEW_LENGTH = 50;
  const MAX_REVIEW_LENGTH = 1000;
  const MIN_PROFESSOR_LENGTH = 3;
  const MAX_PROFESSOR_LENGTH = 100;
  const MIN_SUBJECT_LENGTH = 2;
  const MAX_SUBJECT_LENGTH = 50;

  useEffect(() => {
    fetch("/api/getIp")
      .then((res) => res.json())
      .then((data) => setUserIp(data.ip));
  }, []);

  const validateReview = (review) => {
    // Check for minimum length
    if (review.length < MIN_REVIEW_LENGTH) {
      return `Review must be at least ${MIN_REVIEW_LENGTH} characters long`;
    }

    // Check for maximum length
    if (review.length > MAX_REVIEW_LENGTH) {
      return `Review cannot exceed ${MAX_REVIEW_LENGTH} characters`;
    }

    // Check for meaningful content (at least 3 words)
    const words = review.trim().split(/\s+/);
    if (words.length < 3) {
      return "Review must contain at least 3 words";
    }

    // Check for repetitive characters
    const repetitivePattern = /(.)\1{4,}/;
    if (repetitivePattern.test(review)) {
      return "Review contains too many repetitive characters";
    }

    // Check for all caps
    if (review === review.toUpperCase() && review.length > 20) {
      return "Review cannot be in all capital letters";
    }

    // Check for gibberish/random characters
    const gibberishPatterns = [
      // Pattern for random consonant strings
      /[bcdfghjklmnpqrstvwxz]{5,}/i,
      // Pattern for random character sequences
      /([a-z])\1{2,}|(.)\2{2,}/i,
      // Pattern for lack of vowels in words
      /\b[^aeiou\s]{4,}\b/i,
      // Pattern for excessive consecutive consonants
      /[bcdfghjklmnpqrstvwxz]{4,}/i,
    ];

    for (const pattern of gibberishPatterns) {
      if (pattern.test(review)) {
        return "Review contains invalid or random text patterns. Please write a meaningful review.";
      }
    }

    // Check for word variety (prevent repetitive words)
    const wordFrequency = {};
    const normalizedWords = words.map((w) => w.toLowerCase());

    for (const word of normalizedWords) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      // If any word (except common words) is repeated too many times
      if (wordFrequency[word] > 3 && word.length > 3) {
        return "Review contains too many repeated words";
      }
    }

    // Check for reasonable word lengths (most real words are between 1-15 characters)
    const hasUnreasonableWords = words.some((word) => {
      const wordLength = word.length;
      return wordLength > 15 || (wordLength > 1 && !/[aeiou]/i.test(word));
    });

    if (hasUnreasonableWords) {
      return "Review contains unrealistic word patterns";
    }

    // Check for proper sentence structure (should contain at least one period, question mark, or exclamation point)
    if (review.length > 100 && !/[.!?]/.test(review)) {
      return "Please use proper punctuation in your review";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userIp) {
      alert("Unable to submit review at this time. Please try again later.");
      return;
    }

    // Validate professor name
    if (formData.professor.trim().length < MIN_PROFESSOR_LENGTH) {
      alert(
        `Professor name must be at least ${MIN_PROFESSOR_LENGTH} characters long`
      );
      return;
    }
    if (formData.professor.trim().length > MAX_PROFESSOR_LENGTH) {
      alert(`Professor name cannot exceed ${MAX_PROFESSOR_LENGTH} characters`);
      return;
    }

    // Validate subject
    if (formData.subject.trim().length < MIN_SUBJECT_LENGTH) {
      alert(`Subject must be at least ${MIN_SUBJECT_LENGTH} characters long`);
      return;
    }
    if (formData.subject.trim().length > MAX_SUBJECT_LENGTH) {
      alert(`Subject cannot exceed ${MAX_SUBJECT_LENGTH} characters`);
      return;
    }

    if (formData.stars === 0) {
      alert("Please provide a rating");
      return;
    }

    // Validate review
    const reviewError = validateReview(formData.review);
    if (reviewError) {
      setReviewError(reviewError);
      return;
    }

    try {
      await reviewsService.addReview(formData, userIp);
      onClose();
      setFormData({
        professor: "",
        subject: "",
        stars: 0,
        review: "",
      });
      setReviewError("");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleReviewChange = (e) => {
    const newReview = e.target.value;
    setFormData({ ...formData, review: newReview });
    setReviewError(validateReview(newReview));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1, sm: 2 },
          width: { xs: "95%", sm: "90%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
          borderRadius: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: { xs: 1, sm: 2 },
          pt: { xs: 2, sm: 3 },
          fontSize: { xs: "1.2rem", sm: "1.4rem" },
          fontWeight: 600,
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        Submit Anonymous Review
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: { xs: 1, sm: 2 },
            "& .MuiTextField-root": {
              mb: { xs: 1.5, sm: 2 },
            },
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Professor Name or Description"
            placeholder="e.g., 'Dr. Smith' or 'The Statistics prof with colorful bowties'"
            value={formData.professor}
            onChange={(e) =>
              setFormData({ ...formData, professor: e.target.value })
            }
            inputProps={{
              maxLength: MAX_PROFESSOR_LENGTH,
              minLength: MIN_PROFESSOR_LENGTH,
            }}
            helperText={`${formData.professor.length}/${MAX_PROFESSOR_LENGTH} characters`}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                height: { xs: "auto", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "1rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.9rem", sm: "1rem" },
              },
            }}
          />
          <TextField
            fullWidth
            label="Subject"
            size="small"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
            inputProps={{
              maxLength: MAX_SUBJECT_LENGTH,
              minLength: MIN_SUBJECT_LENGTH,
            }}
            helperText={`${formData.subject.length}/${MAX_SUBJECT_LENGTH} characters`}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                height: { xs: "40px", sm: "44px" },
                fontSize: { xs: "0.9rem", sm: "1rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.9rem", sm: "1rem" },
              },
            }}
          />
          <Box sx={{ mb: { xs: 2, sm: 3 } }}>
            <Typography
              component="legend"
              sx={{
                mb: 0.5,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                fontWeight: 500,
              }}
            >
              Rating
            </Typography>
            <Rating
              value={formData.stars}
              onChange={(_, value) =>
                setFormData({ ...formData, stars: value })
              }
              size={isMobile ? "medium" : "large"}
            />
          </Box>
          <TextField
            fullWidth
            label="Review"
            multiline
            rows={isMobile ? 3 : 4}
            value={formData.review}
            onChange={handleReviewChange}
            required
            error={!!reviewError}
            helperText={
              reviewError ||
              `${formData.review.length}/${MAX_REVIEW_LENGTH} characters (minimum ${MIN_REVIEW_LENGTH})`
            }
            inputProps={{
              maxLength: MAX_REVIEW_LENGTH,
              minLength: MIN_REVIEW_LENGTH,
            }}
            sx={{
              "& .MuiInputBase-root": {
                fontSize: { xs: "0.9rem", sm: "1rem" },
                lineHeight: 1.6,
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.9rem", sm: "1rem" },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 2 },
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: { xs: 40, sm: 44 },
            minWidth: { xs: "100%", sm: 100 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            order: { xs: 2, sm: 1 },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            height: { xs: 40, sm: 44 },
            minWidth: { xs: "100%", sm: 120 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            order: { xs: 1, sm: 2 },
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
