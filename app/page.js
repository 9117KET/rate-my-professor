"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SchoolIcon from "@mui/icons-material/School";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
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
  const searchParams = useSearchParams();

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

  // Handle ?q= and ?rate= query params (deep links from professor profile page)
  useEffect(() => {
    const q = searchParams.get("q");
    const rate = searchParams.get("rate");
    if (q) {
      setActiveNav("chat");
      setMessage(decodeURIComponent(q));
    } else if (rate) {
      setActiveNav("rate");
      setOpenRateModal(true);
    }
  }, [searchParams]);

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
      // Set a local ID immediately (synchronous localStorage read) so sendMessage
      // is never blocked by the async Firebase auth call.
      try {
        const localId = userTrackingService.getOrCreateUserId();
        setUserId(localId);
      } catch (e) {
        console.error("Error reading local user ID:", e);
      }

      // Then upgrade to Firebase UID asynchronously.
      try {
        await ensureAuthenticated();
        const id = userTrackingService.getOrCreateUserId();
        setUserId(id);
      } catch (error) {
        console.error("Error initializing Firebase authentication:", error);
        // Local ID already set above — no further action needed.
      }
    };

    initAuth();
  }, []);

  const sendMessage = async (overrideMessage) => {
    const messageToSend = overrideMessage ?? message;

    const messageText =
      typeof messageToSend === "string" ? messageToSend : String(messageToSend ?? "");

    if (!messageText.trim() || !userId) return;

    setIsLoading(true);
    const newMessages = [
      ...messages,
      {
        role: "user",
        content: messageText,
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
            content: messageText,
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

      if (!res.ok) {
        let errMsg;
        try {
          const errData = await res.json();
          errMsg =
            errData.error?.message ||
            (typeof errData.error === "string" ? errData.error : null) ||
            errData.message ||
            `Request failed (${res.status})`;
        } catch {
          errMsg = `Request failed (${res.status})`;
        }
        const apiErrorMessages = [
          ...newMessages.slice(0, -1),
          { role: "assistant", content: errMsg, timestamp: new Date() },
        ];
        setMessages(apiErrorMessages);
        await chatService.saveChat(apiErrorMessages, userId);
        return;
      }

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
        sx={{ display: { xs: "none", sm: "block" } }}
      >
        <Toolbar sx={{ gap: 0.5, minHeight: "56px !important" }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mr: 2,
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              bgcolor: theme.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <SchoolIcon sx={{ color: "white", fontSize: 18 }} />
            </Box>
            <Typography sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              fontSize: "0.95rem",
              color: theme.primary.main,
            }}>
              Rate My Professor
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          {[
            { nav: "home", label: "Home", icon: <HomeOutlinedIcon sx={{ fontSize: 15 }} /> },
            { nav: "rate", label: "Rate", icon: <StarBorderOutlinedIcon sx={{ fontSize: 15 }} /> },
            { nav: "reviews", label: "Reviews", icon: <ExploreOutlinedIcon sx={{ fontSize: 15 }} /> },
            { nav: "chat", label: "Chat", icon: <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 15 }} /> },
            { nav: "more", label: "More", icon: <MoreHorizIcon sx={{ fontSize: 15 }} /> },
          ].map(({ nav, label, icon }) => (
            <Button
              key={nav}
              startIcon={icon}
              onClick={() => handleNavChange(nav)}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: "8px",
                fontSize: "0.8125rem",
                fontWeight: activeNav === nav ? 700 : 500,
                color: activeNav === nav ? theme.primary.main : theme.text.secondary,
                bgcolor: activeNav === nav ? "rgba(0,27,63,0.07)" : "transparent",
                "&:hover": {
                  bgcolor: activeNav === nav ? "rgba(0,27,63,0.10)" : "rgba(0,0,0,0.04)",
                  color: theme.primary.main,
                },
                minWidth: 0,
                "& .MuiButton-startIcon": { mr: 0.5 },
              }}
            >
              {label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 1, sm: 2, md: 3 },
          pb: { xs: "calc(82px + env(safe-area-inset-bottom))", sm: 2, md: 3 },
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
              sx={{ mt: { xs: 1, sm: 3 }, mb: { xs: 11, sm: 4 } }}
            >
              {/* Hero */}
              <Box component={motion.div} variants={motionFadeUp} sx={{ mb: 3 }}>
                {/* Hero — two lines: animated verb+polarity on line 1, "professors." on line 2 */}
                <Box component="h1" sx={{ m: 0 }}>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      mt: 1,
                      fontSize: { xs: "2.8rem", sm: "3.6rem" },
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
                  </Typography>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      fontSize: { xs: "2.8rem", sm: "3.6rem" },
                    }}
                  >
                    professors.
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    mt: 1.5,
                    color: theme.text.secondary,
                    fontSize: { xs: "0.925rem", sm: "1.05rem" },
                    lineHeight: 1.6,
                    maxWidth: "40ch",
                  }}
                >
                  Real reviews from real students. Help each other choose better.
                </Typography>
                {/* Badges */}
                <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  <Box sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1,
                    py: 0.4,
                    borderRadius: "8px",
                    bgcolor: "rgba(0,27,63,0.07)",
                    border: "1px solid rgba(0,27,63,0.12)",
                  }}>
                    <SchoolIcon sx={{ fontSize: 12, color: theme.primary.main }} />
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: theme.primary.main }}>
                      Constructor University Bremen
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1,
                    py: 0.4,
                    borderRadius: "8px",
                    bgcolor: "rgba(0,180,0,0.07)",
                    border: "1px solid rgba(0,180,0,0.15)",
                  }}>
                    <LockOutlinedIcon sx={{ fontSize: 12, color: "#16a34a" }} />
                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#16a34a" }}>
                      Anonymous
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Feature cards */}
              <Box component={motion.div} variants={motionFadeUp} sx={{ mb: 3 }}>
                {/* Top wide card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 1.5,
                    borderRadius: "16px",
                    bgcolor: theme.primary.main,
                    border: "1px solid rgba(0,27,63,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    cursor: "pointer",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 32px rgba(0,27,63,0.25)",
                    },
                  }}
                  onClick={() => handleNavChange("chat")}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: "white", mb: 0.5 }}>
                      Ask our AI anything
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                      Powered by real student reviews. Find out who to take.
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <AutoAwesomeIcon sx={{ color: "rgba(255,255,255,0.85)", fontSize: 22 }} />
                  </Box>
                </Paper>

                {/* Bottom two cards */}
                <Stack direction="row" spacing={1.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: "16px",
                      bgcolor: "rgba(227,30,36,0.08)",
                      border: "1px solid rgba(227,30,36,0.15)",
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.18s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                    onClick={() => handleNavChange("rate")}
                  >
                    <RateReviewOutlinedIcon sx={{ fontSize: 22, color: theme.secondary.main, mb: 0.5 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", mb: 0.25 }}>
                        Rate a professor
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: theme.text.secondary }}>
                        Anonymous · 2 min
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: "16px",
                      bgcolor: "rgba(0,27,63,0.06)",
                      border: "1px solid rgba(0,27,63,0.10)",
                      minHeight: 120,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.18s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                    onClick={() => handleNavChange("reviews")}
                  >
                    <MenuBookOutlinedIcon sx={{ fontSize: 22, color: theme.primary.main, mb: 0.5 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", mb: 0.25 }}>
                        Read reviews
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: theme.text.secondary }}>
                        See what students are saying
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Box>

              {/* CTAs */}
              <Stack
                component={motion.div}
                variants={motionFadeUp}
                spacing={1}
                sx={{ mb: 3 }}
              >
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => handleNavChange("rate")}
                  sx={{
                    py: 1.5,
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "0.9375rem",
                  }}
                >
                  Rate a professor now
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => handleNavChange("reviews")}
                    sx={{ py: 1.25, borderRadius: "14px", fontWeight: 700 }}
                  >
                    Browse reviews
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => handleNavChange("chat")}
                    sx={{ py: 1.25, borderRadius: "14px", fontWeight: 700 }}
                  >
                    Chat with AI
                  </Button>
                </Stack>
                <Button
                  component={Link}
                  href="/professors"
                  variant="outlined"
                  color="primary"
                  fullWidth
                  sx={{ py: 1.25, borderRadius: "14px", fontWeight: 700 }}
                >
                  Browse all professors
                </Button>
              </Stack>
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
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {/* Chat header */}
              <Box sx={{
                px: { xs: 2, sm: 2.5 },
                py: 1.25,
                bgcolor: theme.primary.main,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
              }}>
                <Box sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "10px",
                  bgcolor: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <SchoolIcon sx={{ color: "white", fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: "white", lineHeight: 1.3 }}>
                    AI Professor Assistant
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", lineHeight: 1 }}>
                    Powered by real student reviews
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.4,
                  borderRadius: "20px",
                  bgcolor: "rgba(34,197,94,0.2)",
                }}>
                  <Box sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#22c55e",
                  }} />
                  <Typography sx={{ fontSize: "0.7rem", color: "#86efac", fontWeight: 600 }}>
                    Online
                  </Typography>
                </Box>
              </Box>

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
                  bottom: 0,
                  zIndex: 1,
                }}
              >
                {/* Suggestion chips — only shown on fresh/empty chat */}
                {messages.length <= 1 && <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 0.75,
                    mb: 1.25,
                  }}
                >
                  {[
                    { label: "Top rated profs", icon: <StarBorderOutlinedIcon sx={{ fontSize: 14 }} />, msg: "Who are the highest rated professors?" },
                    { label: "Course tips", icon: <LightbulbOutlinedIcon sx={{ fontSize: 14 }} />, msg: "What are the tips for succeeding in courses?" },
                    { label: "Easy graders", icon: <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />, msg: "Which professors are known for being fair and approachable?" },
                    { label: "How to review", icon: <EditOutlinedIcon sx={{ fontSize: 14 }} />, msg: "How do I submit a review?" },
                  ].map(({ label, icon, msg }) => (
                    <Button
                      key={label}
                      variant="outlined"
                      size="small"
                      startIcon={icon}
                      onClick={() => sendMessage(msg)}
                      disabled={isLoading}
                      sx={{
                        borderRadius: "10px",
                        borderColor: "rgba(0,0,0,0.1)",
                        color: theme.text.secondary,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        px: 1.25,
                        py: 0.625,
                        justifyContent: "flex-start",
                        bgcolor: "white",
                        minWidth: 0,
                        "& .MuiButton-startIcon": { mr: 0.5 },
                        "&:hover": {
                          borderColor: theme.primary.main,
                          color: theme.primary.main,
                          bgcolor: "rgba(0,27,63,0.04)",
                        },
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Box>}
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
                  onClick={() => sendMessage()}
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

      {/* Mobile navigation — floating pill */}
      <Box
        sx={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: "calc(12px + env(safe-area-inset-bottom))",
          zIndex: 60,
          display: { xs: "block", sm: "none" },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          <BottomNavigation
            showLabels
            value={activeNav}
            onChange={(_, value) => handleNavChange(value)}
            sx={{
              height: 58,
              bgcolor: "transparent",
              "& .MuiBottomNavigationAction-root": {
                minWidth: 0,
                flex: 1,
                py: 0.75,
                gap: 0.25,
                color: "#9CA3AF",
                "&.Mui-selected": {
                  color: theme.primary.main,
                },
                "& .MuiBottomNavigationAction-label": {
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  "&.Mui-selected": {
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  },
                },
              },
            }}
          >
            <BottomNavigationAction label="Home" value="home" icon={<HomeOutlinedIcon sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="Rate" value="rate" icon={<StarBorderOutlinedIcon sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="Reviews" value="reviews" icon={<ExploreOutlinedIcon sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="Chat" value="chat" icon={<ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 20 }} />} />
            <BottomNavigationAction label="More" value="more" icon={<MoreHorizIcon sx={{ fontSize: 20 }} />} />
          </BottomNavigation>
        </Paper>
      </Box>

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
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "20px",
            "@media (max-width:600px)": {
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              margin: 0,
              width: "100%",
              maxWidth: "100%",
              borderRadius: "20px 20px 0 0",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem" }}>More</Typography>
            <IconButton
              size="small"
              onClick={() => { setOpenMoreModal(false); setActiveNav("home"); }}
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 1.5, pb: 2 }}>
          {[
            {
              label: "All Professors",
              sublabel: "Browse ratings for every professor",
              icon: <SchoolIcon />,
              href: "/professors",
            },
            {
              label: "How to Use",
              sublabel: "Learn how the platform works",
              icon: <HelpOutlineIcon />,
              action: () => { setOpenMoreModal(false); setActiveNav("home"); setOpenHowToUseModal(true); },
            },
            {
              label: "Guidelines",
              sublabel: "Community rules & review standards",
              icon: <GavelOutlinedIcon />,
              action: () => { setOpenMoreModal(false); setActiveNav("home"); setOpenImprintModal(true); },
            },
            {
              label: "Privacy Policy",
              sublabel: "How we handle your data",
              icon: <LockOutlinedIcon />,
              action: () => { setOpenMoreModal(false); setActiveNav("home"); setOpenPrivacyModal(true); },
            },
            {
              label: "Report a Bug",
              sublabel: "Something not working? Let us know",
              icon: <BugReportOutlinedIcon />,
              action: () => { setOpenMoreModal(false); setActiveNav("home"); setOpenReportBugModal(true); },
            },
          ].map(({ label, sublabel, icon, action, href }, index, arr) => (
            <Box key={label}>
              <ListItemButton
                {...(href ? { component: Link, href, onClick: () => setOpenMoreModal(false) } : { onClick: action })}
                sx={{
                  borderRadius: "12px",
                  py: 1.25,
                  px: 1.5,
                  gap: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: theme.primary.main }}>
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  secondary={sublabel}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                  secondaryTypographyProps={{ fontSize: "0.775rem", lineHeight: 1.4 }}
                />
                <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 18, flexShrink: 0 }} />
              </ListItemButton>
              {index < arr.length - 1 && (
                <Divider sx={{ mx: 1.5, borderColor: "rgba(0,0,0,0.05)" }} />
              )}
            </Box>
          ))}
        </DialogContent>
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
        <>
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
        </>
      </Box>
      {/* Review Reminder Popup */}
      <Dialog
        open={showReviewReminderPopup}
        onClose={handleReminderClose}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "20px",
            margin: "16px",
            width: "calc(100% - 32px)",
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", pt: 3, pb: 0.5 }}>
          <Box sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            bgcolor: "rgba(0,27,63,0.08)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
          }}>
            <SchoolIcon sx={{ color: theme.primary.main, fontSize: "1.6rem" }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.05rem", sm: "1.15rem" }, display: "block" }}>
            Share Your Experience
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: theme.text.secondary, lineHeight: 1.6 }}>
            Help other students by rating a professor you&apos;ve had. Your
            anonymous review makes a real difference.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: "12px 20px 20px", flexDirection: "column", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => { setShowReviewReminderPopup(false); handleNavChange("rate"); }}
            sx={{ py: 1.25, borderRadius: "12px", fontWeight: 700 }}
          >
            Rate a Professor
          </Button>
          <Button
            fullWidth
            onClick={handleReminderClose}
            sx={{ color: theme.text.secondary, py: 0.75, borderRadius: "12px" }}
          >
            Remind me later
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
