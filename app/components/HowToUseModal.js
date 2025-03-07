import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export const HowToUseModal = ({ open, onClose, disableClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={disableClose ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1, sm: 2 },
          width: { xs: "95%", sm: "90%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
          borderRadius: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.5rem" },
          pt: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
          textAlign: "center",
          fontWeight: 600,
          pr: disableClose ? 2 : 6,
        }}
      >
        🎓 Welcome to Rate My Professor!
      </DialogTitle>

      {disableClose && (
        <Box
          sx={{
            px: 3,
            pb: 2,
            bgcolor: "primary.light",
            color: "white",
            mx: 2,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ py: 1, textAlign: "center" }}>
            Submit your first professor rating to unlock:
          </Typography>
        </Box>
      )}

      <DialogContent sx={{ pt: 2 }}>
        <List sx={{ py: 0 }}>
          <ListItem sx={{ py: 1 }}>
            <ListItemIcon>
              <VisibilityOutlinedIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="See What Others Say"
              secondary="Read honest reviews about your best (and worst) professors"
            />
          </ListItem>

          <ListItem sx={{ py: 1 }}>
            <ListItemIcon>
              <SmartToyIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Ask Our AI Assistant"
              secondary="Get personalized course and professor recommendations"
            />
          </ListItem>

          <ListItem sx={{ py: 1 }}>
            <ListItemIcon>
              <RateReviewOutlinedIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Share Your Experience"
              secondary="Help other students make informed decisions"
            />
          </ListItem>
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          size="large"
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontSize: "1rem",
            textTransform: "none",
          }}
        >
          {disableClose ? "Let's Rate My First Professor!" : "Got It!"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
