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
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SecurityIcon from "@mui/icons-material/Security";
import GavelIcon from "@mui/icons-material/Gavel";
import CodeIcon from "@mui/icons-material/Code";

export const ImprintModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        }}
      >
        ⚖️ Guidelines
      </DialogTitle>

      <DialogContent>
        <List>
          {/* Created By Section */}
          <ListItem sx={{ pt: 1 }}>
            <ListItemIcon>
              <CodeIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight={600}>
                  Created By
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontStyle: "italic",
                      fontWeight: 500,
                      color: "primary.main",
                    }}
                  >
                    Kinlo ET
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Constructor University Bremen Student
                  </Typography>
                </Box>
              }
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* About Section */}
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight={600}>
                  About This Platform
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  A student-driven platform for Constructor University Bremen,
                  created to help students make informed decisions about courses
                  and professors.
                </Typography>
              }
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* Privacy Section */}
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight={600}>
                  Privacy & Anonymity
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  • All reviews are anonymous
                  <br />
                  • No personal data is collected
                  <br />• Reviews are stored securely
                  <br />• Everyone can view submitted reviews
                </Typography>
              }
            />
          </ListItem>

          <Divider sx={{ my: 1 }} />

          {/* Guidelines Section */}
          <ListItem>
            <ListItemIcon>
              <GavelIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight={600}>
                  Review Guidelines
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  • Focus on teaching style and course content
                  <br />
                  • No harassment or personal attacks
                  <br />• No sharing of private information
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "grey.100",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            This platform is an independent student initiative and is not
            officially affiliated with Constructor University Bremen. All
            reviews reflect personal student experiences and opinions.
          </Typography>
        </Box>
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
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
};
