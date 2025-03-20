import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";

export const ReportBugModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [issueType, setIssueType] = useState("bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please provide a description of the issue");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Send the bug report to our API endpoint
      const response = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          description,
          email: email.trim() || null,
          userAgent: navigator.userAgent,
          screenSize: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          url: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to submit report";
        throw new Error(errorMessage);
      }

      await response.json(); // Parse the response
      setSubmitted(true);

      // Reset form after successful submission
      setIssueType("bug");
      setDescription("");
      setEmail("");
    } catch (err) {
      console.error("Error submitting bug report:", err);
      setError(
        err.message || "Failed to submit report. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset state when modal is closed
      setTimeout(() => {
        setSubmitted(false);
        setError("");
      }, 300);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: { xs: 1, sm: 2 },
          mx: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "100%" },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 1, sm: 2 },
          pt: { xs: 2, sm: 2 },
          pb: { xs: 1, sm: 1 },
          fontWeight: 600,
        }}
      >
        <BugReportIcon color="secondary" />
        Report an Issue
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
        {submitted ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Thank You for Your Feedback!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Your report has been submitted successfully. We appreciate your
              help in improving our platform.
            </Typography>
            <Button variant="contained" onClick={handleClose} sx={{ mt: 3 }}>
              Close
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              select
              label="Issue Type"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
            >
              <MenuItem value="bug">Bug or Error</MenuItem>
              <MenuItem value="feature">Feature Request</MenuItem>
              <MenuItem value="content">Content Issue</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            <TextField
              label="Description"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              placeholder="Please describe the issue in detail. Include steps to reproduce if applicable."
              helperText="Provide as much detail as possible to help us address the issue"
            />

            <TextField
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              placeholder="Optional: Leave your email if you would like us to follow up"
              helperText="We'll only use this to contact you about this specific issue"
            />
          </Box>
        )}
      </DialogContent>

      {!submitted && (
        <DialogActions
          sx={{ px: { xs: 1, sm: 2 }, pb: { xs: 2, sm: 2 }, pt: 1 }}
        >
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
