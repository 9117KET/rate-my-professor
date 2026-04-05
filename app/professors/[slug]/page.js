"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Paper,
  Rating,
  Chip,
  Skeleton,
  Button,
  LinearProgress,
  Divider,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import Link from "next/link";
import { db, ensureAuthenticated } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { professorToSlug } from "../../utils/slugUtils";
import { formatTimestamp } from "../../utils/formatters";

export default function ProfessorProfilePage({ params }) {
  const { slug } = React.use(params);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Filter to this professor's reviews
  const professorReviews = useMemo(
    () => reviews.filter((r) => professorToSlug(r.professor) === slug),
    [reviews, slug]
  );

  // Derive professor name from first matching review
  const professor = professorReviews.length > 0 ? professorReviews[0].professor : null;

  // Compute stats
  const stats = useMemo(() => {
    if (professorReviews.length === 0) {
      return { avgRating: 0, starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, subjects: [], totalReviews: 0 };
    }
    const totalReviews = professorReviews.length;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const subjectSet = new Set();
    let sum = 0;

    professorReviews.forEach((r) => {
      const stars = Math.round(r.stars);
      if (stars >= 1 && stars <= 5) starCounts[stars] += 1;
      sum += typeof r.stars === "number" ? r.stars : 0;
      if (r.subject) subjectSet.add(r.subject);
    });

    const avgRating =
      Math.round((sum / totalReviews) * 10) / 10;

    return {
      avgRating,
      starCounts,
      subjects: Array.from(subjectSet),
      totalReviews,
    };
  }, [professorReviews]);

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

          <Button
            component={Link}
            href="/professors"
            sx={{
              color: "#001B3F",
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0,27,63,0.06)" },
            }}
          >
            ← All Professors
          </Button>
        </Toolbar>
      </AppBar>

      {/* Loading skeleton */}
      {loading && <ProfileSkeleton />}

      {/* Not found */}
      {!loading && !professor && (
        <Box sx={{ textAlign: "center", py: 12, px: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#212B36", mb: 1 }}>
            Professor not found
          </Typography>
          <Typography variant="body2" sx={{ color: "#637381", mb: 3 }}>
            No reviews match this profile.
          </Typography>
          <Button
            component={Link}
            href="/professors"
            variant="contained"
            sx={{
              bgcolor: "#001B3F",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#0A3164" },
            }}
          >
            Back to all professors
          </Button>
        </Box>
      )}

      {/* Profile */}
      {!loading && professor && (
        <>
          {/* Hero */}
          <Box
            sx={{
              bgcolor: "#001B3F",
              px: { xs: 2, sm: 4 },
              py: { xs: 4, sm: 6 },
              textAlign: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: "#FFFFFF",
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: "1.4rem", sm: "2rem" },
              }}
            >
              {professor}
            </Typography>

            <Typography
              variant="h2"
              sx={{
                color: "#FFFFFF",
                fontWeight: 800,
                lineHeight: 1,
                mb: 1,
                fontSize: { xs: "3rem", sm: "4rem" },
              }}
            >
              {stats.avgRating.toFixed(1)}
            </Typography>

            <Rating
              value={stats.avgRating}
              readOnly
              precision={0.1}
              sx={{
                mb: 1,
                "& .MuiRating-iconFilled": { color: "#FFFFFF" },
                "& .MuiRating-iconEmpty": { color: "rgba(255,255,255,0.3)" },
                fontSize: "2rem",
              }}
            />

            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
            >
              {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
            </Typography>
          </Box>

          {/* Stats card */}
          <Box sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 }, maxWidth: 800, mx: "auto" }}>
            <Paper
              elevation={0}
              sx={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "16px",
                p: { xs: 2, sm: 3 },
                bgcolor: "#FFFFFF",
                mb: 2,
              }}
            >
              {/* Star distribution */}
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "#212B36", mb: 2 }}
              >
                Rating breakdown
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.starCounts[star] || 0;
                  const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  return (
                    <Box
                      key={star}
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#637381",
                          fontWeight: 600,
                          minWidth: 24,
                          textAlign: "right",
                        }}
                      >
                        {star} ★
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: "8px",
                          bgcolor: "rgba(0,0,0,0.06)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "#001B3F",
                            borderRadius: "8px",
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "#637381", minWidth: 20, textAlign: "right" }}
                      >
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Subjects */}
              {stats.subjects.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: "#212B36", mb: 1.5 }}
                  >
                    Subjects
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {stats.subjects.map((subject) => (
                      <Chip
                        key={subject}
                        label={subject}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: "#001B3F",
                          color: "#001B3F",
                          fontWeight: 500,
                          borderRadius: "8px",
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>

            {/* Action buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                mb: 3,
              }}
            >
              <Button
                component={Link}
                href={`/?q=${encodeURIComponent("Tell me about professor " + professor)}`}
                variant="contained"
                sx={{
                  bgcolor: "#001B3F",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.18s ease",
                  "&:hover": {
                    bgcolor: "#0A3164",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  },
                }}
              >
                Ask AI about {professor.split(" ").slice(-1)[0]}
              </Button>

              <Button
                component={Link}
                href={`/?rate=${encodeURIComponent(professor)}`}
                variant="contained"
                sx={{
                  bgcolor: "#E31E24",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.18s ease",
                  "&:hover": {
                    bgcolor: "#FF3C42",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  },
                }}
              >
                Rate this professor
              </Button>
            </Box>

            {/* Reviews list */}
            <Paper
              elevation={0}
              sx={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "16px",
                bgcolor: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#212B36" }}>
                  Reviews
                </Typography>
              </Box>
              <Divider />

              {professorReviews.map((review, index) => (
                <React.Fragment key={review.id}>
                  <ReviewCard review={review} />
                  {index < professorReviews.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}

function ReviewCard({ review }) {
  const thumbsUp = Array.isArray(review.reactions?.thumbsUp)
    ? review.reactions.thumbsUp.length
    : typeof review.reactions?.thumbsUp === "number"
    ? review.reactions.thumbsUp
    : 0;

  const thumbsDown = Array.isArray(review.reactions?.thumbsDown)
    ? review.reactions.thumbsDown.length
    : typeof review.reactions?.thumbsDown === "number"
    ? review.reactions.thumbsDown
    : 0;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
      {/* Meta row */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 0.75,
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ color: "#637381", fontWeight: 600 }}>
          {review.subject || "Unknown subject"}
        </Typography>
        <Typography variant="caption" sx={{ color: "#637381" }}>
          {formatTimestamp(review.createdAt)}
        </Typography>
      </Box>

      {/* Stars */}
      <Rating
        value={review.stars || 0}
        readOnly
        size="small"
        sx={{
          mb: 1,
          "& .MuiRating-iconFilled": { color: "#E31E24" },
          "& .MuiRating-iconEmpty": { color: "rgba(0,0,0,0.2)" },
        }}
      />

      {/* Review text */}
      <Typography
        variant="body2"
        sx={{ color: "#212B36", lineHeight: 1.6, mb: 1.5 }}
      >
        {review.review || review.text || ""}
      </Typography>

      {/* Reaction counts (read-only) */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Typography variant="caption" sx={{ color: "#637381" }}>
          👍 {thumbsUp}
        </Typography>
        <Typography variant="caption" sx={{ color: "#637381" }}>
          👎 {thumbsDown}
        </Typography>
      </Box>
    </Box>
  );
}

function ProfileSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <Box
        sx={{
          bgcolor: "#001B3F",
          px: { xs: 2, sm: 4 },
          py: { xs: 4, sm: 6 },
          textAlign: "center",
        }}
      >
        <Skeleton
          variant="text"
          width="50%"
          height={48}
          sx={{ mx: "auto", bgcolor: "rgba(255,255,255,0.1)" }}
        />
        <Skeleton
          variant="text"
          width="20%"
          height={80}
          sx={{ mx: "auto", bgcolor: "rgba(255,255,255,0.1)" }}
        />
        <Skeleton
          variant="text"
          width="30%"
          height={32}
          sx={{ mx: "auto", bgcolor: "rgba(255,255,255,0.1)" }}
        />
      </Box>

      {/* Cards skeleton */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 3, maxWidth: 800, mx: "auto" }}>
        <Skeleton variant="rounded" height={200} sx={{ borderRadius: "16px", mb: 2 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={120}
            sx={{ borderRadius: "16px", mb: 1.5 }}
          />
        ))}
      </Box>
    </>
  );
}
