"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Link,
  useTheme,
  useMediaQuery,
} from "@mui/material";

const Section = ({ title, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.75, color: "text.primary" }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const Body = ({ children, sx }) => (
  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, ...sx }}>
    {children}
  </Typography>
);

const Bullet = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, display: "block", pl: 1 }}>
    · {children}
  </Typography>
);

const CONTACT_EMAIL = "kinlotangiri1@gmail.com";

export const ImprintModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      scroll="paper"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: { xs: "16px 16px 0 0", sm: "20px" },
          margin: { xs: 0, sm: "32px" },
          maxHeight: { xs: "92vh", sm: "88vh" },
          alignSelf: { xs: "flex-end", sm: "center" },
        },
      }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1, fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.2rem" } }}>
        Legal Notice &amp; Guidelines
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          Impressum · Last updated: 5 April 2026
        </Typography>
      </DialogTitle>

      <DialogContent dividers>

        {/* ── Legal Notice (Impressum) ─────────────────────────────────────────── */}
        <Section title="Legal Notice (Impressum)">
          <Body>
            According to § 5 TMG / DDG:
          </Body>
          <Body sx={{ mt: 1 }}>
            <strong>Responsible for content:</strong><br />
            Kinlo Ephriam Tangiri<br />
            Student, Constructor University Bremen<br />
            {/* TODO: Add your postal address here */}
            [Address on request]<br />
            Email:{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">
              {CONTACT_EMAIL}
            </Link>
          </Body>
          <Body sx={{ mt: 1, fontStyle: "italic" }}>
            This is a non-commercial student project. No commercial activity is conducted through this platform.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
        <Section title="Disclaimer">
          <Body sx={{ mb: 1 }}>
            <strong>No affiliation with Constructor University Bremen.</strong> This platform is an independent
            student initiative and is not officially affiliated with, endorsed by, or connected to
            Constructor University Bremen in any way.
          </Body>
          <Body sx={{ mb: 1 }}>
            <strong>Limitation of liability.</strong> All reviews are submitted anonymously by students and
            reflect personal opinions only. The operator of this platform accepts no liability for the accuracy,
            completeness, or timeliness of user-submitted content.
          </Body>
          <Body sx={{ mb: 1 }}>
            <strong>External links.</strong> This platform contains links to external websites. We have no control
            over the content of those sites and accept no liability for them. The operators of linked pages
            are solely responsible for their content.
          </Body>
          <Body>
            <strong>Right to removal.</strong> If you are a professor at Constructor University Bremen and
            believe content about you is inaccurate or should be removed, please contact us at{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">{CONTACT_EMAIL}</Link> and we will
            respond promptly.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Community Guidelines ─────────────────────────────────────────────── */}
        <Section title="Community Guidelines">
          <Body sx={{ mb: 1 }}>
            By submitting a review, reaction, reply, or tip, you agree to the following standards:
          </Body>
          <Bullet>
            <strong>Be respectful.</strong> Critique teaching quality, course structure, and workload —
            not personal characteristics, appearance, nationality, or private life.
          </Bullet>
          <Bullet>
            <strong>Be honest.</strong> Only submit reviews based on your own genuine experience
            with a professor or course.
          </Bullet>
          <Bullet>
            <strong>Stay constructive.</strong> Negative reviews are valid; targeted harassment is not.
            Ask yourself: does this help a fellow student make a better decision?
          </Bullet>
          <Bullet>
            <strong>No personal information.</strong> Do not include any personal data about professors
            or other students beyond their publicly known professional role (name, subject).
          </Bullet>
          <Bullet>
            <strong>No spam or duplicate reviews.</strong> Submit one honest review per professor per course.
          </Bullet>
          <Bullet>
            <strong>No illegal content.</strong> Content that is defamatory, discriminatory, incites hatred,
            or is otherwise unlawful will be removed and may be reported to authorities.
          </Bullet>
          <Body sx={{ mt: 1.25 }}>
            Content that violates these guidelines will be removed without notice. Repeated violations
            may result in your anonymous ID being blocked.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Copyright ────────────────────────────────────────────────────────── */}
        <Section title="Intellectual Property">
          <Body>
            The platform design, code, and content structure are the work of Kinlo Ephriam Tangiri.
            User-submitted reviews remain the intellectual property of the respective authors.
            By submitting content, you grant the platform a non-exclusive, royalty-free licence to
            display that content to other users of the platform.
          </Body>
        </Section>

        <Box
          sx={{
            mt: 1,
            p: 2,
            bgcolor: "rgba(0,27,63,0.04)",
            borderRadius: "12px",
            border: "1px solid rgba(0,27,63,0.08)",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            For data protection inquiries, content removal requests, or to exercise your GDPR rights,
            email{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} variant="caption" underline="hover">
              {CONTACT_EMAIL}
            </Link>. We aim to respond within 30 days.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
        <Button
          variant="contained"
          onClick={onClose}
          fullWidth
          sx={{ borderRadius: "12px", py: 1.25, fontWeight: 700 }}
        >
          Got It
        </Button>
      </DialogActions>
    </Dialog>
  );
};
