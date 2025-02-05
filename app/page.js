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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am the Rate My Professor support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f5f5",
      }}
    >
      <Box
        component="header"
        sx={{
          p: 3,
          bgcolor: "primary.main",
          color: "white",
          textAlign: "center",
          boxShadow: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Rate My Professor Assistant
        </Typography>
        <Typography variant="subtitle1">
          Ask questions about professors and courses
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: "800px",
            height: "700px",
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
              p: 2,
              bgcolor: "#ffffff",
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
                    bgcolor:
                      message.role === "assistant"
                        ? "primary.light"
                        : "secondary.light",
                    color:
                      message.role === "assistant"
                        ? "primary.contrastText"
                        : "secondary.contrastText",
                    borderRadius:
                      message.role === "assistant"
                        ? "20px 20px 20px 5px"
                        : "20px 20px 5px 20px",
                    "& code": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      borderRadius: 1,
                      padding: "2px 4px",
                      fontFamily: "monospace",
                    },
                    "& pre": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
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
              p: 2,
              bgcolor: "#f8f9fa",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask about professors, courses, or ratings..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  size="medium"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    textTransform: "none",
                  }}
                >
                  Send
                </Button>
              </Stack>
            </form>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
