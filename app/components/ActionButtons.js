import { Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

export const ActionButtons = ({ onRateClick, onViewClick, onTipsClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2 }}
      sx={{
        mt: { xs: 2, sm: 3 },
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        maxWidth: { xs: "100%", sm: "90%", md: "80%" },
        mx: "auto",
        px: { xs: 2, sm: 2 },
        "& .MuiButton-root": {
          minWidth: { xs: "200px", sm: "130px", md: "150px" },
          fontSize: { xs: "0.8rem", sm: "0.875rem", md: "0.95rem" },
          py: { xs: 1, sm: 1, md: 1.2 },
          px: { xs: 2, sm: 2, md: 3 },
          borderRadius: 2,
          transition: "all 0.2s ease-in-out",
          boxShadow: 2,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 3,
          },
        },
      }}
    >
      <Button
        variant="contained"
        startIcon={
          <RateReviewOutlinedIcon
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" } }}
          />
        }
        onClick={onRateClick}
        fullWidth={isMobile}
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
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" } }}
          />
        }
        onClick={onViewClick}
        fullWidth={isMobile}
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
            sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.4rem" } }}
          />
        }
        onClick={onTipsClick}
        fullWidth={isMobile}
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
