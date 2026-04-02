import { Button, Stack } from "@mui/material";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

export const ActionButtons = ({ onRateClick, onViewClick, onTipsClick }) => {
  const buttons = [
    { label: "Rate", icon: <RateReviewIcon sx={{ fontSize: "1rem" }} />, onClick: onRateClick, color: "secondary" },
    { label: "Reviews", icon: <VisibilityOutlinedIcon sx={{ fontSize: "1rem" }} />, onClick: onViewClick, color: "primary" },
    { label: "Tips", icon: <TipsAndUpdatesOutlinedIcon sx={{ fontSize: "1rem" }} />, onClick: onTipsClick, color: "primary" },
  ];

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        mt: 1.5,
        justifyContent: "center",
        width: "100%",
        maxWidth: { xs: "100%", sm: "480px" },
        mx: "auto",
        px: 1,
      }}
    >
      {buttons.map(({ label, icon, onClick, color }) => (
        <Button
          key={label}
          variant={color === "secondary" ? "contained" : "outlined"}
          color={color}
          startIcon={icon}
          onClick={onClick}
          sx={{
            flex: 1,
            borderRadius: "12px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            py: 0.875,
            textTransform: "none",
          }}
        >
          {label}
        </Button>
      ))}
    </Stack>
  );
};
