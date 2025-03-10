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
      maxWidth="md"
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
        }}
      >
        <Typography variant="h6" component="h2">
          Privacy Policy
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overview
          </Typography>
          <Typography variant="body1" paragraph>
            At Rate My Professor, we value your privacy and are committed to
            protecting your personal information. This Privacy Policy explains
            what information we collect, how we use it, and what rights you have
            in relation to your data.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data We Collect
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            1. Anonymous User Identifier
          </Typography>
          <Typography variant="body1" paragraph>
            We generate and store a random, anonymous identifier in your
            browser&apos;s local storage. This ID does not contain any personally
            identifiable information but allows us to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>
              Link your reviews and reactions to prevent duplicate submissions
            </li>
            <li>Apply rate limiting to prevent abuse of our platform</li>
            <li>Allow you to edit or delete your own content</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            2. User-Generated Content
          </Typography>
          <Typography variant="body1" paragraph>
            When you use our platform, we store:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>
              Reviews you submit (professor name, subject, rating, review text)
            </li>
            <li>Reactions to reviews (thumbs up/down)</li>
            <li>Replies to reviews</li>
            <li>Timestamps of when content was created</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            3. Usage Data
          </Typography>
          <Typography variant="body1" paragraph>
            We collect anonymized usage information, including:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Chat conversations with our AI assistant</li>
            <li>Search queries</li>
            <li>Features accessed</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            4. Technical Information
          </Typography>
          <Typography variant="body1" paragraph>
            Our servers automatically log:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>IP address (for security and rate limiting purposes only)</li>
            <li>Browser type and version</li>
            <li>Access times and dates</li>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            How We Use Your Data
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            1. Service Provision
          </Typography>
          <Typography variant="body1" paragraph>
            We use your data to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Display professor reviews to other users</li>
            <li>Allow you to manage your own content</li>
            <li>Power our AI assistant&apos;s responses</li>
            <li>Improve search results and recommendations</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            2. Service Improvement
          </Typography>
          <Typography variant="body1" paragraph>
            We analyze usage patterns to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Improve the user interface and experience</li>
            <li>Fix bugs and performance issues</li>
            <li>Develop new features</li>
          </Typography>

          <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: "bold" }}>
            3. Security and Moderation
          </Typography>
          <Typography variant="body1" paragraph>
            We process data to:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>Prevent spam and abuse</li>
            <li>Moderate content for policy violations</li>
            <li>Protect against security threats</li>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your data as follows:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>
              User content (reviews, reactions, replies): Until you delete it or
              for up to 1 year
            </li>
            <li>
              Anonymous user ID: Until you clear your browser storage or use the
              &quot;Delete My Data&quot; feature
            </li>
            <li>Chat history: 90 days</li>
            <li>Server logs: 30 days</li>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Privacy Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the following rights regarding your data:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>
              <strong>Access:</strong> You can view all content you&apos;ve created
              from the &quot;My Content&quot; section
            </li>
            <li>
              <strong>Delete:</strong> You can delete individual reviews/replies
              or use the &quot;Delete My Data&quot; option to remove all your data
            </li>
            <li>
              <strong>Portability:</strong> You can export your reviews and
              other content using the &quot;Export My Data&quot; option
            </li>
          </Typography>
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            To exercise these rights, use the relevant features in the app or
            contact us.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Third-Party Services
          </Typography>
          <Typography variant="body1" paragraph>
            Our service integrates with the following third-party services:
          </Typography>
          <Typography component="ul" sx={{ pl: 4 }}>
            <li>
              <strong>Firebase:</strong> For database storage and hosting (see{" "}
              <Link
                href="https://firebase.google.com/support/privacy"
                target="_blank"
                rel="noopener"
              >
                Firebase Privacy Policy
              </Link>
              )
            </li>
            <li>
              <strong>OpenAI:</strong> Powers our AI assistant (see{" "}
              <Link
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener"
              >
                OpenAI Privacy Policy
              </Link>
              )
            </li>
            <li>
              <strong>Pinecone:</strong> Vector database for AI search
              functionality (see{" "}
              <Link
                href="https://www.pinecone.io/privacy/"
                target="_blank"
                rel="noopener"
              >
                Pinecone Privacy Policy
              </Link>
              )
            </li>
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Changes To This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new privacy policy on this page
            and updating the &quot;Last Updated&quot; date.
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: "italic", mt: 2 }}>
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
