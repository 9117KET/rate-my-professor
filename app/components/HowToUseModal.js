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
  Divider,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
          px: { xs: 1, sm: 2 },
          borderRadius: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.5rem" },
          pt: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
          textAlign: { xs: "center", sm: "left" },
          fontWeight: 600,
        }}
      >
        How & Why Use This Platform
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 1, sm: 3 },
          "& .MuiTypography-paragraph": {
            fontSize: { xs: "0.9rem", sm: "1rem" },
            lineHeight: 1.6,
          },
        }}
      >
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1.5,
              color: "primary.main",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              fontWeight: 600,
            }}
          >
            Why This Platform?
          </Typography>
          <Typography
            paragraph
            sx={{
              px: { xs: 1, sm: 0 },
            }}
          >
            This is a student-driven platform created to help Constructor
            University students make informed decisions about their courses and
            professors. It&apos;s a space where you can share and learn from
            others&apos; experiences anonymously.
          </Typography>
        </Box>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              fontWeight: 600,
            }}
          >
            How to Use Each Feature
          </Typography>
          <List
            sx={{
              pl: { xs: 0, sm: 1 },
              "& .MuiListItem-root": {
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "flex-start" },
                mb: { xs: 2, sm: 1.5 },
                bgcolor: { xs: "rgba(0,0,0,0.02)", sm: "transparent" },
                borderRadius: 1,
                p: { xs: 1.5, sm: 1 },
              },
              "& .MuiListItemIcon-root": {
                minWidth: { xs: "100%", sm: 56 },
                mb: { xs: 1, sm: 0 },
              },
            }}
          >
            <ListItem>
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <HelpIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.5rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1rem" },
                      fontWeight: 600,
                      textAlign: { xs: "center", sm: "left" },
                    }}
                  >
                    Chat Section
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      textAlign: { xs: "center", sm: "left" },
                      mt: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Interact with our AI assistant that&apos;s trained on
                    student reviews. Ask questions about professors, courses, or
                    get personalized recommendations based on submitted reviews.
                  </Typography>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <RateReviewOutlinedIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.5rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1rem" },
                      fontWeight: 600,
                      textAlign: { xs: "center", sm: "left" },
                    }}
                  >
                    Rate Button
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      textAlign: { xs: "center", sm: "left" },
                      mt: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Submit anonymous professor reviews. Describe their teaching
                    style, share your experience, and add a rating. You can
                    describe professors creatively without using names.
                  </Typography>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <VisibilityOutlinedIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.5rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1rem" },
                      fontWeight: 600,
                      textAlign: { xs: "center", sm: "left" },
                    }}
                  >
                    Reviews Section
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      textAlign: { xs: "center", sm: "left" },
                      mt: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Browse reviews from other students, react with likes or
                    loves, and engage in discussions by replying to reviews.
                    Filter by subject or rating to find relevant feedback.
                  </Typography>
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: { xs: "center", sm: "flex-start" },
                }}
              >
                <TipsAndUpdatesOutlinedIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.5rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1rem" },
                      fontWeight: 600,
                      textAlign: { xs: "center", sm: "left" },
                    }}
                  >
                    Tips Section
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.85rem", sm: "0.875rem" },
                      textAlign: { xs: "center", sm: "left" },
                      mt: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Share and discover study techniques, course validation
                    strategies, and helpful advice from fellow students. Add
                    your own tips to help others succeed.
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: "primary.main",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              fontWeight: 600,
            }}
          >
            Key Features
          </Typography>
          <List
            sx={{
              "& .MuiListItem-root": {
                py: { xs: 1.5, sm: 1 },
                px: { xs: 1, sm: 2 },
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "center", sm: "flex-start" },
                mb: { xs: 1.5, sm: 1 },
                bgcolor: { xs: "rgba(0,0,0,0.02)", sm: "transparent" },
                borderRadius: 1,
              },
              "& .MuiListItemIcon-root": {
                minWidth: { xs: "auto", sm: 50 },
                mb: { xs: 1, sm: 0 },
                mr: { xs: 0, sm: 2 },
              },
              "& .MuiListItemText-primary": {
                fontSize: { xs: "0.95rem", sm: "1rem" },
                fontWeight: 500,
                textAlign: { xs: "center", sm: "left" },
              },
              "& .MuiListItemText-secondary": {
                fontSize: { xs: "0.825rem", sm: "0.875rem" },
                textAlign: { xs: "center", sm: "left" },
                mt: { xs: 0.5, sm: 0 },
              },
            }}
          >
            <ListItem>
              <ListItemIcon>
                <AnonymousIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.4rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary="100% Anonymous"
                secondary="Share your honest experiences without revealing your identity. No login required, no data tracking."
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <DescriptionIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.4rem" } }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Creative Freedom"
                secondary="Don't remember a professor's name? Describe them creatively! ('The Statistics prof who always wears colorful bowties')"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <HelpIcon
                  color="primary"
                  sx={{ fontSize: { xs: "1.5rem", sm: "1.4rem" } }}
                />
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

        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1, sm: 2 },
              color: "primary.main",
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            Guidelines
          </Typography>
          <Typography
            paragraph
            sx={{
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            • Be honest but respectful in your reviews
          </Typography>
          <Typography
            paragraph
            sx={{
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            • Focus on teaching style, course content, and learning experience
          </Typography>
          <Typography
            paragraph
            sx={{
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            • Share specific examples that could help other students
          </Typography>
          <Typography
            paragraph
            sx={{
              px: { xs: 1, sm: 2 },
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            • Feel free to include helpful tips for succeeding in the course
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: 3, sm: 3 },
          justifyContent: "center",
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: { xs: 150, sm: 180 },
            height: { xs: 40, sm: 44 },
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
          }}
        >
          Got It!
        </Button>
      </DialogActions>
    </Dialog>
  );
};
