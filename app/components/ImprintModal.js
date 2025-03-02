import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Divider,
  Paper,
} from "@mui/material";

export const ImprintModal = ({ open, onClose }) => {
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
          margin: { xs: 1, sm: 2, md: 3 },
          width: { xs: "95%", sm: "90%", md: "80%" },
          maxHeight: { xs: "95vh", sm: "90vh" },
          overflowY: "auto",
          borderRadius: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
          py: { xs: 2, sm: 2.5, md: 3 },
          px: { xs: 2, sm: 3, md: 4 },
          textAlign: { xs: "center", sm: "left" },
          fontWeight: 600,
        }}
      >
        Imprint & Legal Notice
      </DialogTitle>
      <DialogContent
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, sm: 2 },
          "& a": {
            color: theme.palette.primary.main,
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          },
        }}
      >
        {/* <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            Service Provider
          </Typography>
          <Typography>Kinlo ET</Typography>
          <Typography>Campus Ring 1</Typography>
          <Typography>28759 Bremen</Typography>
          <Typography>Germany</Typography>
        </Box> */}

        {/* <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Contact
          </Typography>
          <Typography>
            <a
              href="https://www.linkedin.com/in/kinlo-ephriam-tangiri-a70113218/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0077b5", textDecoration: "none" }}
            >
              LinkedIn
            </a>
          </Typography>
        </Box> */}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            bgcolor: "rgba(0, 27, 63, 0.02)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.35rem" },
              fontWeight: 600,
              color: "primary.main",
            }}
          >
            Legal Disclaimers
          </Typography>
          <Typography
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mb: { xs: 1.5, sm: 2 },
              lineHeight: { xs: 1.5, sm: 1.7 },
            }}
          >
            This platform is for informational purposes only. The reviews and
            ratings are user-generated content and do not represent my official
            views or the views of Constructor University.
          </Typography>
          <Typography
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mb: { xs: 1.5, sm: 2 },
              lineHeight: { xs: 1.5, sm: 1.7 },
            }}
          >
            To protect privacy and maintain anonymity, users should not directly
            state professor names. Instead, describe the professor in a way that
            students familiar with the course would recognize (e.g., &quot;The
            Statistics professor who uses many real-world examples&quot; or
            &quot;The Physics professor who always wears colorful
            bowties&quot;).
          </Typography>
          <Typography
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mb: { xs: 1.5, sm: 2 },
              lineHeight: { xs: 1.5, sm: 1.7 },
            }}
          >
            I will try to maintain the accuracy of information but make no
            guarantees regarding the completeness, reliability, or accuracy of
            the content.
          </Typography>
          <Typography
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mb: { xs: 0, sm: 0 },
              lineHeight: { xs: 1.5, sm: 1.7 },
            }}
          >
            Users are responsible for ensuring their submissions comply with
            applicable laws and do not violate any rights of third parties.
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, sm: 4 },
            bgcolor: "rgba(0, 27, 63, 0.02)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.35rem" },
              fontWeight: 600,
              color: "primary.main",
            }}
          >
            Data Protection
          </Typography>
          <Typography
            paragraph
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              mb: { xs: 0, sm: 0 },
              lineHeight: { xs: 1.5, sm: 1.7 },
            }}
          >
            Data generated on this platform is anonymous data and we have no way
            to track the user data for the purpose of giving honest review of
            their experiences with professors at Constructor University. I
            strive to make sure the data is in accordance with the EU General
            Data Protection Regulation (GDPR).
          </Typography>
        </Paper>

        <Divider sx={{ my: { xs: 2, sm: 3 } }} />

        <Box
          sx={{
            mb: { xs: 2, sm: 2 },
            textAlign: "center",
            p: { xs: 2, sm: 2 },
            bgcolor: { xs: "transparent", sm: "transparent" },
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "0.9rem", sm: "1rem" },
              mb: 1,
              fontWeight: 500,
            }}
          >
            Developed by Kinlo
          </Typography>
          <Typography>
            <a
              href="https://www.linkedin.com/in/kinlo-ephriam-tangiri-a70113218/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.palette.primary.main,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                fontSize: isMobile ? "0.85rem" : "0.95rem",
              }}
            >
              Connect on LinkedIn
            </a>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 2.5 },
          justifyContent: "center",
          pb: { xs: 3, sm: 3 },
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            minWidth: { xs: 140, sm: 160 },
            py: { xs: 1, sm: 1 },
            borderRadius: 2,
            fontSize: { xs: "0.85rem", sm: "0.9rem" },
            fontWeight: 500,
          }}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};
