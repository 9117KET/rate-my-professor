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
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { tipsService } from "../services/tipsService";
import { formatTimestamp } from "../utils/formatters";
import { formatTextWithLinks } from "../utils/linkFormatter";

export const TipsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tips, setTips] = useState([]);
  const [tipFormData, setTipFormData] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTip, setEditingTip] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTip, setSelectedTip] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tipToDelete, setTipToDelete] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const handleAddTip = async () => {
    if (tipFormData.trim()) {
      try {
        const newTip = await tipsService.addTip(tipFormData);
        const tipWithDefaults = {
          ...newTip,
          createdAt: newTip.createdAt || new Date(),
          lastEdited: null,
          userId: localStorage.getItem(`tip_${newTip.id}_userId`),
        };
        setTips([tipWithDefaults, ...tips]);
        setTipFormData("");
      } catch (error) {
        console.error("Error adding tip:", error);
        alert("Failed to add tip");
      }
    }
  };

  const handleEditTip = async (tipId, newContent) => {
    try {
      await tipsService.updateTip(tipId, newContent);
      setTips(
        tips.map((tip) =>
          tip.id === tipId ? { ...tip, content: newContent } : tip
        )
      );
      setEditingTip(null);
    } catch (error) {
      console.error("Error updating tip:", error);
      alert("Failed to update tip");
    }
  };

  const handleDeleteTip = async (tipId) => {
    try {
      await tipsService.deleteTip(tipId);
      setTips(tips.filter((tip) => tip.id !== tipId));
    } catch (error) {
      console.error("Error deleting tip:", error);
      alert("Failed to delete tip");
    }
  };

  const canModifyTip = (tip) => {
    if (!mounted) return false;

    const createdAt = new Date(tip.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    const storedUserId = localStorage.getItem(`tip_${tip.id}_userId`);

    return hoursDiff <= 48 && tip.userId === storedUserId;
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
            <TextField
              fullWidth
              label="Share a tip"
              value={tipFormData}
              onChange={(e) => setTipFormData(e.target.value)}
              margin="normal"
              multiline
              rows={isMobile ? 2 : 3}
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
                    {mounted && canModifyTip(tip) && (
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setSelectedTip(tip);
                        }}
                        sx={{ ml: 1, p: { xs: 0.5, sm: 1 } }}
                      >
                        <MoreVertIcon
                          fontSize={isMobile ? "small" : "medium"}
                        />
                      </IconButton>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      alignSelf: "flex-end",
                    }}
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

      {mounted && (
        <>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                minWidth: 120,
                boxShadow: 2,
                mt: 0.5,
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setEditingTip(selectedTip.id);
                setTipFormData(selectedTip.content);
                setAnchorEl(null);
              }}
              sx={{
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                setTipToDelete(selectedTip.id);
                setDeleteConfirmOpen(true);
                setAnchorEl(null);
              }}
              sx={{
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: "0.85rem", sm: "0.9rem" },
              }}
            >
              Delete
            </MenuItem>
          </Menu>

          <Dialog
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            PaperProps={{
              sx: {
                width: { xs: "85%", sm: "auto" },
                minWidth: { sm: 300 },
                p: { xs: 1, sm: 1 },
                borderRadius: { xs: 1, sm: 2 },
              },
            }}
          >
            <DialogTitle
              sx={{
                fontSize: { xs: "1.1rem", sm: "1.2rem" },
                pt: { xs: 2, sm: 2 },
                pb: { xs: 1, sm: 1 },
              }}
            >
              Delete Tip
            </DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                Are you sure you want to delete this tip?
              </Typography>
            </DialogContent>
            <DialogActions
              sx={{ px: { xs: 2, sm: 2 }, py: { xs: 1, sm: 1.5 } }}
            >
              <Button
                onClick={() => setDeleteConfirmOpen(false)}
                sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDeleteTip(tipToDelete);
                  setDeleteConfirmOpen(false);
                  setTipToDelete(null);
                }}
                color="error"
                variant="contained"
                sx={{ fontSize: { xs: "0.85rem", sm: "0.9rem" } }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Dialog>
  );
};
