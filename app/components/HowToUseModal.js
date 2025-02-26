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
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";

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
          overflowY: "auto",
        },
      }}
    >
      <DialogTitle sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
        How & Why Use This Platform
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Why This Platform?
          </Typography>
          <Typography paragraph>
            This is a student-driven platform created to help Constructor
            University students make informed decisions about their courses and
            professors. It&apos;s a space where you can share and learn from
            others&apos; experiences anonymously.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            How to Use Each Feature
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Chat Section"
                secondary="Interact with our AI assistant that's trained on student reviews. Ask questions about professors, courses, or get personalized recommendations based on submitted reviews."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <RateReviewOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Rate Button"
                secondary="Submit anonymous professor reviews. Describe their teaching style, share your experience, and add a rating. You can describe professors creatively without using names."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <VisibilityOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Reviews Section"
                secondary="Browse reviews from other students, react with likes or loves, and engage in discussions by replying to reviews. Filter by subject or rating to find relevant feedback."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <TipsAndUpdatesOutlinedIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Tips Section"
                secondary="Share and discover study techniques, course validation strategies, and helpful advice from fellow students. Add your own tips to help others succeed."
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
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
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
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
