"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function BugReports() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    // Simple password check - in a real app, use proper authentication
    if (password === "admin123") {
      setAuthenticated(true);
      localStorage.setItem("bugReportsAuth", "true");
      fetchReports();
    } else {
      setError("Invalid password");
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/bug-reports", {
        headers: {
          // Simple admin token for demo purposes
          Authorization: "Bearer admin123",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bug reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching bug reports:", err);
      setError("Failed to load bug reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Check for existing authentication on load
  useEffect(() => {
    const isAuth = localStorage.getItem("bugReportsAuth");
    if (isAuth === "true") {
      setAuthenticated(true);
      fetchReports();
    }
  }, []);

  // Login form
  if (!authenticated) {
    return (
      <Box sx={{ maxWidth: 500, mx: "auto", mt: 8, p: 3 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Bug Reports Access
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button variant="contained" onClick={handleLogin} fullWidth>
            Access Reports
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bug Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Alert severity="info">No bug reports found</Alert>
      ) : (
        <List sx={{ width: "100%" }}>
          {reports.map((report) => (
            <Paper key={report.id} sx={{ mb: 3, overflow: "hidden" }}>
              <ListItem
                sx={{
                  p: 3,
                  bgcolor:
                    report.status === "new"
                      ? "rgba(33, 150, 243, 0.08)"
                      : "inherit",
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {report.issueType || "Unknown Issue"}
                    </Typography>
                    <Chip
                      label={report.status || "new"}
                      size="small"
                      color={
                        report.status === "resolved"
                          ? "success"
                          : report.status === "inProgress"
                          ? "warning"
                          : "info"
                      }
                    />
                  </Box>

                  <Typography variant="body1" paragraph>
                    {report.description || "No description provided"}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Submitted: {formatDate(report.timestamp)}
                    {report.email && ` • Email: ${report.email}`}
                  </Typography>

                  {report.screenshot && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Screenshot:
                      </Typography>
                      <Box
                        sx={{
                          border: "1px solid rgba(0,0,0,0.1)",
                          borderRadius: 1,
                          position: "relative",
                          height: 300,
                          bgcolor: "#f5f5f5",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={report.screenshot}
                          alt="Bug Screenshot"
                          fill
                          style={{ objectFit: "contain" }}
                          unoptimized={true}
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = report.screenshot;
                          link.download = `bug-report-${report.id}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download Screenshot
                      </Button>
                    </Box>
                  )}

                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Technical Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        <strong>Report ID:</strong> {report.id}
                      </Typography>
                      {report.stepsToReproduce && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Steps to Reproduce:</strong>
                          <br />
                          {report.stepsToReproduce}
                        </Typography>
                      )}
                      {report.expectedBehavior && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Expected Behavior:</strong>
                          <br />
                          {report.expectedBehavior}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Browser:</strong>{" "}
                        {report.systemInfo?.browserName ||
                          report.userAgent ||
                          "Unknown"}
                      </Typography>
                      {report.url && (
                        <Typography variant="body2">
                          <strong>URL:</strong> {report.url}
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {authenticated && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={fetchReports} disabled={loading}>
            Refresh Reports
          </Button>
          <Button
            variant="text"
            color="error"
            onClick={() => {
              localStorage.removeItem("bugReportsAuth");
              setAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </Box>
      )}
    </Box>
  );
}
