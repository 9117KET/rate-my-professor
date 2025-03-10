"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Paper,
  Typography,
  Avatar,
  Container,
  Fade,
  Grow,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SchoolIcon from "@mui/icons-material/School";
import ReactMarkdown from "react-markdown";
import { SubmitReviewModal } from "./components/SubmitReviewModal";
import { ViewReviewsModal } from "./components/ViewReviewsModal";
import { ActionButtons } from "./components/ActionButtons";
import reviews from "../reviews.json";
import { TipsModal } from "./components/TipsModal";
import { ImprintModal } from "./components/ImprintModal";
import { chatService } from "./services/chatService";
import { HowToUseModal } from "./components/HowToUseModal";
import { userTrackingService } from "./services/userTrackingService";
import { reviewsService } from "./services/reviewsService";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import { PrivacyConsentBanner } from "./components/PrivacyConsentBanner";

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
      backgroundColor: theme.primary.light,
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

const formatTimestamp = (date) => {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  }).format(date);
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const messagesEndRef = useRef(null);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [userId, setUserId] = useState(null);

  // Check if user has submitted a review before
  useEffect(() => {
    const hasReviewed = localStorage.getItem("has_submitted_review");
    if (hasReviewed) {
      setHasSubmittedReview(true);
    } else {
      // Show How to Use modal first
      setOpenHowToUseModal(true);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize user ID on component mount
  useEffect(() => {
    try {
      const id = userTrackingService.getOrCreateUserId();
      setUserId(id);
    } catch (error) {
      console.error("Error initializing user ID:", error);
    }
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || !userId) return;

    setIsLoading(true);
    const newMessages = [
      ...messages,
      {
        role: "user",
        content: message,
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
            content: message,
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
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  // Prevent closing the rate modal if user hasn't submitted a review
  const handleRateModalClose = () => {
    if (hasSubmittedReview) {
      setOpenRateModal(false);
    }
  };

  // Handle How to Use modal close
  const handleHowToUseClose = () => {
    setOpenHowToUseModal(false);
    // Show Rate modal after How to Use is closed
    setOpenRateModal(true);
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
        pointerEvents: !hasSubmittedReview ? "none" : "auto",
        opacity: !hasSubmittedReview ? 0.5 : 1,
      }}
    >
      <Box
        component="header"
        sx={{
          p: { xs: 1, sm: 1.5 },
          bgcolor: theme.primary.main,
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          background: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.light} 100%)`,
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background:
              "radial-gradient(circle at 20% 150%, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: { xs: 1, sm: 1.5 },
            }}
          >
            <SchoolIcon
              sx={{
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                mr: 1.5,
                color: theme.secondary.main,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: "white",
                fontSize: { xs: "1.1rem", sm: "1.5rem", md: "1.75rem" },
                fontWeight: 700,
                letterSpacing: "-0.01em",
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              Rate My Professor AI Assistant
            </Typography>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: "white",
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              mb: { xs: 0.75, sm: 1 },
              opacity: 0.9,
              maxWidth: "600px",
              mx: "auto",
              fontWeight: 300,
            }}
          >
            Rate your best and worst professors and get personalized assistance
          </Typography>
          <ActionButtons
            onRateClick={() => setOpenRateModal(true)}
            onViewClick={() => setOpenViewModal(true)}
            onTipsClick={() => setOpenTipsModal(true)}
          />
        </Container>
      </Box>

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
                              component="h1"
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
                              component="h2"
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
                      <Typography className="timestamp" variant="caption">
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
                    setMessage("Who are the highest rated professors?");
                    await sendMessage();
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
                    setMessage("How do I submit a review?");
                    await sendMessage();
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
                    setMessage("What are the tips for succeeding in courses?");
                    await sendMessage();
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
      </Box>
      <SubmitReviewModal
        open={openRateModal}
        onClose={handleRateModalClose}
        onSubmit={handleReviewSubmit}
        loading={isLoading}
        disableClose={!hasSubmittedReview}
      />
      <ViewReviewsModal
        open={openViewModal}
        onClose={() => hasSubmittedReview && setOpenViewModal(false)}
        disableClose={!hasSubmittedReview}
        userId={userId}
      />
      <TipsModal
        open={openTipsModal}
        onClose={() => hasSubmittedReview && setOpenTipsModal(false)}
        disableClose={!hasSubmittedReview}
      />
      <ImprintModal
        open={openImprintModal}
        onClose={() => hasSubmittedReview && setOpenImprintModal(false)}
        disableClose={!hasSubmittedReview}
      />
      <HowToUseModal
        open={openHowToUseModal}
        onClose={handleHowToUseClose}
        disableClose={!hasSubmittedReview}
      />
      <PrivacyPolicyModal
        open={openPrivacyModal}
        onClose={() => setOpenPrivacyModal(false)}
      />
      <PrivacyConsentBanner onPrivacyClick={() => setOpenPrivacyModal(true)} />
      <Box
        component="footer"
        sx={{
          p: { xs: 0.75, sm: 1 },
          bgcolor: theme.primary.main,
          color: "white",
          textAlign: "center",
          display: "flex",
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
    </Box>
  );
}
