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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export const ViewReviewsModal = ({ open, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterRating, setFilterRating] = useState("all");

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

  // Get unique subjects for filter dropdown
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(
      reviews?.map((review) => review.subject) || []
    );
    return ["all", ...Array.from(uniqueSubjects)].sort();
  }, [reviews]);

  // Filtered and searched reviews
  const filteredReviews = useMemo(() => {
    return (reviews || []).filter((review) => {
      const matchesSearch =
        review.professor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject =
        filterSubject === "all" || review.subject === filterSubject;
      const matchesRating =
        filterRating === "all" || review.stars === parseInt(filterRating);

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
        },
      }}
    >
      <DialogTitle>
        <Typography
          variant="h6"
          component="div"
          sx={{
            mb: { xs: 1, sm: 2 },
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
          }}
        >
          Anonymous Reviews
        </Typography>
        <Grid container spacing={{ xs: 1, sm: 2 }}>
          <Grid item xs={12} sm={12} md={4}>
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
            />
          </Grid>
          <Grid item xs={6} sm={6} md={4}>
            <FormControl fullWidth size="small">
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
          <Grid item xs={6} sm={6} md={4}>
            <FormControl fullWidth size="small">
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
      <DialogContent>
        <List sx={{ px: { xs: 0, sm: 1 } }}>
          {Object.entries(groupedReviews).length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              No reviews match your search criteria.
            </Typography>
          ) : (
            Object.entries(groupedReviews).map(
              ([professor, professorReviews]) => (
                <Box key={professor} sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="h6"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white",
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    {professor}
                  </Typography>
                  {professorReviews.map((review, index) => (
                    <Box key={index} sx={{ ml: 2, mt: 1 }}>
                      <ListItem>
                        <Box sx={{ width: "100%" }}>
                          <Typography
                            variant="subtitle1"
                            color="text.secondary"
                          >
                            {review.subject}
                          </Typography>
                          <Rating value={review.stars} readOnly />
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {review.review}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < professorReviews.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )
            )
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
