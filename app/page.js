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
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import { SubmitReviewModal } from "./components/SubmitReviewModal";
import { ViewReviewsModal } from "./components/ViewReviewsModal";
import { ActionButtons } from "./components/ActionButtons";
import reviews from "../reviews.json";
import { TipsModal } from "./components/TipsModal";
import { ImprintModal } from "./components/ImprintModal";
import { chatService } from "./services/chatService";
import { HowToUseModal } from "./components/HowToUseModal";

const messageStyles = {
  assistant: {
    bgcolor: "#001B3F",
    color: "#FFFFFF",
    borderRadius: "20px 20px 20px 5px",
  },
  user: {
    bgcolor: "#E31E24",
    color: "#FFFFFF",
    borderRadius: "20px 20px 5px 20px",
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
        "Hi! I am the Rate My Professor ai support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [message, setMessage] = useState("");
  const [openRateModal, setOpenRateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openTipsModal, setOpenTipsModal] = useState(false);
  const [openImprintModal, setOpenImprintModal] = useState(false);
  const [openHowToUseModal, setOpenHowToUseModal] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
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
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

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
      await chatService.saveChat(finalMessages);
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
      await chatService.saveChat(errorMessages);
    }
  };
  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f5f5",
        overflow: "hidden",
        maxWidth: "100vw",
      }}
    >
      <Box
        component="header"
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#001B3F",
          color: "white",
          textAlign: "center",
          boxShadow: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: "white",
            fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            mb: { xs: 0.5, sm: 1 },
          }}
        >
          Rate My Professor AI Assistant
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: "white",
            fontSize: { xs: "0.9rem", sm: "1rem" },
            mb: { xs: 1, sm: 2 },
            opacity: 0.9,
          }}
        >
          Rate your best and worst professors
        </Typography>
        <ActionButtons
          onRateClick={() => setOpenRateModal(true)}
          onViewClick={() => setOpenViewModal(true)}
          onTipsClick={() => setOpenTipsModal(true)}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "transparent",
          }}
        >
          {/* Chat messages container */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              p: { xs: 1, sm: 2 },
              bgcolor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.role === "assistant" ? "flex-start" : "flex-end",
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    maxWidth: { xs: "85%", sm: "80%" },
                    ...messageStyles[message.role],
                    position: "relative",
                    "& .timestamp": {
                      position: "absolute",
                      bottom: -18,
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      color: "text.secondary",
                      right: message.role === "user" ? 0 : "auto",
                      left: message.role === "assistant" ? 0 : "auto",
                    },
                    mb: 3,
                    wordBreak: "break-word",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <Typography
                          variant="body1"
                          component="div"
                          sx={{ mb: 1 }}
                        >
                          {children}
                        </Typography>
                      ),
                      h1: ({ children }) => (
                        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
                          {children}
                        </Typography>
                      ),
                      h2: ({ children }) => (
                        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                          {children}
                        </Typography>
                      ),
                      li: ({ children }) => (
                        <Typography
                          variant="body1"
                          component="li"
                          sx={{ mb: 0.5 }}
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
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Box
            sx={{
              p: { xs: 1, sm: 1.5, md: 2 },
              bgcolor: "#f8f9fa",
              borderTop: 1,
              borderColor: "divider",
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              pb: { xs: 2, sm: 1.5 },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "flex-end",
                maxHeight: { xs: "80px", sm: "none" },
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
                    borderRadius: { xs: 2, sm: 3 },
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    "&:hover fieldset": {
                      borderColor: "#001B3F",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#001B3F",
                    },
                  },
                  "& .MuiInputBase-root": {
                    maxHeight: { xs: "80px", sm: "none" },
                    overflowY: "auto",
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={!message.trim()}
                sx={{
                  borderRadius: { xs: 2, sm: 3 },
                  minWidth: { xs: "40px", sm: "60px" },
                  height: { xs: "36px", sm: "40px" },
                  px: { xs: 1, sm: 2 },
                  textTransform: "none",
                  bgcolor: "#E31E24",
                  "&:hover": {
                    bgcolor: "#C31419",
                  },
                  flexShrink: 0,
                }}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
      <SubmitReviewModal
        open={openRateModal}
        onClose={() => setOpenRateModal(false)}
      />
      <ViewReviewsModal
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
      />
      <TipsModal open={openTipsModal} onClose={() => setOpenTipsModal(false)} />
      <ImprintModal
        open={openImprintModal}
        onClose={() => setOpenImprintModal(false)}
      />
      <HowToUseModal
        open={openHowToUseModal}
        onClose={() => setOpenHowToUseModal(false)}
      />
      <Box
        component="footer"
        sx={{
          p: { xs: 0.5, sm: 2 },
          bgcolor: "#001B3F",
          color: "white",
          textAlign: "center",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          gap: { xs: 0.5, sm: 2 },
          "& .MuiButton-root": {
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
            minWidth: { xs: "auto", sm: "auto" },
            px: { xs: 1, sm: 2 },
          },
        }}
      >
        <Button
          variant="text"
          onClick={() => setOpenHowToUseModal(true)}
          sx={{
            color: "white",
            textDecoration: "underline",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "none",
            },
          }}
        >
          How to Use
        </Button>
        <Button
          variant="text"
          href="https://www.instagram.com/rate_my_professor/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "white",
            textDecoration: "underline",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "none",
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
            textDecoration: "underline",
            "&:hover": {
              bgcolor: "transparent",
              textDecoration: "none",
            },
          }}
        >
          Imprint
        </Button>
      </Box>
    </Box>
  );
}
