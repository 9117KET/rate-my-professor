import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { formatTimestamp } from "../utils/formatters";

export const ReviewReply = ({
  review,
  reply,
  index,
  userIp,
  onDelete,
  onEdit,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);

  const canModifyReply = () => {
    if (!reply.ipAddress || !userIp) return false;
    const createdAt = new Date(reply.createdAt);
    const now = new Date();
    const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
    return hoursDiff <= 24 && reply.ipAddress === userIp;
  };

  const handleEditSubmit = () => {
    if (editContent.trim() === "") return;
    onEdit(review.id, index, editContent);
    setIsEditing(false);
  };

  return (
    <Box sx={{ pl: 4, pt: 1, ...sx }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        {isEditing ? (
          <Box sx={{ flex: 1, display: "flex", gap: 1 }}>
            <TextField
              size="small"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              fullWidth
              multiline
              maxRows={4}
            />
            <Button size="small" onClick={handleEditSubmit}>
              Save
            </Button>
            <Button size="small" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {reply.content}
            </Typography>
            {canModifyReply() && (
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {formatTimestamp(new Date(reply.createdAt))}
        {reply.lastEdited &&
          ` (edited ${formatTimestamp(new Date(reply.lastEdited))})`}
      </Typography>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setIsEditing(true);
            setAnchorEl(null);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(review.id, index);
            setAnchorEl(null);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};
