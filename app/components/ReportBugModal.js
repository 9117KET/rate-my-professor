import React, { useState, useRef } from "react";
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
  Divider,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Image from "next/image";
import BugReportIcon from "@mui/icons-material/BugReport";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { bugReportService } from "../services/bugReportService";

/**
 * Modal component for reporting bugs and issues
 * Allows users to submit detailed bug reports with contextual information
 *
 * @param {boolean} open - Whether the modal is open
 * @param {function} onClose - Handler for closing the modal
 */
export const ReportBugModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [issueType, setIssueType] = useState("bug");
  const [description, setDescription] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState("");
  const [screenshotData, setScreenshotData] = useState(null);
  const fileInputRef = useRef(null);

  // Get issue types from the service
  const issueTypes = bugReportService.getIssueTypes();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setError("Please provide a description of the issue");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Prepare the report data
      const reportData = {
        issueType,
        description,
        stepsToReproduce: stepsToReproduce.trim() || null,
        expectedBehavior: expectedBehavior.trim() || null,
        email: email.trim() || null,
        includeSystemInfo: true, // Always include system info
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        url: window.location.href,
        timestamp: new Date().toISOString(),
        screenshot: screenshotData,
      };

      // Send the bug report to our API endpoint
      const response = await fetch("/api/report-bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to submit report";
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setReportId(result.reportId || "");
      setSubmitted(true);

      // Reset form after successful submission
      setIssueType("bug");
      setDescription("");
      setStepsToReproduce("");
      setExpectedBehavior("");
      setEmail("");
      setScreenshotData(null);
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

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.match("image.*")) {
      setError("Please upload an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
            {reportId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Report ID: {reportId}
              </Typography>
            )}
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
              {issueTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
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
              placeholder="Please describe the issue in detail. What happened? What were you trying to do?"
              helperText="Provide as much detail as possible to help us address the issue"
            />

            <Accordion
              sx={{
                mt: 2,
                mb: 1,
                boxShadow: "none",
                border: "1px solid rgba(0,0,0,0.12)",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Advanced Details (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  label="Steps to Reproduce"
                  multiline
                  rows={3}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="1. Go to...\n2. Click on...\n3. Observe that..."
                  helperText="List the steps needed to reproduce this issue"
                />

                <TextField
                  label="Expected Behavior"
                  multiline
                  rows={2}
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="What did you expect to happen instead?"
                />

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screenshot
                    <Tooltip title="A screenshot can help us understand the issue better">
                      <IconButton size="small" sx={{ ml: 0.5, mt: -0.5 }}>
                        <HelpOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Typography>

                  {screenshotData ? (
                    <Box sx={{ mt: 1, position: "relative", maxWidth: 400 }}>
                      <Image
                        src={screenshotData}
                        alt="Screenshot"
                        width={400}
                        height={200}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 200,
                          objectFit: "contain",
                          border: "1px solid rgba(0,0,0,0.12)",
                        }}
                        unoptimized={true}
                      />
                      <Button
                        size="small"
                        onClick={removeScreenshot}
                        variant="outlined"
                        sx={{ mt: 1 }}
                      >
                        Remove Screenshot
                      </Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" size="small">
                      Upload Screenshot
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                      />
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 2 }} />

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
