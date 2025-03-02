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
} from "@mui/material";
import { reviewsService } from "../services/reviewsService";

export const SubmitReviewModal = ({ open, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    professor: "",
    subject: "",
    stars: 0,
    review: "",
  });
  const [userIp, setUserIp] = useState(null);

  useEffect(() => {
    fetch("/api/getIp")
      .then((res) => res.json())
      .then((data) => setUserIp(data.ip));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userIp) {
      alert("Unable to submit review at this time. Please try again later.");
      return;
    }
    if (!formData.professor.trim()) {
      alert("Please provide either a professor name or description");
      return;
    }
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
      await reviewsService.addReview(formData, userIp);
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
              size={window.innerWidth < 600 ? "medium" : "large"}
            />
          </Box>
          <TextField
            fullWidth
            label="Review"
            multiline
            rows={window.innerWidth < 600 ? 3 : 4}
            value={formData.review}
            onChange={(e) =>
              setFormData({ ...formData, review: e.target.value })
            }
            required
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
