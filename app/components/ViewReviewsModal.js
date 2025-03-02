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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { formatTimestamp } from "../utils/formatters";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { reviewsService } from "../services/reviewsService";
import { ReviewReply } from "./ReviewReply";

export const ViewReviewsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [userReactions, setUserReactions] = useState({});
  const [userIp, setUserIp] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState({});

  useEffect(() => {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toString(),
      }));
      setReviews(reviewsData);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  useEffect(() => {
    // Fetch user's IP address
    fetch("/api/getIp")
      .then((res) => res.json())
      .then((data) => setUserIp(data.ip))
      .catch((error) => console.error("Error fetching IP:", error));
  }, []);

  // Load user reactions from localStorage only after component mounts
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

  // Get unique subjects for filter dropdown
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(
      reviews?.map((review) => review.subject) || []
    );
    return ["all", ...Array.from(uniqueSubjects)].sort();
  }, [reviews]);

  // Filtered and searched reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        (review.professor?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (review.subject?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (review.review?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      const matchesSubject =
        filterSubject === "all" || review.subject === filterSubject;

      const matchesRating =
        filterRating === "all" || review.stars === Number(filterRating);

      return matchesSearch && matchesSubject && matchesRating;
    });
  }, [reviews, searchTerm, filterSubject, filterRating]);

  // Group reviews by professor
  const groupedReviews = useMemo(() => {
    const groups = {};
    filteredReviews.forEach((review) => {
      if (!groups[review.professor]) {
        groups[review.professor] = [];
      }
      groups[review.professor].push(review);
    });
    return groups;
  }, [filteredReviews]);

  const hasUserReacted = (reviewId, reactionType) => {
    return userReactions[`${reviewId}_${reactionType}`];
  };

  const handleReaction = async (reviewId, reactionType) => {
    const reactionKey = `${reviewId}_${reactionType}`;
    try {
      if (!userReactions[reactionKey]) {
        // Add reaction
        await reviewsService.addReaction(reviewId, reactionType);
        setUserReactions((prev) => {
          const newReactions = { ...prev, [reactionKey]: true };
          localStorage.setItem("userReactions", JSON.stringify(newReactions));
          return newReactions;
        });

        // Update the UI for adding reaction
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              return {
                ...review,
                reactions: {
                  ...review.reactions,
                  [reactionType]: (review.reactions?.[reactionType] || 0) + 1,
                },
              };
            }
            return review;
          })
        );
      } else {
        // Remove reaction
        await reviewsService.removeReaction(reviewId, reactionType);
        setUserReactions((prev) => {
          const newReactions = { ...prev };
          delete newReactions[reactionKey];
          localStorage.setItem("userReactions", JSON.stringify(newReactions));
          return newReactions;
        });

        // Update the UI for removing reaction
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              return {
                ...review,
                reactions: {
                  ...review.reactions,
                  [reactionType]: Math.max(
                    (review.reactions?.[reactionType] || 0) - 1,
                    0
                  ),
                },
              };
            }
            return review;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      alert("Failed to toggle reaction");
    }
  };

  const canModifyReview = (review) => {
    if (!review.ipAddress || !userIp) return false;

    const createdAt = new Date(review.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

    return hoursDiff <= 24 && review.ipAddress === userIp;
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewsService.deleteReview(reviewId, userIp);
        // The reviews will update automatically through the onSnapshot listener
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleDeleteReply = async (reviewId, replyIndex) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await reviewsService.deleteReply(reviewId, replyIndex, userIp);
        // The replies will update automatically through the onSnapshot listener
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleAddReply = async (reviewId) => {
    if (!replyContent[reviewId]?.trim()) return;

    try {
      await reviewsService.addReply(
        reviewId,
        {
          content: replyContent[reviewId],
        },
        userIp
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
      await reviewsService.editReply(reviewId, replyIndex, newContent, userIp);
    } catch (error) {
      console.error("Error editing reply:", error);
      alert(error.message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1, sm: 2 },
          width: { xs: "95%", sm: "90%", md: "80%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
          borderRadius: { xs: 1, sm: 2 },
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
                                userIp={userIp}
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
                                  badgeContent={review.reactions?.thumbsUp || 0}
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
                                    review.reactions?.thumbsDown || 0
                                  }
                                  color="primary"
                                >
                                  <ThumbDownIcon
                                    fontSize={isMobile ? "small" : "medium"}
                                  />
                                </Badge>
                              </IconButton>
                              <IconButton
                                size={isMobile ? "small" : "medium"}
                                onClick={() =>
                                  handleReaction(review.id, "love")
                                }
                                color={
                                  hasUserReacted(review.id, "love")
                                    ? "secondary"
                                    : "default"
                                }
                                sx={{ padding: { xs: 0.5, sm: 1 } }}
                              >
                                <Badge
                                  badgeContent={review.reactions?.love || 0}
                                  color="secondary"
                                >
                                  <FavoriteIcon
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
    </Dialog>
  );
};
