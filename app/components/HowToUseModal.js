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
} from "@mui/material";
import AnonymousIcon from "@mui/icons-material/VisibilityOff";
import DescriptionIcon from "@mui/icons-material/Description";
import HelpIcon from "@mui/icons-material/Help";
import StarIcon from "@mui/icons-material/Star";
import InstagramIcon from "@mui/icons-material/Instagram";
import SecurityIcon from "@mui/icons-material/Security";

export const HowToUseModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 1, sm: 2 },
          width: { xs: "95%", sm: "90%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
        },
      }}
    >
      <DialogTitle>How & Why Use This Platform</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
            Why This Platform?
          </Typography>
          <Typography paragraph>
            This is a student-driven platform created to help Constructor
            University students make informed decisions about their courses and
            professors. It's a space where you can share and learn from others'
            experiences anonymously.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
            Key Features
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <AnonymousIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="100% Anonymous"
                secondary="Share your honest experiences without revealing your identity. No login required, no data tracking."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <DescriptionIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Creative Freedom"
                secondary="Don't remember a professor's name? Describe them creatively! ('The Statistics prof who always wears colorful bowties')"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Decision Support"
                secondary="Get help choosing professors for German courses, Specializations, CIP, and other major modules based on peer experiences."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <StarIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Share Your Stories"
                secondary="Rate and review your best (and worst) professors to help future students make informed decisions."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <InstagramIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Stay Connected"
                secondary="Follow our Instagram page for the best reviews and easy access to the platform. The most helpful reviews get featured!"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <SecurityIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Personal Project"
                secondary="This is a student-made project for students. No institutional affiliation - just honest, unfiltered peer reviews."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="AI-Powered Assistance"
                secondary="Chat with our AI assistant that learns from all submitted reviews to provide personalized and accurate recommendations based on student experiences."
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
            Guidelines
          </Typography>
          <Typography paragraph>
            • Be honest but respectful in your reviews
          </Typography>
          <Typography paragraph>
            • Focus on teaching style, course content, and learning experience
          </Typography>
          <Typography paragraph>
            • Share specific examples that could help other students
          </Typography>
          <Typography paragraph>
            • Feel free to include helpful tips for succeeding in the course
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
