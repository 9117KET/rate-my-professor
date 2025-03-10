"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  TextField,
  IconButton,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import WarningIcon from "@mui/icons-material/Warning";
import { userTrackingService } from "../services/userTrackingService";
import { reviewsService } from "../services/reviewsService";
import { formatTimestamp } from "../utils/formatters";
import { formatClientError, logClientError } from "../utils/clientErrorHandler";

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-data-tabpanel-${index}`}
      aria-labelledby={`user-data-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const UserDataManagementModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabValue, setTabValue] = useState(0);
  const [userReviews, setUserReviews] = useState([]);
  const [userReplies, setUserReplies] = useState([]);
  const [userReactions, setUserReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load user data
  useEffect(() => {
    if (!open) return;

    const loadUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get user ID
        const id = userTrackingService.getOrCreateUserId();
        setUserId(id);

        if (!id) {
          throw new Error("Unable to identify user");
        }

        // Load user content
        const userContent = await reviewsService.getUserContent(id);
        setUserReviews(userContent.reviews || []);
        setUserReplies(userContent.replies || []);
        setUserReactions(userContent.reactions || []);
      } catch (error) {
        logClientError(error, "load-user-data");
        setError(formatClientError(error));
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [open]);

  // Export user data as JSON
  const handleExportData = () => {
    try {
      setExportInProgress(true);

      // Prepare data for export
      const exportData = {
        userId: userId,
        exportDate: new Date().toISOString(),
        reviews: userReviews,
        replies: userReplies,
        reactions: userReactions,
      };

      // Convert to JSON and create download link
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
        dataStr
      )}`;

      // Create and trigger download
      const exportFileDefaultName = `rate-my-professor-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      setExportInProgress(false);
    } catch (error) {
      logClientError(error, "export-user-data");
      setError(formatClientError(error));
      setExportInProgress(false);
    }
  };

  // Delete all user data
  const handleDeleteAllData = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setDeleteInProgress(true);
    setError(null);

    try {
      await reviewsService.deleteAllUserContent(userId);

      // Reset local storage
      userTrackingService.resetUserId();

      // Update state
      setUserReviews([]);
      setUserReplies([]);
      setUserReactions([]);
      setDeleteSuccess(true);

      // Generate new user ID
      const newId = userTrackingService.getOrCreateUserId();
      setUserId(newId);
    } catch (error) {
      logClientError(error, "delete-all-user-data");
      setError(formatClientError(error));
    } finally {
      setDeleteInProgress(false);
      setDeleteConfirmation("");
    }
  };

  // Delete a specific review
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsService.deleteReview(reviewId, userId);
      setUserReviews(userReviews.filter((review) => review.id !== reviewId));
    } catch (error) {
      logClientError(error, "delete-review", { reviewId });
      setError(formatClientError(error));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      aria-labelledby="user-data-management-title"
    >
      <DialogTitle
        id="user-data-management-title"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Typography variant="h6" component="h2">
          Your Data
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error && !deleteSuccess ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        ) : deleteSuccess ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            <AlertTitle>Success</AlertTitle>
            Your data has been successfully deleted. A new anonymous ID has been
            generated for you.
          </Alert>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="user data tabs"
              >
                <Tab label="My Content" id="user-data-tab-0" />
                <Tab label="Export Data" id="user-data-tab-1" />
                <Tab label="Delete Data" id="user-data-tab-2" />
              </Tabs>
            </Box>

            {/* My Content Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body2" paragraph>
                This is all the content associated with your anonymous user ID.
                You can view and manage your reviews, replies, and reactions
                here.
              </Typography>

              {userReviews.length === 0 &&
              userReplies.length === 0 &&
              userReactions.length === 0 ? (
                <Alert severity="info">
                  You haven&apos;t created any content yet.
                </Alert>
              ) : (
                <>
                  {/* Reviews Section */}
                  <Accordion defaultExpanded={userReviews.length > 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        Your Reviews ({userReviews.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {userReviews.length === 0 ? (
                        <Typography variant="body2">
                          You haven&apos;t submitted any reviews yet.
                        </Typography>
                      ) : (
                        <List>
                          {userReviews.map((review) => (
                            <React.Fragment key={review.id}>
                              <ListItem
                                alignItems="flex-start"
                                secondaryAction={
                                  <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() =>
                                      handleDeleteReview(review.id)
                                    }
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                }
                              >
                                <ListItemText
                                  primary={
                                    <>
                                      <Typography
                                        component="span"
                                        variant="subtitle1"
                                        color="text.primary"
                                      >
                                        {review.professor} - {review.subject}
                                      </Typography>
                                      <Chip
                                        label={`${review.stars}/5`}
                                        size="small"
                                        color={
                                          review.stars >= 4
                                            ? "success"
                                            : review.stars >= 3
                                            ? "warning"
                                            : "error"
                                        }
                                        sx={{ ml: 1 }}
                                      />
                                    </>
                                  }
                                  secondary={
                                    <>
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                      >
                                        {review.review}
                                      </Typography>
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                      >
                                        Posted:{" "}
                                        {formatTimestamp(review.createdAt)}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                              <Divider component="li" />
                            </React.Fragment>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Replies Section */}
                  <Accordion defaultExpanded={userReplies.length > 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        Your Replies ({userReplies.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {userReplies.length === 0 ? (
                        <Typography variant="body2">
                          You haven&apos;t replied to any reviews yet.
                        </Typography>
                      ) : (
                        <List>
                          {userReplies.map((reply) => (
                            <React.Fragment
                              key={`${reply.reviewId}-${reply.index}`}
                            >
                              <ListItem alignItems="flex-start">
                                <ListItemText
                                  primary={
                                    <Typography
                                      component="span"
                                      variant="subtitle2"
                                      color="text.primary"
                                    >
                                      Reply to review of {reply.professorName}
                                    </Typography>
                                  }
                                  secondary={
                                    <>
                                      <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                      >
                                        {reply.content}
                                      </Typography>
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        display="block"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                      >
                                        Posted:{" "}
                                        {formatTimestamp(reply.createdAt)}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                              <Divider component="li" />
                            </React.Fragment>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>

                  {/* Reactions Section */}
                  <Accordion defaultExpanded={userReactions.length > 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        Your Reactions ({userReactions.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {userReactions.length === 0 ? (
                        <Typography variant="body2">
                          You haven&apos;t reacted to any reviews yet.
                        </Typography>
                      ) : (
                        <List>
                          {userReactions.map((reaction) => (
                            <React.Fragment
                              key={`${reaction.reviewId}-${reaction.type}`}
                            >
                              <ListItem alignItems="flex-start">
                                <ListItemText
                                  primary={
                                    <Typography
                                      component="span"
                                      variant="subtitle2"
                                      color="text.primary"
                                    >
                                      {reaction.type === "thumbsUp"
                                        ? "👍 Liked"
                                        : "👎 Disliked"}{" "}
                                      a review of {reaction.professorName}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      display="block"
                                      color="text.secondary"
                                    >
                                      {formatTimestamp(reaction.timestamp)}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              <Divider component="li" />
                            </React.Fragment>
                          ))}
                        </List>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </>
              )}
            </TabPanel>

            {/* Export Data Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="body1" paragraph>
                You can export all your data in JSON format. This includes all
                your reviews, replies, and reactions.
              </Typography>

              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Data Export Summary
                </Typography>
                <Typography variant="body2" paragraph>
                  Your export will include:
                </Typography>
                <Box component="ul" sx={{ pl: 4 }}>
                  <li>
                    <Typography variant="body2">
                      {userReviews.length} reviews
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      {userReplies.length} replies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      {userReactions.length} reactions
                    </Typography>
                  </li>
                </Box>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportData}
                    disabled={exportInProgress}
                  >
                    {exportInProgress ? "Exporting..." : "Export My Data"}
                  </Button>
                </Box>
              </Paper>

              <Typography variant="body2" color="text.secondary">
                Note: The exported file will be in JSON format and will contain
                all data associated with your anonymous user ID.
              </Typography>
            </TabPanel>

            {/* Delete Data Tab */}
            <TabPanel value={tabValue} index={2}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Warning</AlertTitle>
                Deleting your data is permanent and cannot be undone. This will
                remove all your reviews, replies, and reactions from our system.
              </Alert>

              <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: "#fff9f9" }}>
                <Typography variant="h6" gutterBottom color="error">
                  Delete All My Data
                </Typography>
                <Typography variant="body2" paragraph>
                  This will permanently delete:
                </Typography>
                <Box component="ul" sx={{ pl: 4 }}>
                  <li>
                    <Typography variant="body2">
                      {userReviews.length} reviews
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      {userReplies.length} replies
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      {userReactions.length} reactions
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Your anonymous user ID
                    </Typography>
                  </li>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" paragraph>
                    To confirm, please type &quot;DELETE&quot; in the field below:
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAllData}
                    disabled={
                      deleteInProgress || deleteConfirmation !== "DELETE"
                    }
                    fullWidth
                  >
                    {deleteInProgress
                      ? "Deleting..."
                      : "Permanently Delete All My Data"}
                  </Button>
                </Box>
              </Paper>

              <Typography variant="body2" color="text.secondary">
                Note: After deletion, a new anonymous ID will be generated for
                you if you continue to use the site.
              </Typography>
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
