import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    <Box
      sx={{
        pl: { xs: 1, sm: 2, md: 4 },
        pt: 1,
        mb: 1.5,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: { xs: 0.5, sm: 1 },
          flexDirection: isEditing ? { xs: "column", sm: "row" } : "row",
          width: "100%",
        }}
      >
        {isEditing ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              width: "100%",
            }}
          >
            <TextField
              size="small"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              fullWidth
              multiline
              maxRows={4}
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                },
                "& .MuiOutlinedInput-root": {
                  padding: { xs: "10px 12px", sm: "12px 14px" },
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 0 } }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleEditSubmit}
                sx={{
                  minWidth: { xs: "80px", sm: "60px" },
                  height: { xs: "36px", sm: "36px" },
                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => setIsEditing(false)}
                sx={{
                  minWidth: { xs: "80px", sm: "60px" },
                  height: { xs: "36px", sm: "36px" },
                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                fontSize: { xs: "0.85rem", sm: "0.875rem" },
                lineHeight: 1.6,
                wordBreak: "break-word",
              }}
            >
              {reply.content}
            </Typography>
            {canModifyReply() && (
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  ml: 0.5,
                  p: { xs: 0.75, sm: 0.75 },
                  alignSelf: "flex-start",
                }}
              >
                <MoreVertIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            )}
          </>
        )}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mt: 0.5,
          fontSize: { xs: "0.7rem", sm: "0.75rem" },
        }}
      >
        {formatTimestamp(new Date(reply.createdAt))}
        {reply.lastEdited &&
          ` (edited ${formatTimestamp(new Date(reply.lastEdited))})`}
      </Typography>

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
            setIsEditing(true);
            setAnchorEl(null);
          }}
          sx={{
            py: { xs: 1, sm: 1 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            minHeight: { xs: "48px", sm: "40px" },
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(review.id, index);
            setAnchorEl(null);
          }}
          sx={{
            py: { xs: 1, sm: 1 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            minHeight: { xs: "48px", sm: "40px" },
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};
