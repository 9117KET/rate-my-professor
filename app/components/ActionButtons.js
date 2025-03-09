import { Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

export const ActionButtons = ({ onRateClick, onViewClick, onTipsClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack
      direction="row"
      spacing={{ xs: 0.75, sm: 1.5 }}
      sx={{
        mt: { xs: 1, sm: 1.5 },
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: { xs: "100%", sm: "90%", md: "80%" },
        mx: "auto",
        px: { xs: 1, sm: 1.5 },
        "& .MuiButton-root": {
          minWidth: { xs: "auto", sm: "110px", md: "130px" },
          fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.85rem" },
          py: { xs: 0.5, sm: 0.75, md: 1 },
          px: { xs: 0.75, sm: 1.5, md: 2 },
          borderRadius: 1.5,
          transition: "all 0.2s ease-in-out",
          boxShadow: 1,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 2,
          },
        },
      }}
    >
      <Button
        variant="contained"
        startIcon={
          <RateReviewOutlinedIcon
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" } }}
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
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" } }}
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
            sx={{ fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" } }}
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
        Tips
      </Button>
    </Stack>
  );
};
