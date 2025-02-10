"use client";

import Image from "next/image";
import { useState } from "react";
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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am the Rate My Professor support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [openRateModal, setOpenRateModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openTipsModal, setOpenTipsModal] = useState(false);
  const [openImprintModal, setOpenImprintModal] = useState(false);
  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          const otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
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
      }}
    >
      <Box
        component="header"
        sx={{
          p: 3,
          bgcolor: "#001B3F",
          color: "white",
          textAlign: "center",
          boxShadow: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ color: "white" }}>
          Rate My Professor Assistant
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 1, sm: 2, md: 3 },
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: "800px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
                    p: 2,
                    maxWidth: "80%",
                    ...messageStyles[message.role],
                    "& code": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 1,
                      padding: "2px 4px",
                      fontFamily: "monospace",
                    },
                    "& pre": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: 1,
                      padding: 1,
                      overflowX: "auto",
                    },
                    "& blockquote": {
                      borderLeft: "4px solid",
                      borderColor: "rgba(0, 0, 0, 0.1)",
                      margin: 0,
                      paddingLeft: 2,
                      fontStyle: "italic",
                    },
                    "& ul, & ol": {
                      marginLeft: 2,
                      marginTop: 1,
                      marginBottom: 1,
                    },
                    "& h1, & h2, & h3, & h4, & h5, & h6": {
                      marginTop: 2,
                      marginBottom: 1,
                    },
                    "& table": {
                      borderCollapse: "collapse",
                      width: "100%",
                      "& th, & td": {
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        padding: "8px",
                        textAlign: "left",
                      },
                      "& th": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    },
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
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input area */}
          <Box
            sx={{
              p: { xs: 1, sm: 2 },
              bgcolor: "#f8f9fa",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about professors..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    "&:hover fieldset": {
                      borderColor: "#001B3F",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#001B3F",
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={!message.trim()}
                sx={{
                  borderRadius: 3,
                  px: { xs: 2, sm: 4 },
                  minWidth: { xs: "60px", sm: "80px" },
                  textTransform: "none",
                  bgcolor: "#E31E24",
                  "&:hover": {
                    bgcolor: "#C31419",
                  },
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
      <Box
        component="footer"
        sx={{
          p: 2,
          bgcolor: "#001B3F",
          color: "white",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Button
          variant="text"
          href="https://www.instagram.com/constructor.university/"
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
          Follow our Instagram
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
          Imprint & Legal Notice
        </Button>
      </Box>
    </Box>
  );
}
