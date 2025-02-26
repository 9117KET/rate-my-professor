import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

export const ImprintModal = ({ open, onClose }) => {
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
        Imprint & Legal Notice
      </DialogTitle>
      <DialogContent>
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

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            Legal Disclaimers
          </Typography>
          <Typography paragraph>
            This platform is for informational purposes only. The reviews and
            ratings are user-generated content and do not represent my official
            views or the views of Constructor University.
          </Typography>
          <Typography paragraph>
            To protect privacy and maintain anonymity, users should not directly
            state professor names. Instead, describe the professor in a way that
            students familiar with the course would recognize (e.g., &quot;The
            Statistics professor who uses many real-world examples&quot; or
            &quot;The Physics professor who always wears colorful
            bowties&quot;).
          </Typography>
          <Typography paragraph>
            I will try to maintain the accuracy of information but make no
            guarantees regarding the completeness, reliability, or accuracy of
            the content.
          </Typography>
          <Typography paragraph>
            Users are responsible for ensuring their submissions comply with
            applicable laws and do not violate any rights of third parties.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            Data Protection
          </Typography>
          <Typography paragraph>
            Data generated on this platform is anonymous data and we have no way
            to track the user data for the purpose of giving honest review of
            their experiences with professors at Constructor University. I
            strive to make sure the data is in accordance with the EU General
            Data Protection Regulation (GDPR).
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
