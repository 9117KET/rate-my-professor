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
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { tipsService } from "../services/tipsService";
import { formatTimestamp } from "../utils/formatters";
import { formatTextWithLinks } from "../utils/linkFormatter";

export const TipsModal = ({ open, onClose }) => {
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
        },
      }}
    >
      <DialogTitle>Submit and View TIPS</DialogTitle>
      <DialogContent>
        {mounted && (
          <>
            <TextField
              fullWidth
              label="Share a tip"
              value={tipFormData}
              onChange={(e) => setTipFormData(e.target.value)}
              margin="normal"
            />
            <Button onClick={handleAddTip} variant="contained" sx={{ mt: 2 }}>
              Submit Tip
            </Button>
          </>
        )}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">TIPS from Students:</Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            tips.map((tip) => (
              <Box key={tip.id} sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  {editingTip === tip.id ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        flex: 1,
                      }}
                    >
                      <TextField
                        fullWidth
                        value={tipFormData}
                        onChange={(e) => setTipFormData(e.target.value)}
                        multiline
                        sx={{ mr: 2 }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleEditTip(tip.id, tipFormData)}
                        sx={{ minWidth: "auto", ml: 1 }}
                      >
                        Save
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ flex: 1 }}>
                        {formatTextWithLinks(tip.content)}
                      </Typography>
                      {mounted && canModifyTip(tip) && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedTip(tip);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {formatTimestamp(tip.createdAt)}
                  {tip.lastEdited &&
                    ` (edited ${formatTimestamp(tip.lastEdited)})`}
                </Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {mounted && (
        <>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setEditingTip(selectedTip.id);
                setTipFormData(selectedTip.content);
                setAnchorEl(null);
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
            >
              Delete
            </MenuItem>
          </Menu>

          <Dialog
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
          >
            <DialogTitle>Delete Tip</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete this tip?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDeleteTip(tipToDelete);
                  setDeleteConfirmOpen(false);
                  setTipToDelete(null);
                }}
                color="error"
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
