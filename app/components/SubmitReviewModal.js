"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { reviewsService } from "../services/reviewsService";

export const SubmitReviewModal = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    professor: "",
    subject: "",
    stars: 0,
    review: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.stars === 0) {
      alert("Please provide a rating");
      return;
    }
    if (!formData.subject) {
      alert("Please provide a subject");
      return;
    }
    if (!formData.review) {
      alert("Please provide a review");
      return;
    }
    try {
      await reviewsService.addReview({
        ...formData,
        professor: formData.professor || "Anonymous Professor",
      });
      onClose();
      setFormData({
        professor: "",
        subject: "",
        stars: 0,
        review: "",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
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
        },
      }}
    >
      <DialogTitle
        sx={{ pb: { xs: 1, sm: 2 }, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
      >
        Submit Anonymous Review
      </DialogTitle>
      <DialogContent>
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
            label="Describe the professor (optional) - pls do not state a professor's name"
            value={formData.professor}
            onChange={(e) =>
              setFormData({ ...formData, professor: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            required
            sx={{ mb: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={formData.stars}
              onChange={(_, value) =>
                setFormData({ ...formData, stars: value })
              }
            />
          </Box>
          <TextField
            fullWidth
            label="Review"
            multiline
            rows={4}
            value={formData.review}
            onChange={(e) =>
              setFormData({ ...formData, review: e.target.value })
            }
            required
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
