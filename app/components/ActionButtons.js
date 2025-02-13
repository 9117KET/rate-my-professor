import { Button, Stack } from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

export const ActionButtons = ({ onRateClick, onViewClick, onTipsClick }) => {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        mt: 1,
        justifyContent: "center",
        px: { xs: 1, sm: 2 },
        "& .MuiButton-root": {
          minWidth: { xs: "90px", sm: "auto" },
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
          py: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 },
        },
      }}
    >
      <Button
        variant="contained"
        startIcon={
          <RateReviewOutlinedIcon
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          />
        }
        onClick={onRateClick}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          color: "#001B3F",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 1)",
          },
        }}
      >
        Rate
      </Button>
      <Button
        variant="contained"
        startIcon={
          <VisibilityOutlinedIcon
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          />
        }
        onClick={onViewClick}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.9)",
          color: "#001B3F",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 1)",
          },
        }}
      >
        Reviews
      </Button>
      <Button
        variant="contained"
        startIcon={
          <TipsAndUpdatesOutlinedIcon
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          />
        }
        onClick={onTipsClick}
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
