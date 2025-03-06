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
  Autocomplete,
  Chip,
} from "@mui/material";
import { reviewsService } from "../services/reviewsService";
import { validateText, REVIEW_LIMITS } from "../utils/textValidation";
import { PROFESSORS, getProfessorSuggestions } from "../utils/professorNames";
import { userTrackingService } from "../services/userTrackingService";

export const SubmitReviewModal = ({
  open,
  onClose,
  onSubmit,
  loading,
  disableClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [formData, setFormData] = useState({
    professor: "",
    subject: "",
    stars: 0,
    review: "",
  });
  const [reviewError, setReviewError] = useState("");
  const [professorError, setProfessorError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [professorSuggestions, setProfessorSuggestions] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const handleReviewChange = (e) => {
    const newReview = e.target.value;
    setFormData({ ...formData, review: newReview });
    setReviewError(
      validateText(newReview, {
        minLength: REVIEW_LIMITS.MIN_LENGTH,
        maxLength: REVIEW_LIMITS.MAX_LENGTH,
        type: "review",
      })
    );
  };

  const handleProfessorChange = (e, newValue) => {
    const newProfessor = newValue ? newValue.name : e.target.value || "";

    if (newValue) {
      const professorSubjects = newValue.subjects || [];
      setAvailableSubjects(professorSubjects);
      // Automatically set the first subject
      setFormData({
        ...formData,
        professor: newProfessor,
        subject: professorSubjects[0] || "",
      });
    } else {
      setAvailableSubjects([]);
      setFormData({
        ...formData,
        professor: newProfessor,
        subject: "",
      });
    }

    if (
      !newProfessor ||
      newProfessor.trim().length < REVIEW_LIMITS.MIN_PROFESSOR_LENGTH
    ) {
      setProfessorError(
        `Professor name must be at least ${REVIEW_LIMITS.MIN_PROFESSOR_LENGTH} characters long`
      );
    } else if (
      newProfessor.trim().length > REVIEW_LIMITS.MAX_PROFESSOR_LENGTH
    ) {
      setProfessorError(
        `Professor name cannot exceed ${REVIEW_LIMITS.MAX_PROFESSOR_LENGTH} characters`
      );
    } else {
      setProfessorError("");
    }
  };

  const handleProfessorInputChange = (e, newInputValue) => {
    const suggestions = getProfessorSuggestions(newInputValue);
    setProfessorSuggestions(suggestions);
  };

  const handleSubjectChange = (e, newValue) => {
    const newSubject = newValue || "";
    setFormData({ ...formData, subject: newSubject });
    if (newSubject.length < REVIEW_LIMITS.MIN_SUBJECT_LENGTH) {
      setSubjectError(
        `Subject must be at least ${REVIEW_LIMITS.MIN_SUBJECT_LENGTH} characters long`
      );
    } else if (newSubject.length > REVIEW_LIMITS.MAX_SUBJECT_LENGTH) {
      setSubjectError(
        `Subject cannot exceed ${REVIEW_LIMITS.MAX_SUBJECT_LENGTH} characters`
      );
    } else {
      setSubjectError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = userTrackingService.getOrCreateUserId();
    if (!userId) {
      alert("Unable to submit review at this time. Please try again later.");
      return;
    }

    // Validate professor name
    if (formData.professor.trim().length < REVIEW_LIMITS.MIN_PROFESSOR_LENGTH) {
      setProfessorError(
        `Professor name must be at least ${REVIEW_LIMITS.MIN_PROFESSOR_LENGTH} characters long`
      );
      return;
    }
    if (formData.professor.trim().length > REVIEW_LIMITS.MAX_PROFESSOR_LENGTH) {
      setProfessorError(
        `Professor name cannot exceed ${REVIEW_LIMITS.MAX_PROFESSOR_LENGTH} characters`
      );
      return;
    }

    // Validate subject
    if (formData.subject.trim().length < REVIEW_LIMITS.MIN_SUBJECT_LENGTH) {
      setSubjectError(
        `Subject must be at least ${REVIEW_LIMITS.MIN_SUBJECT_LENGTH} characters long`
      );
      return;
    }
    if (formData.subject.trim().length > REVIEW_LIMITS.MAX_SUBJECT_LENGTH) {
      setSubjectError(
        `Subject cannot exceed ${REVIEW_LIMITS.MAX_SUBJECT_LENGTH} characters`
      );
      return;
    }

    if (formData.stars === 0) {
      alert("Please provide a rating");
      return;
    }

    // Validate review
    const reviewError = validateText(formData.review.trim(), {
      minLength: REVIEW_LIMITS.MIN_LENGTH,
      maxLength: REVIEW_LIMITS.MAX_LENGTH,
      type: "review",
    });
    if (reviewError) {
      setReviewError(reviewError);
      return;
    }

    try {
      // Add userId to the review data
      const reviewWithUserId = {
        ...formData,
        userId: userId,
      };

      await reviewsService.addReview(reviewWithUserId);
      if (onSubmit) {
        await onSubmit(reviewWithUserId);
      }
      onClose();
      setFormData({
        professor: "",
        subject: "",
        stars: 0,
        review: "",
      });
      setReviewError("");
      setProfessorError("");
      setSubjectError("");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={disableClose ? undefined : onClose}
      maxWidth="sm"
      fullWidth
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
          pr: disableClose ? 2 : 6,
        }}
      >
        {disableClose ? "Submit Your First Review" : "Submit a Review"}
      </DialogTitle>
      {disableClose && (
        <Typography
          variant="subtitle1"
          sx={{
            px: 3,
            pb: 2,
            color: "text.secondary",
          }}
        >
          Now that you know how to use the platform, please submit your first
          review to access all features. This helps us maintain a valuable
          community of shared experiences.
        </Typography>
      )}
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Autocomplete
            freeSolo
            options={professorSuggestions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            value={formData.professor}
            onChange={handleProfessorChange}
            onInputChange={handleProfessorInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                size="small"
                label="Professor Name"
                placeholder="Start typing to search..."
                error={!!professorError}
                helperText={
                  professorError ||
                  `${formData.professor.length}/${REVIEW_LIMITS.MAX_PROFESSOR_LENGTH} characters`
                }
                inputProps={{
                  ...params.inputProps,
                  maxLength: REVIEW_LIMITS.MAX_PROFESSOR_LENGTH,
                  minLength: REVIEW_LIMITS.MIN_PROFESSOR_LENGTH,
                }}
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
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={typeof option === "string" ? option : option.name}
                />
              ))
            }
          />
          <Autocomplete
            options={availableSubjects}
            value={formData.subject}
            onChange={handleSubjectChange}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Subject"
                size="small"
                required
                error={!!subjectError}
                helperText={
                  subjectError ||
                  `${formData.subject.length}/${REVIEW_LIMITS.MAX_SUBJECT_LENGTH} characters`
                }
                inputProps={{
                  ...params.inputProps,
                  maxLength: REVIEW_LIMITS.MAX_SUBJECT_LENGTH,
                  minLength: REVIEW_LIMITS.MIN_SUBJECT_LENGTH,
                }}
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
            )}
          />
          <Box sx={{ mb: 2 }}>
            <Typography
              component="legend"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                mb: 1,
              }}
            >
              Rating
            </Typography>
            <Rating
              value={formData.stars}
              onChange={(e, newValue) => {
                setFormData({ ...formData, stars: newValue });
              }}
              size="large"
              sx={{
                "& .MuiRating-icon": {
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review"
            size="small"
            value={formData.review}
            onChange={handleReviewChange}
            required
            error={!!reviewError}
            helperText={
              reviewError ||
              `${formData.review.length}/${REVIEW_LIMITS.MAX_LENGTH} characters`
            }
            inputProps={{
              maxLength: REVIEW_LIMITS.MAX_LENGTH,
              minLength: REVIEW_LIMITS.MIN_LENGTH,
            }}
            sx={{
              mb: 2,
              "& .MuiInputBase-root": {
                fontSize: { xs: "0.9rem", sm: "1rem" },
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
          disabled={
            loading ||
            !!reviewError ||
            !!professorError ||
            !!subjectError ||
            !formData.review.trim() ||
            !formData.professor.trim() ||
            !formData.subject.trim() ||
            formData.stars === 0
          }
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
