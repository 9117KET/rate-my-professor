import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";

export const TipsModal = ({ open, onClose }) => {
  const [tips, setTips] = useState([]);
  const [tipFormData, setTipFormData] = useState("");

  const handleAddTip = () => {
    if (tipFormData.trim()) {
      setTips([...tips, tipFormData]);
      setTipFormData("");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          {tips.map((tip, index) => (
            <Typography key={index} sx={{ mt: 2 }}>
              {tip}
            </Typography>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
