import { Button, Stack } from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

export const ActionButtons = ({ onRateClick, onViewClick, onTipsClick }) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        mt: 2,
        justifyContent: "center",
        px: { xs: 2, sm: 0 },
      }}
    >
      <Button
        variant="contained"
        startIcon={<RateReviewOutlinedIcon />}
        onClick={onRateClick}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          color: "#001B3F",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 1)",
          },
        }}
      >
        Rate a Professor
      </Button>
      <Button
        variant="contained"
        startIcon={<VisibilityOutlinedIcon />}
        onClick={onViewClick}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          color: "#001B3F",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 1)",
          },
        }}
      >
        See Reviews
      </Button>
      <Button
        variant="contained"
        startIcon={<TipsAndUpdatesOutlinedIcon />}
        onClick={() => onTipsClick()}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          color: "#001B3F",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 1)",
          },
        }}
      >
        TIPS
      </Button>
    </Stack>
  );
};
