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
} from "@mui/material";
import { tipsService } from "../services/tipsService";

export const TipsModal = ({ open, onClose }) => {
  const [tips, setTips] = useState([]);
  const [tipFormData, setTipFormData] = useState("");
  const [loading, setLoading] = useState(true);

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
        await tipsService.addTip(tipFormData);
        await loadTips();
        setTipFormData("");
      } catch (error) {
        console.error("Error adding tip:", error);
        alert("Failed to add tip");
      }
    }
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
      <DialogTitle>Submit and View Tips for Success</DialogTitle>
      <DialogContent>
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
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Tips from Students:</Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            tips.map((tip) => (
              <Typography key={tip.id} sx={{ mt: 2 }}>
                {tip.content}
              </Typography>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
