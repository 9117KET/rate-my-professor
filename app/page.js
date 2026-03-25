"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Paper,
  Typography,
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  Fade,
  Grow,
  IconButton,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SchoolIcon from "@mui/icons-material/School";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { SubmitReviewModal } from "./components/SubmitReviewModal";
import { ViewReviewsModal } from "./components/ViewReviewsModal";
import { ActionButtons } from "./components/ActionButtons";
import { TipsModal } from "./components/TipsModal";
import { ImprintModal } from "./components/ImprintModal";
import { chatService } from "./services/chatService";
import { HowToUseModal } from "./components/HowToUseModal";
import { userTrackingService } from "./services/userTrackingService";
import { reviewsService } from "./services/reviewsService";
import { ensureAuthenticated } from "./lib/firebase";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import { PrivacyConsentBanner } from "./components/PrivacyConsentBanner";
import { ReportBugModal } from "./components/ReportBugModal";
import {
  FirstTimeVisitModal,
  isFirstTimeVisit,
} from "./components/FirstTimeVisitModal";

// Enhanced color palette
const theme = {
  primary: {
    main: "#001B3F",
    light: "#0A3164",
    dark: "#00102A",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#E31E24",
    light: "#FF3C42",
    dark: "#B71C1C",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#F8F9FA",
    paper: "#FFFFFF",
    light: "#F0F4F8",
  },
  text: {
    primary: "#212B36",
    secondary: "#637381",
    hint: "#919EAB",
  },
};

const messageStyles = {
  assistant: {
    bgcolor: theme.primary.light,
    color: theme.primary.contrastText,
    borderRadius: "18px 18px 18px 4px",
    boxShadow: "0 2px 8px rgba(0,27,63,0.1)",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-10px",
      width: "20px",
      height: "20px",
      //backgroundColor: theme.primary.light,
      borderBottomRightRadius: "50%",
      zIndex: -1,
    },
  },
  user: {
    bgcolor: theme.secondary.main,
    color: theme.secondary.contrastText,
    borderRadius: "18px 18px 4px 18px",
    boxShadow: "0 2px 8px rgba(227,30,36,0.1)",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      bottom: 0,
      right: "-10px",
      width: "20px",
      height: "20px",
      backgroundColor: theme.secondary.main,
      borderBottomLeftRadius: "50%",
      zIndex: -1,
    },
  },
};

const motionFadeUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const motionStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const formatTimestamp = (date) => {
  if (!date) return "";

  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Check for invalid date
  if (isNaN(dateObj.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome to Rate My CUB Professor! What info about a professor or course do you need help with?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [openRateModal, setOpenRateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openTipsModal, setOpenTipsModal] = useState(false);
  const [openImprintModal, setOpenImprintModal] = useState(false);
  const [openHowToUseModal, setOpenHowToUseModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openFirstVisitModal, setOpenFirstVisitModal] = useState(false);
  const [openReportBugModal, setOpenReportBugModal] = useState(false);
  const [openMoreModal, setOpenMoreModal] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [heroVerbIndex, setHeroVerbIndex] = useState(0);
  const [heroPolarityIndex, setHeroPolarityIndex] = useState(0);
  const [showReviewReminderPopup, setShowReviewReminderPopup] = useState(false);
  const reminderTimerIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [userId, setUserId] = useState(null);

  const heroVerbsBest = ["Rate", "Review"];
  const heroVerbWorst = "Roast";
  const heroPolarities = ["best", "worst"];

  // Check for first-time visitor and set up other initial state
  useEffect(() => {
    const hasReviewed = localStorage.getItem("has_submitted_review");

    if (hasReviewed) {
      setHasSubmittedReview(true);
    }

    // First-time visitor flow:
    // 1. Privacy notice (handled by PrivacyConsentBanner component)
    // 2. Welcome/how-to-use modal (triggered by privacy consent)
    // 3. First-time visit modal for rating professors (triggered after welcome modal)

    // Set up review reminder timer if needed (10 minutes = 600000 ms)
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    const privacyConsent = userTrackingService.getPrivacyConsent();

    if (hasSeenWelcome && privacyConsent?.consented && !hasReviewed) {
      const timerId = setTimeout(() => {
        setShowReviewReminderPopup(true);
      }, 600000);

      reminderTimerIdRef.current = timerId;
    }

    return () => {
      // Clear the timer when component unmounts or user submits review
      if (reminderTimerIdRef.current) {
        clearTimeout(reminderTimerIdRef.current);
      }
    };
  }, []); // Empty dependency array

  // Landing hero micro-animation (only when on Home).
  useEffect(() => {
    if (activeNav !== "home") return;

    const timer = setInterval(() => {
      setHeroPolarityIndex((i) => (i + 1) % heroPolarities.length);
      setHeroVerbIndex((i) => (i + 1) % heroVerbsBest.length);
    }, 3200);

    return () => {
      clearInterval(timer);
    };
  }, [activeNav, heroVerbsBest.length, heroPolarities.length]);

  // Function to setup the recurring reminder
  const setupRecurringReminder = () => {
    // Clear any existing timer
    if (reminderTimerIdRef.current) {
      clearTimeout(reminderTimerIdRef.current);
    }

    // Set new timer for 10 minutes
    const timerId = setTimeout(() => {
      setShowReviewReminderPopup(true);
    }, 600000);

    reminderTimerIdRef.current = timerId;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize user ID on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, ensure Firebase authentication
        await ensureAuthenticated();

        // Then get/create user ID
        const id = userTrackingService.getOrCreateUserId();
        setUserId(id);
      } catch (error) {
        console.error("Error initializing authentication:", error);
        // Fallback to localStorage-only mode if authentication fails
        try {
          const id = userTrackingService.getOrCreateUserId();
          setUserId(id);
        } catch (localError) {
          console.error("Error initializing user ID:", localError);
        }
      }
    };

    initAuth();
  }, []);

  const sendMessage = async (overrideMessage) => {
    const messageToSend = overrideMessage ?? message;

    if (!messageToSend.trim() || !userId) return;

    setIsLoading(true);
    const newMessages = [
      ...messages,
      {
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setMessage("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Anonymous-User-ID": userId,
        },
        body: JSON.stringify([
          ...messages,
          {
            role: "user",
            content: messageToSend,
            timestamp: new Date().toISOString(),
          },
        ]),
      });

      if (res.status === 429) {
        const rateLimitData = await res.json();
        const resetTime = new Date(rateLimitData.resetTime);
        const timeUntilReset = Math.ceil((resetTime - new Date()) / 1000 / 60); // Convert to minutes

        const errorMessages = [
          ...newMessages.slice(0, -1),
          {
            role: "assistant",
            content: `You've reached the rate limit of 50 messages per hour. Please wait ${timeUntilReset} minutes before sending more messages.`,
            timestamp: new Date(),
          },
        ];
        setMessages(errorMessages);
        await chatService.saveChat(errorMessages, userId);
        return;
      }

      if (!res.ok) throw new Error(res.statusText);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        fullResponse += text;

        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }

      // Save the complete chat to database after response is complete
      const finalMessages = [
        ...newMessages.slice(0, -1),
        {
          role: "assistant",
          content: fullResponse,
          timestamp: new Date(),
        },
      ];
      await chatService.saveChat(finalMessages, userId);
    } catch (error) {
      console.error("Error:", error);
      const errorMessages = [
        ...newMessages.slice(0, -1),
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
          timestamp: new Date(),
        },
      ];
      setMessages(errorMessages);
      await chatService.saveChat(errorMessages, userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await reviewsService.addReview(reviewData);
      setHasSubmittedReview(true);
      localStorage.setItem("has_submitted_review", "true");
      setOpenRateModal(false);
      setOpenHowToUseModal(false);
      setShowReviewReminderPopup(false);

      // Clear any reminder timers
      if (reminderTimerIdRef.current) {
        clearTimeout(reminderTimerIdRef.current);
        reminderTimerIdRef.current = null;
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Prevent closing the rate modal if user hasn't submitted a review and it was triggered by view reviews
  const handleRateModalClose = () => {
    setOpenRateModal(false);
    setActiveNav("home");
  };

  // Handle How to Use modal close
  const handleCloseHowToUseModal = () => {
    setOpenHowToUseModal(false);
    // Set flag in localStorage to indicate the user has seen the welcome modal
    localStorage.setItem("has_seen_welcome", "true");

    // After welcome modal is closed, check if we should show the first-time visit modal
    if (isFirstTimeVisit()) {
      setOpenFirstVisitModal(true);
    }
  };

  // Handle the review reminder popup close
  const handleReminderClose = () => {
    setShowReviewReminderPopup(false);
    // Setup the next reminder
    setupRecurringReminder();
  };

  // Handle attempt to view reviews when not yet reviewed
  const handleViewReviewsClick = () => {
    // Always open the view modal, where we'll show the prompt if needed
    setActiveNav("reviews");
    setOpenViewModal(true);
  };

  const handleFirstVisitModalClose = () => {
    setOpenFirstVisitModal(false);
    // Now that first visit is handled, see if we should show the welcome modal
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    if (!hasSeenWelcome) {
      setOpenHowToUseModal(true);
    }
  };

  const handlePrivacyConsent = () => {
    // When privacy consent is given, show the welcome/how-to-use modal
    setOpenHowToUseModal(true);
  };

  const closeAllNavigationModals = () => {
    setOpenViewModal(false);
    setOpenRateModal(false);
    setOpenTipsModal(false);
    setOpenImprintModal(false);
    setOpenHowToUseModal(false);
    setOpenPrivacyModal(false);
    setOpenReportBugModal(false);
    setOpenMoreModal(false);
  };

  const handleNavChange = (value) => {
    setActiveNav(value);

    if (value === "home") {
      closeAllNavigationModals();
      return;
    }

    if (value === "chat") {
      closeAllNavigationModals();
      return;
    }

    if (value === "reviews") {
      closeAllNavigationModals();
      setOpenViewModal(true);
      return;
    }

    if (value === "rate") {
      closeAllNavigationModals();
      setOpenRateModal(true);
      return;
    }

    if (value === "more") {
      closeAllNavigationModals();
      setOpenMoreModal(true);
      return;
    }
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.background.default,
        overflow: "hidden",
        maxWidth: "100vw",
      }}
    >
      {/* Desktop top navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          display: { xs: "none", sm: "block" },
          bgcolor: "rgba(255,255,255,0.75)",
          color: theme.text.primary,
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <SchoolIcon sx={{ color: theme.primary.main }} />
          <Typography sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Rate My Professor
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            variant={activeNav === "home" ? "contained" : "text"}
            onClick={() => handleNavChange("home")}
          >
            Home
          </Button>
          <Button
            variant={activeNav === "rate" ? "contained" : "text"}
            onClick={() => handleNavChange("rate")}
          >
            Rate
          </Button>
          <Button
            variant={activeNav === "reviews" ? "contained" : "text"}
            onClick={() => handleNavChange("reviews")}
          >
            Reviews
          </Button>
          <Button
            variant={activeNav === "chat" ? "contained" : "text"}
            onClick={() => handleNavChange("chat")}
          >
            Chat
          </Button>
          <Button
            variant={activeNav === "more" ? "contained" : "text"}
            onClick={() => handleNavChange("more")}
          >
            More
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 1, sm: 2, md: 3 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* Home (Landing) */}
        {activeNav === "home" && (
          <Container maxWidth="md">
            <Box
              component={motion.div}
              variants={motionStagger}
              initial="hidden"
              animate="visible"
              sx={{ mt: { xs: 1, sm: 3 }, mb: { xs: 10, sm: 4 } }}
            >
              {/* Hero */}
              <Box component={motion.div} variants={motionFadeUp} sx={{ mb: 3 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.95,
                    mt: 1,
                    fontSize: { xs: "2.6rem", sm: "3.4rem" },
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`verb-${heroPolarities[heroPolarityIndex]}-${heroVerbIndex}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        display: "inline-block",
                        paddingRight: 10,
                        color: theme.primary.main,
                      }}
                    >
                      {heroPolarities[heroPolarityIndex] === "worst"
                        ? heroVerbWorst
                        : heroVerbsBest[heroVerbIndex]}
                    </motion.span>
                  </AnimatePresence>
                  your
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={`polarity-${heroPolarities[heroPolarityIndex]}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        display: "inline-block",
                        paddingLeft: 10,
                        paddingRight: 10,
                        textDecoration: "underline",
                        textUnderlineOffset: "6px",
                        textDecorationThickness: "3px",
                      }}
                    >
                      {heroPolarities[heroPolarityIndex]}
                    </motion.span>
                  </AnimatePresence>
                  professors on campus&nbsp;anonymously.
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    color: theme.text.secondary,
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    lineHeight: 1.6,
                    maxWidth: "44ch",
                  }}
                >
                  Rate professors and help other students choose better.
                </Typography>
              </Box>

              {/* Bento cards */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Paper
                  component={motion.div}
                  variants={motionFadeUp}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: theme.background.paper,
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography sx={{ fontWeight: 900, fontSize: "1.25rem" }}>
                    Got a professor story
                  </Typography>
                  <Typography sx={{ color: theme.text.secondary, mt: 0.75 }}>
                    Roast or praise. Stay anonymous. Help the next student.
                  </Typography>
                </Paper>

                <Stack direction="row" spacing={1.5}>
                  <Paper
                    component={motion.div}
                    variants={motionFadeUp}
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 3,
                      bgcolor: "rgba(227,30,36,0.12)",
                      border: "1px solid rgba(227,30,36,0.18)",
                      minHeight: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      Ever wanted to roast a professor
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: theme.secondary.dark }}>
                      Here is your chance
                    </Typography>
                  </Paper>

                  <Paper
                    component={motion.div}
                    variants={motionFadeUp}
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 3,
                      bgcolor: "rgba(0,27,63,0.08)",
                      border: "1px solid rgba(0,27,63,0.12)",
                      minHeight: 140,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      Want to give genuine feedback
                    </Typography>
                    <Typography sx={{ color: theme.text.secondary }}>
                      They will not know who you are
                    </Typography>
                  </Paper>
                </Stack>
              </Stack>

              {/* CTAs */}
              <Stack
                component={motion.div}
                variants={motionFadeUp}
                spacing={1.25}
                sx={{ mb: 3 }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleNavChange("rate")}
                  sx={{
                    py: 1.6,
                    borderRadius: 3,
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.light} 100%)`,
                    "&:hover": {
                      background: `linear-gradient(135deg, ${theme.primary.light} 0%, ${theme.primary.main} 100%)`,
                    },
                  }}
                >
                  Rate a professor
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleNavChange("reviews")}
                  sx={{ py: 1.6, borderRadius: 3, fontWeight: 900 }}
                >
                  Reviews
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => handleNavChange("chat")}
                  sx={{ py: 1.6, borderRadius: 3, fontWeight: 900 }}
                >
                  Ask our AI chat assistant
                </Button>
              </Stack>
              <Box component={motion.div} variants={motionFadeUp} sx={{ mt: 0.5 }}>
                <Typography variant="body2" sx={{ color: theme.text.secondary }}>
                  Ask our AI chat assistant powered by real student reviews.
                </Typography>
              </Box>
            </Box>
          </Container>
        )}

        {/* Chat */}
        {activeNav === "chat" && (
          <Container maxWidth="md" sx={{ height: "100%" }}>
            <Paper
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "transparent",
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* Chat messages container */}
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  p: { xs: 2, sm: 3 },
                  bgcolor: theme.background.paper,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  backgroundImage:
                    "radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                {messages.map((message, index) => (
                  <Grow
                    in={true}
                    key={index}
                    timeout={300 + index * 100}
                    style={{
                      transformOrigin:
                        message.role === "assistant" ? "0 100%" : "100% 100%",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          message.role === "assistant"
                            ? "flex-start"
                            : "flex-end",
                        mb: 2,
                        position: "relative",
                      }}
                    >
                      {message.role === "assistant" && (
                        <Avatar
                          sx={{
                            bgcolor: theme.primary.main,
                            width: 36,
                            height: 36,
                            mr: 1,
                            mb: "auto",
                            mt: 0.5,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            display: { xs: "none", sm: "flex" },
                          }}
                        >
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                      )}
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          maxWidth: { xs: "85%", sm: "75%", md: "70%" },
                          ...(message.role === "assistant"
                            ? messageStyles.assistant
                            : messageStyles.user),
                          position: "relative",
                          "& .timestamp": {
                            position: "absolute",
                            bottom: -18,
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            color: theme.text.secondary,
                            right: message.role === "user" ? 8 : "auto",
                            left: message.role === "assistant" ? 8 : "auto",
                          },
                          mb: { xs: 1, sm: 1.5 },
                          wordBreak: "break-word",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow:
                              message.role === "assistant"
                                ? "0 4px 12px rgba(0,27,63,0.15)"
                                : "0 4px 12px rgba(227,30,36,0.15)",
                          },
                        }}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <Typography
                                variant="body1"
                                component="div"
                                sx={{
                                  mb: 1,
                                  lineHeight: 1.6,
                                  fontSize: { xs: "0.9rem", sm: "1rem" },
                                }}
                              >
                                {children}
                              </Typography>
                            ),
                            h1: ({ children }) => (
                              <Typography
                                variant="h5"
                                component="div"
                                sx={{
                                  mb: 1.5,
                                  fontWeight: 600,
                                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                                }}
                              >
                                {children}
                              </Typography>
                            ),
                            h2: ({ children }) => (
                              <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                  mb: 1.5,
                                  fontWeight: 600,
                                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                                }}
                              >
                                {children}
                              </Typography>
                            ),
                            li: ({ children }) => (
                              <Typography
                                variant="body1"
                                component="li"
                                sx={{
                                  mb: 0.5,
                                  fontSize: { xs: "0.9rem", sm: "1rem" },
                                }}
                              >
                                {children}
                              </Typography>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        <Typography
                          className="timestamp"
                          variant="caption"
                          component="div"
                          suppressHydrationWarning
                        >
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                      </Paper>
                      {message.role === "user" && (
                        <Avatar
                          sx={{
                            bgcolor: theme.secondary.main,
                            width: 36,
                            height: 36,
                            ml: 1,
                            mb: "auto",
                            mt: 0.5,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            display: { xs: "none", sm: "flex" },
                          }}
                        >
                          {/* User initial avatar */}U
                        </Avatar>
                      )}
                    </Box>
                  </Grow>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input area */}
              <Box
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  bgcolor: theme.background.light,
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  position: "sticky",
                  bottom: { xs: 78, sm: 0 },
                  zIndex: 1,
                }}
              >
                {/* Suggestion buttons */}
                <Box
                  sx={{
                    display: "flex",
                    gap: { xs: 0.25, sm: 1 },
                    mb: { xs: 1.5, sm: 2 },
                    flexWrap: "nowrap",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      await sendMessage("Who are the highest rated professors?");
                    }}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 3,
                      borderColor: "rgba(0,0,0,0.1)",
                      color: theme.text.secondary,
                      fontSize: { xs: "0.6rem", sm: "0.8rem" },
                      px: { xs: 0.5, sm: 2 },
                      py: { xs: 0.25, sm: 0.75 },
                      minWidth: 0,
                      flex: 1,
                      mx: 0.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      "&:hover": {
                        borderColor: theme.primary.main,
                        bgcolor: "rgba(0,27,63,0.05)",
                      },
                    }}
                  >
                    🌟 Best rated
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      await sendMessage("How do I submit a review?");
                    }}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 3,
                      borderColor: "rgba(0,0,0,0.1)",
                      color: theme.text.secondary,
                      fontSize: { xs: "0.6rem", sm: "0.8rem" },
                      px: { xs: 0.5, sm: 2 },
                      py: { xs: 0.25, sm: 0.75 },
                      minWidth: 0,
                      flex: 1,
                      mx: 0.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      "&:hover": {
                        borderColor: theme.primary.main,
                        bgcolor: "rgba(0,27,63,0.05)",
                      },
                    }}
                  >
                    ✍️ submit a review
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      await sendMessage(
                        "What are the tips for succeeding in courses?"
                      );
                    }}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 3,
                      borderColor: "rgba(0,0,0,0.1)",
                      color: theme.text.secondary,
                      fontSize: { xs: "0.6rem", sm: "0.8rem" },
                      px: { xs: 0.5, sm: 2 },
                      py: { xs: 0.25, sm: 0.75 },
                      minWidth: 0,
                      flex: 1,
                      mx: 0.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      "&:hover": {
                        borderColor: theme.primary.main,
                        bgcolor: "rgba(0,27,63,0.05)",
                      },
                    }}
                  >
                    💡 Tips for courses
                  </Button>
                </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "flex-end",
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask about professors..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  size="small"
                  multiline
                  maxRows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      transition: "all 0.2s ease",
                      backgroundColor: "white",
                      "&:hover fieldset": {
                        borderColor: theme.primary.light,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.primary.main,
                        boxShadow: "0 0 0 3px rgba(0,27,63,0.1)",
                      },
                    },
                    "& .MuiInputBase-root": {
                      maxHeight: { xs: "90px", sm: "120px" },
                      overflowY: "auto",
                      padding: "10px 14px",
                    },
                  }}
                  disabled={isLoading}
                />
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  sx={{
                    borderRadius: "50%",
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    backgroundColor: theme.secondary.main,
                    color: "white",
                    "&:hover": {
                      backgroundColor: theme.secondary.dark,
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "rgba(0,0,0,0.12)",
                      color: "rgba(0,0,0,0.26)",
                    },
                    transition: "all 0.2s ease",
                    transform: message.trim() ? "scale(1)" : "scale(0.95)",
                    boxShadow: message.trim()
                      ? "0 4px 12px rgba(227,30,36,0.25)"
                      : "none",
                  }}
                >
                  <SendIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Stack>
              {isLoading && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: 1.5,
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: theme.primary.main,
                          opacity: 0.6,
                          animation: "pulse 1.5s infinite ease-in-out",
                          animationDelay: `${i * 0.25}s`,
                          "@keyframes pulse": {
                            "0%, 100%": {
                              transform: "scale(0.8)",
                              opacity: 0.4,
                            },
                            "50%": {
                              transform: "scale(1.2)",
                              opacity: 0.9,
                            },
                          },
                        }}
                      />
                    ))}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.text.secondary,
                      fontStyle: "italic",
                    }}
                  >
                    Thinking...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
        )}
      </Box>

      {/* Mobile navigation */}
      <Paper
        elevation={4}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          display: { xs: "block", sm: "none" },
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          overflow: "hidden",
        }}
      >
        <BottomNavigation
          showLabels
          value={activeNav}
          onChange={(_, value) => handleNavChange(value)}
          sx={{
            "& .MuiBottomNavigationAction-root": {
              minWidth: 72,
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            value="home"
            icon={<HomeOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Rate"
            value="rate"
            icon={<StarBorderOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Reviews"
            value="reviews"
            icon={<ExploreOutlinedIcon />}
          />
          <BottomNavigationAction
            label="Chat"
            value="chat"
            icon={<ChatBubbleOutlineOutlinedIcon />}
          />
          <BottomNavigationAction
            label="More"
            value="more"
            icon={<MoreHorizIcon />}
          />
        </BottomNavigation>
      </Paper>

      <SubmitReviewModal
        open={openRateModal}
        onClose={handleRateModalClose}
        onSubmit={handleReviewSubmit}
        loading={isLoading}
        disableClose={false}
      />
      <ViewReviewsModal
        open={openViewModal}
        onClose={() => {
          setOpenViewModal(false);
          setActiveNav("home");
        }}
        userId={userId}
        onOpenSubmitForm={() => setOpenRateModal(true)}
      />
      <TipsModal
        open={openTipsModal}
        onClose={() => setOpenTipsModal(false)}
        disableClose={!hasSubmittedReview}
      />
      <ImprintModal
        open={openImprintModal}
        onClose={() => setOpenImprintModal(false)}
        disableClose={!hasSubmittedReview}
      />
      <HowToUseModal
        open={openHowToUseModal}
        onClose={handleCloseHowToUseModal}
        disableClose={false}
      />
      <PrivacyPolicyModal
        open={openPrivacyModal}
        onClose={() => setOpenPrivacyModal(false)}
      />
      <PrivacyConsentBanner
        onPrivacyClick={() => setOpenPrivacyModal(true)}
        onConsent={handlePrivacyConsent}
      />

      <Dialog
        open={openMoreModal}
        onClose={() => {
          setOpenMoreModal(false);
          setActiveNav("home");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>More</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenMoreModal(false);
                setActiveNav("home");
                setOpenImprintModal(true);
              }}
            >
              Guidelines
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenMoreModal(false);
                setActiveNav("home");
                setOpenPrivacyModal(true);
              }}
            >
              Privacy
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenMoreModal(false);
                setActiveNav("home");
                setOpenReportBugModal(true);
              }}
            >
              Bug Report
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenMoreModal(false);
                setActiveNav("home");
                setOpenHowToUseModal(true);
              }}
            >
              How to Use
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenMoreModal(false);
              setActiveNav("home");
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        component="footer"
        sx={{
          p: { xs: 0.75, sm: 1 },
          bgcolor: theme.primary.main,
          color: "white",
          textAlign: "center",
          display: { xs: "none", sm: "flex" },
          flexDirection: "row",
          justifyContent: "center",
          gap: { xs: 0.5, sm: 2 },
          "& .MuiButton-root": {
            fontSize: { xs: "0.65rem", sm: "0.75rem" },
            minWidth: { xs: "auto", sm: "auto" },
            px: { xs: 0.5, sm: 1 },
            py: 0.5,
            borderRadius: 6,
            transition: "all 0.3s ease",
          },
          background: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.light} 100%)`,
        }}
      >
        <Button
          variant="text"
          onClick={() => setOpenHowToUseModal(true)}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          How to Use
        </Button>
        <Button
          variant="text"
          onClick={() => setOpenPrivacyModal(true)}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Privacy
        </Button>
        <Button
          variant="text"
          href="https://www.instagram.com/rate_my_professor/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Instagram
        </Button>
        <Button
          variant="text"
          onClick={() => setOpenReportBugModal(true)}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Report Bug
        </Button>
        <Button
          variant="text"
          onClick={() => setOpenImprintModal(true)}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          Imprint
        </Button>
      </Box>
      {/* Review Reminder Popup */}
      <Dialog
        open={showReviewReminderPopup}
        onClose={handleReminderClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            margin: { xs: 1, sm: 2 },
            width: { xs: "95%", sm: "80%" },
            borderRadius: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: "1.2rem", sm: "1.5rem" },
            pt: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 2 },
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          🎓 Share Your Experience!
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, textAlign: "center" }}>
            Help other students by rating a professor you&apos;ve had. Your
            insights are valuable to the community!
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, display: "flex", justifyContent: "space-between" }}
        >
          <Button onClick={handleReminderClose} color="primary">
            Remind me later
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setShowReviewReminderPopup(false);
              handleNavChange("rate");
            }}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: "none",
            }}
          >
            Rate a Professor
          </Button>
        </DialogActions>
      </Dialog>
      <FirstTimeVisitModal
        open={openFirstVisitModal}
        onClose={handleFirstVisitModalClose}
      />
      <ReportBugModal
        open={openReportBugModal}
        onClose={() => setOpenReportBugModal(false)}
      />
    </Box>
  );
}
