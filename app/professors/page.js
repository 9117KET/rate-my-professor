"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  Rating,
  Chip,
  Skeleton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import Link from "next/link";
import { db, ensureAuthenticated } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { professorToSlug } from "../utils/slugUtils";

export default function ProfessorsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let unsubscribe;

    const setupListener = async () => {
      try {
        await ensureAuthenticated();
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          }));
          setReviews(data);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setLoading(false);
      }
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Group reviews by professor, compute avg rating, review count, unique subjects
  const professors = useMemo(() => {
    const map = {};
    reviews.forEach((review) => {
      const name = review.professor;
      if (!name) return;
      if (!map[name]) {
        map[name] = { name, ratings: [], subjects: new Set() };
      }
      if (typeof review.stars === "number") map[name].ratings.push(review.stars);
      if (review.subject) map[name].subjects.add(review.subject);
    });

    return Object.values(map)
      .map((p) => ({
        name: p.name,
        avgRating:
          p.ratings.length > 0
            ? Math.round(
                (p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length) * 10
              ) / 10
            : 0,
        reviewCount: p.ratings.length,
        subjects: Array.from(p.subjects),
        slug: professorToSlug(p.name),
      }))
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [reviews]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return professors;
    const term = searchTerm.toLowerCase();
    return professors.filter((p) => p.name.toLowerCase().includes(term));
  }, [professors, searchTerm]);

  return (
    <Box sx={{ bgcolor: "#F5F5F5", minHeight: "100dvh" }}>
      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 }, justifyContent: "space-between" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SchoolIcon sx={{ color: "#001B3F", fontSize: 28 }} />
            <Typography
              variant="subtitle1"
              sx={{
                color: "#001B3F",
                fontWeight: 700,
                fontSize: { xs: "0.85rem", sm: "1rem" },
                lineHeight: 1.2,
              }}
            >
              Rate My CUB Professor
            </Typography>
          </Box>

          {/* Home link */}
          <Button
            component={Link}
            href="/"
            sx={{
              color: "#001B3F",
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0,27,63,0.06)" },
            }}
          >
            ← Home
          </Button>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 4 }, maxWidth: 1200, mx: "auto" }}>
        {/* Heading */}
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "#212B36", mb: 1 }}
        >
          All Professors
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "#637381", mb: 3 }}
        >
          Browse ratings and reviews for Constructor University professors.
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search by professor name…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#637381" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 4,
            bgcolor: "#FFFFFF",
            borderRadius: "12px",
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
              "&:hover fieldset": { borderColor: "rgba(0,27,63,0.3)" },
              "&.Mui-focused fieldset": { borderColor: "#001B3F" },
            },
          }}
        />

        {/* Loading state */}
        {loading && (
          <Grid container spacing={2}>
            {Array.from({ length: 9 }).map((_, i) => (
              <Grid item xs={6} sm={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={140}
                  sx={{ borderRadius: "16px" }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {!loading && professors.length === 0 && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="h6" sx={{ color: "#637381", fontWeight: 600 }}>
              No reviews yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#637381", mt: 1 }}>
              Be the first to rate a professor.
            </Typography>
            <Button
              component={Link}
              href="/"
              variant="contained"
              sx={{
                mt: 3,
                bgcolor: "#001B3F",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "#0A3164" },
              }}
            >
              Submit a Review
            </Button>
          </Box>
        )}

        {/* No search results */}
        {!loading && professors.length > 0 && filtered.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" sx={{ color: "#637381" }}>
              No professors match &ldquo;{searchTerm}&rdquo;.
            </Typography>
          </Box>
        )}

        {/* Professor grid */}
        {!loading && filtered.length > 0 && (
          <Grid container spacing={2}>
            {filtered.map((prof) => (
              <Grid item xs={6} sm={4} key={prof.slug}>
                <ProfessorCard professor={prof} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

function ProfessorCard({ professor }) {
  const { name, avgRating, reviewCount, subjects, slug } = professor;

  return (
    <Paper
      component={Link}
      href={`/professors/${slug}`}
      elevation={0}
      sx={{
        display: "block",
        textDecoration: "none",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: "16px",
        p: { xs: 1.5, sm: 2 },
        transition: "all 0.18s ease",
        bgcolor: "#FFFFFF",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          borderColor: "rgba(0,27,63,0.15)",
        },
      }}
    >
      {/* Professor name */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: "#001B3F",
          mb: 1,
          lineHeight: 1.3,
          fontSize: { xs: "0.78rem", sm: "0.875rem" },
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {name}
      </Typography>

      {/* Rating row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
        <Rating
          value={avgRating}
          readOnly
          precision={0.1}
          size="small"
          sx={{
            "& .MuiRating-iconFilled": { color: "#E31E24" },
            "& .MuiRating-iconEmpty": { color: "rgba(0,0,0,0.2)" },
            fontSize: { xs: "0.9rem", sm: "1.1rem" },
          }}
        />
        <Typography
          variant="caption"
          sx={{ color: "#212B36", fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
        >
          {avgRating.toFixed(1)}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#637381", fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
        >
          · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </Typography>
      </Box>

      {/* Subject chips */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {subjects.slice(0, 3).map((subject) => (
          <Chip
            key={subject}
            label={subject}
            size="small"
            sx={{
              height: 20,
              fontSize: { xs: "0.6rem", sm: "0.68rem" },
              bgcolor: "rgba(0,27,63,0.06)",
              color: "#001B3F",
              fontWeight: 500,
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}
