"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  List,
  ListItem,
  Divider,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  Badge,
  Menu,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { formatTimestamp } from "../utils/formatters";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { reviewsService } from "../services/reviewsService";
import { ReviewReply } from "./ReviewReply";
import DeleteIcon from "@mui/icons-material/Delete";
import { userTrackingService } from "../services/userTrackingService";
import { contentModerationService } from "../services/contentModerationService";

export const ViewReviewsModal = ({ open, onClose, userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterProfessor, setFilterProfessor] = useState("all");
  const [userReactions, setUserReactions] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState({});
  const [editingReply, setEditingReply] = useState({
    reviewId: null,
    replyIndex: null,
  });
  const [migrationStatus, setMigrationStatus] = useState({
    done: false,
    count: 0,
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const reviewsRef = collection(db, "reviews");
    // Create a query that orders reviews by timestamp
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setReviews(reviewsData);
      setLoading(false);
    });

    // Migrate any old reaction formats to new format, but only once
    const migrateReactions = async () => {
      // Check if migration already ran in this session
      const migrationRan = sessionStorage.getItem("reactionsMigrated");
      if (migrationRan === "true") {
        console.log(
          "Reactions migration already ran in this session, skipping"
        );
        return;
      }

      try {
        setLoading(true); // Keep loading state while migration runs
        console.log("Starting reactions migration...");
        const count = await reviewsService.migrateReactionsFormat();
        setMigrationStatus({ done: true, count });
        // Mark migration as complete for this session
        sessionStorage.setItem("reactionsMigrated", "true");
      } catch (error) {
        console.error("Error migrating reactions:", error);
      } finally {
        setLoading(false);
      }
    };

    migrateReactions();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storedReactions = localStorage.getItem("userReactions");
    if (storedReactions) {
      try {
        setUserReactions(JSON.parse(storedReactions));
      } catch (e) {
        console.error("Error parsing user reactions:", e);
        setUserReactions({});
      }
    }
  }, []);

  useEffect(() => {
    // When migration status changes and is done with count > 0, show the snackbar
    if (migrationStatus.done && migrationStatus.count > 0) {
      setSnackbarOpen(true);
    }
  }, [migrationStatus]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Get unique subjects and professors for filter dropdowns
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(
      reviews?.map((review) => review.subject) || []
    );
    return ["all", ...Array.from(uniqueSubjects)].sort();
  }, [reviews]);

  const professors = useMemo(() => {
    const uniqueProfessors = new Set(
      reviews?.map((review) => review.professor) || []
    );
    return ["all", ...Array.from(uniqueProfessors)].sort();
  }, [reviews]);

  // Calculate average ratings by professor and department
  const professorStats = useMemo(() => {
    const stats = {};
    reviews.forEach((review) => {
      if (!review.professor || !review.subject || !review.stars) return;

      if (!stats[review.professor]) {
        stats[review.professor] = {
          totalRating: 0,
          count: 0,
          department: review.subject,
          reviews: [],
        };
      }

      stats[review.professor].totalRating += review.stars;
      stats[review.professor].count += 1;
      stats[review.professor].reviews.push(review);
    });

    // Calculate averages and sort
    return Object.entries(stats)
      .map(([professor, data]) => ({
        professor,
        department: data.department,
        averageRating: data.totalRating / data.count,
        reviewCount: data.count,
        reviews: data.reviews,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);
  }, [reviews]);

  // Filtered and searched reviews with department/subject awareness
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Basic text search across all fields
      const searchText = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        [review.professor, review.subject, review.review].some((field) =>
          (field || "").toLowerCase().includes(searchText)
        );

      // Department/Subject filter
      const matchesSubject =
        filterSubject === "all" || review.subject === filterSubject;

      // Rating filter
      const matchesRating =
        filterRating === "all" || review.stars === Number(filterRating);

      // Professor filter
      const matchesProfessor =
        filterProfessor === "all" || review.professor === filterProfessor;

      return (
        matchesSearch && matchesSubject && matchesRating && matchesProfessor
      );
    });
  }, [reviews, searchTerm, filterSubject, filterRating, filterProfessor]);

  // Group reviews by professor with sorting by average rating
  const groupedReviews = useMemo(() => {
    const groups = {};
    const professorAverages = {};

    // First pass: calculate averages
    filteredReviews.forEach((review) => {
      if (!professorAverages[review.professor]) {
        professorAverages[review.professor] = {
          total: 0,
          count: 0,
        };
      }
      professorAverages[review.professor].total += review.stars;
      professorAverages[review.professor].count += 1;
    });

    // Second pass: group reviews
    filteredReviews.forEach((review) => {
      if (!groups[review.professor]) {
        groups[review.professor] = [];
      }
      groups[review.professor].push(review);
    });

    // Sort professors by average rating
    return Object.fromEntries(
      Object.entries(groups).sort(([profA, reviewsA], [profB, reviewsB]) => {
        const avgA =
          professorAverages[profA].total / professorAverages[profA].count;
        const avgB =
          professorAverages[profB].total / professorAverages[profB].count;
        return avgB - avgA; // Sort in descending order
      })
    );
  }, [filteredReviews]);

  const hasUserReacted = (reviewId, reactionType) => {
    const review = reviews.find((r) => r.id === reviewId);
    // Ensure reactions and the specific reaction type exist and are arrays
    return (
      Array.isArray(review?.reactions?.[reactionType]) &&
      review.reactions[reactionType].includes(userId)
    );
  };

  const handleReaction = async (reviewId, reactionType) => {
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      const review = reviews.find((r) => r.id === reviewId);

      // Initialize reactions object if it doesn't exist
      const currentReactions = review?.reactions || {};

      // Initialize the specific reaction type array if it doesn't exist
      if (!Array.isArray(currentReactions[reactionType])) {
        currentReactions[reactionType] = [];
      }

      const hasReacted = currentReactions[reactionType].includes(userId);

      if (hasReacted) {
        await reviewsService.removeReaction(reviewId, reactionType, userId);
      } else {
        await reviewsService.addReaction(reviewId, reactionType, userId);
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
      alert("Failed to update reaction");
    }
  };

  const canModifyReview = (review) => {
    return review.userId === userId;
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewsService.deleteReview(reviewId, userId);
        // The reviews will update automatically through the onSnapshot listener
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleDeleteReply = async (reviewId, replyIndex) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await reviewsService.deleteReply(reviewId, replyIndex, userId);
        // The replies will update automatically through the onSnapshot listener
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleAddReply = async (reviewId) => {
    if (!replyContent[reviewId]?.trim()) return;

    try {
      // Content moderation check
      const moderationResult = await contentModerationService.moderateContent(
        replyContent[reviewId]
      );
      if (!moderationResult.isValid) {
        alert(moderationResult.issues.join(". "));
        return;
      }

      await reviewsService.addReply(
        reviewId,
        {
          content: moderationResult.sanitizedText,
        },
        userId
      );

      setReplyContent((prev) => ({
        ...prev,
        [reviewId]: "",
      }));
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply");
    }
  };

  const handleEditReply = async (reviewId, replyIndex, newContent) => {
    try {
      // Content moderation check
      const moderationResult = await contentModerationService.moderateContent(
        newContent
      );
      if (!moderationResult.isValid) {
        alert(moderationResult.issues.join(". "));
        return;
      }

      await reviewsService.editReply(
        reviewId,
        replyIndex,
        moderationResult.sanitizedText,
        userId
      );
    } catch (error) {
      console.error("Error editing reply:", error);
      alert(error.message);
    }
  };

  const canDeleteReview = (review) => {
    return review.userId === userId;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 1, sm: 2 },
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: { xs: 1, sm: 2 },
          pt: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            mb: { xs: 2, sm: 3 },
            fontSize: { xs: "1.2rem", sm: "1.35rem", md: "1.5rem" },
            fontWeight: 600,
          }}
        >
          Anonymous Reviews
        </Typography>
        <Grid
          container
          spacing={{ xs: 1, sm: 2 }}
          sx={{
            flexDirection: { xs: "column", md: "row" },
            "& .MuiFormControl-root": { mb: { xs: 1, md: 0 } },
          }}
        >
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search professors, subjects, or reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: { xs: 1, md: 0 },
                "& .MuiInputBase-root": {
                  height: { xs: 40, sm: 44 },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  height: { xs: 40, sm: 44 },
                },
              }}
            >
              <InputLabel>Professor</InputLabel>
              <Select
                value={filterProfessor}
                label="Professor"
                onChange={(e) => setFilterProfessor(e.target.value)}
              >
                {professors.map((professor) => (
                  <MenuItem key={professor} value={professor}>
                    {professor === "all" ? "All Professors" : professor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  height: { xs: 40, sm: 44 },
                },
              }}
            >
              <InputLabel>Subject</InputLabel>
              <Select
                value={filterSubject}
                label="Subject"
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject === "all" ? "All Subjects" : subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-root": {
                  height: { xs: 40, sm: 44 },
                },
              }}
            >
              <InputLabel>Rating</InputLabel>
              <Select
                value={filterRating}
                label="Rating"
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <MenuItem value="all">All Ratings</MenuItem>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <MenuItem key={rating} value={rating}>
                    {rating} Stars
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <List sx={{ p: 0 }}>
          {Object.entries(groupedReviews).length === 0 ? (
            <Typography variant="body1" sx={{ p: 2, textAlign: "center" }}>
              No reviews match your search criteria.
            </Typography>
          ) : (
            Object.entries(groupedReviews).map(
              ([professor, professorReviews]) => (
                <Box key={professor} sx={{ mb: { xs: 3, sm: 4 } }}>
                  <Typography
                    variant="h6"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      p: { xs: 1, sm: 1.5 },
                      px: { xs: 1.5, sm: 2 },
                      borderRadius: 1,
                      fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                      fontWeight: 500,
                    }}
                  >
                    {professor}
                  </Typography>
                  {professorReviews.map((review, index) => (
                    <Box
                      key={index}
                      sx={{
                        ml: { xs: 0, sm: 2 },
                        mt: 1,
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 1,
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <ListItem
                        sx={{ px: { xs: 0, sm: 1 }, py: { xs: 0.5, sm: 1 } }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              justifyContent: "space-between",
                              alignItems: { xs: "flex-start", sm: "center" },
                              gap: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                            >
                              {review.subject}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                            >
                              {formatTimestamp(new Date(review.createdAt))}
                            </Typography>
                          </Box>
                          <Rating
                            value={review.stars}
                            readOnly
                            size={isMobile ? "small" : "medium"}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              mt: 1,
                              lineHeight: 1.6,
                              fontSize: { xs: "0.9rem", sm: "1rem" },
                            }}
                          >
                            {review.review}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            {review.replies?.map((reply, replyIndex) => (
                              <ReviewReply
                                key={replyIndex}
                                review={review}
                                reply={reply}
                                index={replyIndex}
                                userId={userId}
                                onDelete={handleDeleteReply}
                                onEdit={handleEditReply}
                              />
                            ))}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <TextField
                              size="small"
                              placeholder="Add a reply..."
                              value={replyContent[review.id] || ""}
                              onChange={(e) =>
                                setReplyContent((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value,
                                }))
                              }
                              sx={{
                                flex: 1,
                                "& .MuiInputBase-root": {
                                  height: { xs: 38, sm: 40 },
                                },
                              }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAddReply(review.id)}
                              sx={{
                                height: { xs: 38, sm: 40 },
                                minWidth: { xs: "100%", sm: "auto" },
                              }}
                            >
                              Reply
                            </Button>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Box
                              sx={{ display: "flex", gap: { xs: 0.5, sm: 1 } }}
                            >
                              <IconButton
                                size={isMobile ? "small" : "medium"}
                                onClick={() =>
                                  handleReaction(review.id, "thumbsUp")
                                }
                                color={
                                  hasUserReacted(review.id, "thumbsUp")
                                    ? "primary"
                                    : "default"
                                }
                                sx={{ padding: { xs: 0.5, sm: 1 } }}
                              >
                                <Badge
                                  badgeContent={
                                    Array.isArray(review.reactions?.thumbsUp)
                                      ? review.reactions.thumbsUp.length
                                      : 0
                                  }
                                  color="primary"
                                >
                                  <ThumbUpIcon
                                    fontSize={isMobile ? "small" : "medium"}
                                  />
                                </Badge>
                              </IconButton>
                              <IconButton
                                size={isMobile ? "small" : "medium"}
                                onClick={() =>
                                  handleReaction(review.id, "thumbsDown")
                                }
                                color={
                                  hasUserReacted(review.id, "thumbsDown")
                                    ? "primary"
                                    : "default"
                                }
                                sx={{ padding: { xs: 0.5, sm: 1 } }}
                              >
                                <Badge
                                  badgeContent={
                                    Array.isArray(review.reactions?.thumbsDown)
                                      ? review.reactions.thumbsDown.length
                                      : 0
                                  }
                                  color="primary"
                                >
                                  <ThumbDownIcon
                                    fontSize={isMobile ? "small" : "medium"}
                                  />
                                </Badge>
                              </IconButton>
                            </Box>
                            {canModifyReview(review) && (
                              <IconButton
                                size={isMobile ? "small" : "medium"}
                                onClick={(e) => {
                                  setAnchorEl(e.currentTarget);
                                  setSelectedReview(review);
                                }}
                                sx={{ ml: "auto" }}
                              >
                                <MoreVertIcon
                                  fontSize={isMobile ? "small" : "medium"}
                                />
                              </IconButton>
                            )}
                            {canDeleteReview(review) && (
                              <IconButton
                                onClick={() => handleDeleteReview(review.id)}
                                size="small"
                                sx={{
                                  ml: 1,
                                  color: "error.main",
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                      {index < professorReviews.length - 1 && (
                        <Divider sx={{ my: { xs: 1, sm: 1.5 } }} />
                      )}
                    </Box>
                  ))}
                </Box>
              )
            )
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: { xs: 80, sm: 100 },
            height: { xs: 36, sm: 40 },
          }}
        >
          Close
        </Button>
      </DialogActions>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 0.5,
            boxShadow: 3,
            minWidth: 120,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleDeleteReview(selectedReview.id);
            setAnchorEl(null);
          }}
          sx={{ py: { xs: 1, sm: 1.5 } }}
        >
          Delete
        </MenuItem>
      </Menu>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {`Updated ${migrationStatus.count} reviews to a new format. You should now see reactions displayed correctly.`}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
