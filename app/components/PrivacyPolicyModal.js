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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import StorageIcon from "@mui/icons-material/Storage";
import WebIcon from "@mui/icons-material/Web";

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
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1, sm: 2 },
          width: { xs: "95%", sm: "90%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
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
        🔒 Privacy Policy
      </DialogTitle>

      <DialogContent>
        <List>
          {/* Data We Collect Section */}
          <ListItem sx={{ pt: 1 }}>
            <ListItemIcon>
              <DataUsageIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  component="div"
                >
                  Data We Collect
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="div"
                >
                  • Anonymous user id (stored in local storage)
                  <br />
                  • User content (reviews, reactions, replies)
                  <br />
                  • Usage data (queries, features accessed)
                  <br />• Basic technical information (for security)
                </Typography>
              }
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* How We Use Your Data Section */}
          <ListItem>
            <ListItemIcon>
              <StorageIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  component="div"
                >
                  How We Use Your Data
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  component="div"
                >
                  • Provide and improve the services
                  <br />
                  • Display professor reviews to other users
                  <br />
                  • Power AI assistant features
                  <br />• Prevent spam and abuse
                </Typography>
              }
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* Third-Party Services Section */}
          <ListItem>
            <ListItemIcon>
              <WebIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  component="div"
                >
                  Third-Party Services
                </Typography>
              }
              secondary={
                <Box component="div" sx={{ mt: 0.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="div"
                  >
                    •{" "}
                    <Link
                      href="https://firebase.google.com/support/privacy"
                      target="_blank"
                      rel="noopener"
                    >
                      Firebase
                    </Link>
                    : Database storage
                    <br />•{" "}
                    <Link
                      href="https://openai.com/policies/privacy-policy"
                      target="_blank"
                      rel="noopener"
                    >
                      OpenAI
                    </Link>
                    : AI assistant
                    <br />•{" "}
                    <Link
                      href="https://www.pinecone.io/privacy/"
                      target="_blank"
                      rel="noopener"
                    >
                      Pinecone
                    </Link>
                    : Vector database
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        </List>

        <Box
          component="div"
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            display="block"
          >
            Last Updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          size="large"
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontSize: "1rem",
            textTransform: "none",
          }}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};
