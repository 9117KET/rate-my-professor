"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";

export const PrivacyPolicyModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      aria-labelledby="privacy-policy-title"
    >
      <DialogTitle
        id="privacy-policy-title"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
        }}
      >
        <Typography variant="h6" component="h2">
          Privacy Policy
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Typography variant="body2" paragraph>
          At Rate My Professor, we value your privacy and are committed to
          protecting your personal information. This summarized policy explains
          our data practices.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          Data We Collect
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>Anonymous user identifier (stored in local storage)</li>
          <li>User content (reviews, reactions, replies)</li>
          <li>Usage data (queries, features accessed)</li>
          <li>Basic technical information (for security)</li>
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          How We Use Your Data
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>Provide and improve our services</li>
          <li>Display professor reviews to other users</li>
          <li>Power AI assistant features</li>
          <li>Prevent spam and abuse</li>
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          Your Rights
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
          <li>Access your content via &quot;My Content&quot; section</li>
          <li>Delete individual items or all your data</li>
          <li>Export your data</li>
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          Third-Party Services
        </Typography>
        <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 1 }}>
          <li>
            <Link
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener"
            >
              Firebase
            </Link>
            : Database storage
          </li>
          <li>
            <Link
              href="https://openai.com/policies/privacy-policy"
              target="_blank"
              rel="noopener"
            >
              OpenAI
            </Link>
            : AI assistant
          </li>
          <li>
            <Link
              href="https://www.pinecone.io/privacy/"
              target="_blank"
              rel="noopener"
            >
              Pinecone
            </Link>
            : Vector database
          </li>
        </Typography>

        <Typography
          variant="body2"
          sx={{ fontStyle: "italic", mt: 2, fontSize: "0.75rem" }}
        >
          Last Updated: {new Date().toLocaleDateString()}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ py: 1 }}>
        <Button onClick={onClose} color="primary" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
