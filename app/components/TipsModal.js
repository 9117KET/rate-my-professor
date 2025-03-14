"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Divider,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { tipsService } from "../services/tipsService";
import { formatTimestamp } from "../utils/formatters";
import { formatTextWithLinks } from "../utils/linkFormatter";
import { validateText, TIP_LIMITS } from "../utils/textValidation";
import { contentModerationService } from "../services/contentModerationService";
import { userTrackingService } from "../services/userTrackingService";

export const TipsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tips, setTips] = useState([]);
  const [tipFormData, setTipFormData] = useState("");
  const [tipError, setTipError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userId = userTrackingService.getOrCreateUserId();
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (open) {
      loadTips();
    }
  }, [open]);

  const loadTips = async () => {
    try {
      const fetchedTips = await tipsService.getAllTips();
      setTips(fetchedTips);
    } catch (error) {
      console.error("Error loading tips:", error);
      alert("Failed to load tips");
    } finally {
      setLoading(false);
    }
  };

  const handleTipChange = (e) => {
    const newTip = e.target.value;
    setTipFormData(newTip);
    setTipError(
      validateText(newTip, {
        minLength: TIP_LIMITS.MIN_LENGTH,
        maxLength: TIP_LIMITS.MAX_LENGTH,
        type: "tip",
      })
    );
  };

  const handleAddTip = async () => {
    if (typeof tipFormData !== "string" || !tipFormData.trim()) return;

    try {
      // Content moderation check
      const moderationResult = await contentModerationService.moderateContent(
        tipFormData
      );
      if (!moderationResult.isValid) {
        setTipError(moderationResult.issues.join(". "));
        return;
      }

      const userId = userTrackingService.getOrCreateUserId();
      if (!userId) {
        alert("Unable to submit tip at this time. Please try again later.");
        return;
      }

      const newTip = {
        content: moderationResult.sanitizedText,
        createdAt: new Date().toISOString(),
        userId: userId,
      };

      await tipsService.addTip(newTip);
      loadTips(); // Reload tips after adding
      setTipFormData("");
      setTipError("");
    } catch (error) {
      console.error("Error adding tip:", error);
      alert("Failed to add tip. Please try again.");
    }
  };

  const handleDeleteTip = async (tipId) => {
    if (!currentUserId || deleteInProgress) return;

    try {
      setDeleteInProgress(true);
      await tipsService.deleteTip(tipId, currentUserId);
      setTips(tips.filter((tip) => tip.id !== tipId));
    } catch (error) {
      console.error("Error deleting tip:", error);
      alert(error.message || "Failed to delete tip. Please try again.");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const isUsersTip = (tip) => {
    // For immediate rendering, we check the userId directly
    // The deletion verification will happen in the service
    return tip.userId === currentUserId;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
          pb: { xs: 1, sm: 2 },
          pt: { xs: 2, sm: 3 },
          fontSize: { xs: "1.2rem", sm: "1.4rem" },
          fontWeight: 600,
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        Submit and View TIPS
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        {mounted && (
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography
              variant="subtitle1"
              sx={{
                mt: { xs: 1, sm: 2 },
                mb: 1,
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              Share a tip you used in succeeding at a particular course:
            </Typography>
            <TextField
              fullWidth
              label="Share a tip"
              value={tipFormData}
              onChange={handleTipChange}
              margin="normal"
              multiline
              rows={isMobile ? 2 : 3}
              error={!!tipError}
              helperText={
                tipError ||
                `${tipFormData.length}/${TIP_LIMITS.MAX_LENGTH} characters (minimum ${TIP_LIMITS.MIN_LENGTH})`
              }
              inputProps={{
                maxLength: TIP_LIMITS.MAX_LENGTH,
                minLength: TIP_LIMITS.MIN_LENGTH,
              }}
              sx={{
                mt: { xs: 1, sm: 2 },
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  lineHeight: 1.6,
                },
                "& .MuiInputLabel-root": {
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                },
              }}
            />
            <Button
              onClick={handleAddTip}
              variant="contained"
              disabled={
                !!tipError ||
                !tipFormData ||
                (typeof tipFormData === "string" ? !tipFormData.trim() : true)
              }
              sx={{
                mt: 2,
                height: { xs: 40, sm: 44 },
                minWidth: { xs: "100%", sm: 150 },
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
              }}
            >
              Submit Tip
            </Button>
          </Box>
        )}
        <Divider sx={{ my: { xs: 2, sm: 3 } }} />
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: "1.1rem", sm: "1.2rem" },
              fontWeight: 600,
            }}
          >
            TIPS from Students:
          </Typography>
          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}
            >
              <CircularProgress size={isMobile ? 30 : 40} />
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {tips.map((tip) => (
                <ListItem
                  key={tip.id}
                  sx={{
                    mt: { xs: 1, sm: 2 },
                    p: { xs: 1, sm: 2 },
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    boxShadow: 1,
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        mb: 1,
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        lineHeight: 1.6,
                        flex: 1,
                        wordBreak: "break-word",
                      }}
                    >
                      {formatTextWithLinks(tip.content)}
                    </Typography>
                    {isUsersTip(tip) && (
                      <Tooltip title="Delete your tip">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteTip(tip.id)}
                          disabled={deleteInProgress}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      alignSelf: "flex-end",
                    }}
                    suppressHydrationWarning
                  >
                    {formatTimestamp(tip.createdAt)}
                    {tip.lastEdited &&
                      ` (edited ${formatTimestamp(tip.lastEdited)})`}
                  </Typography>
                </ListItem>
              ))}
              {tips.length === 0 && !loading && (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    my: 3,
                    color: "text.secondary",
                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  }}
                >
                  No tips yet. Be the first to share one!
                </Typography>
              )}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: { xs: 80, sm: 100 },
            height: { xs: 36, sm: 40 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
