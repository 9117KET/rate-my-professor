"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Link,
  Divider,
  useMediaQuery,
  useTheme,
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

export const PrivacyPolicyModal = ({ open, onClose }) => {
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
        Privacy Policy
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          Last updated: 5 April 2026 · Version 1.1
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Body sx={{ mb: 2.5 }}>
          This Privacy Policy explains how <strong>Rate My CUB Professor</strong> (a non-commercial student project)
          collects, uses, and protects your data in accordance with the EU General Data Protection Regulation (GDPR)
          and applicable German law.
        </Body>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="1. Data Controller">
          <Body>
            Kinlo Ephriam Tangiri<br />
            Student, Constructor University Bremen<br />
            Email:{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">
              {CONTACT_EMAIL}
            </Link>
          </Body>
          <Body sx={{ mt: 1, fontStyle: "italic" }}>
            This platform is an independent student initiative and is not officially affiliated with
            Constructor University Bremen.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="2. Data We Process">
          <Body sx={{ mb: 0.75 }}>The following data is collected when you use this platform:</Body>
          <Bullet>
            <strong>Anonymous user ID</strong> — a randomly generated UUID or Firebase anonymous auth UID,
            stored in your browser&apos;s local storage. This never identifies you personally.
          </Bullet>
          <Bullet>
            <strong>Reviews you submit</strong> — professor name, subject, star rating, and written review text.
          </Bullet>
          <Bullet>
            <strong>Reactions &amp; replies</strong> — thumbs up/down and text replies you post on reviews.
          </Bullet>
          <Bullet>
            <strong>Chat messages</strong> — messages you send to the AI assistant, stored server-side
            and linked to your anonymous ID for session continuity.
          </Bullet>
          <Bullet>
            <strong>Bug reports</strong> — issue description and optionally your email address
            if you choose to provide it.
          </Bullet>
          <Bullet>
            <strong>Hashed IP address</strong> — computed in memory per request for rate limiting only;
            not stored persistently.
          </Bullet>
          <Body sx={{ mt: 1.25, fontStyle: "italic" }}>
            Note on professor data: Reviews contain professor names, which may constitute personal data under GDPR.
            We process this data to enable academic transparency and informed course selection (see legal basis below).
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="3. Legal Basis (GDPR Art. 6)">
          <Bullet>
            <strong>Anonymous ID &amp; rate limiting</strong> — Art. 6(1)(f) Legitimate interests
            (preventing spam and abuse, ensuring service integrity).
          </Bullet>
          <Bullet>
            <strong>Reviews, reactions, replies, chat</strong> — Art. 6(1)(a) Consent
            (you voluntarily submit this content and have accepted this policy).
          </Bullet>
          <Bullet>
            <strong>Professor names in reviews</strong> — Art. 6(1)(f) Legitimate interests
            (academic transparency; enables students to make informed study decisions).
          </Bullet>
          <Bullet>
            <strong>Bug reports</strong> — Art. 6(1)(a) Consent (voluntarily submitted).
          </Bullet>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="4. Data Retention">
          <Bullet>Anonymous user ID: retained in your local storage until you clear browser data.</Bullet>
          <Bullet>Reviews, reactions, replies: retained indefinitely unless you request deletion.</Bullet>
          <Bullet>Chat history: retained for up to 90 days.</Bullet>
          <Bullet>Bug reports: retained for up to 6 months.</Bullet>
          <Bullet>Hashed IP addresses: not persisted — computed per request only.</Bullet>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="5. Third-Party Processors">
          <Body sx={{ mb: 1 }}>
            Your data is processed by the following sub-processors. All operate under appropriate
            safeguards (EU Standard Contractual Clauses or EU–US Data Privacy Framework):
          </Body>
          <Bullet>
            <Link href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
              Google Firebase
            </Link>{" "}
            (Alphabet Inc.) — database storage (Firestore)
          </Bullet>
          <Bullet>
            <Link href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">
              OpenAI
            </Link>{" "}
            — AI chat responses and text embeddings
          </Bullet>
          <Bullet>
            <Link href="https://www.pinecone.io/privacy/" target="_blank" rel="noopener noreferrer">
              Pinecone
            </Link>{" "}
            — vector database for semantic search
          </Bullet>
          <Bullet>
            <Link href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Vercel
            </Link>{" "}
            — hosting and infrastructure
          </Bullet>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="6. International Data Transfers">
          <Body>
            Firebase (Google), OpenAI, Pinecone, and Vercel are US-based companies. Data transferred to these
            services is safeguarded by Standard Contractual Clauses (SCCs) under GDPR Art. 46(2)(c)
            and the EU–US Data Privacy Framework where applicable.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="7. Your Rights (GDPR Art. 15–22)">
          <Body sx={{ mb: 0.75 }}>You have the right to:</Body>
          <Bullet><strong>Access</strong> — obtain a copy of your personal data (Art. 15)</Bullet>
          <Bullet><strong>Rectification</strong> — correct inaccurate data (Art. 16)</Bullet>
          <Bullet><strong>Erasure</strong> — request deletion of your data (Art. 17)</Bullet>
          <Bullet><strong>Restriction</strong> — limit how your data is processed (Art. 18)</Bullet>
          <Bullet><strong>Portability</strong> — receive your data in a machine-readable format (Art. 20)</Bullet>
          <Bullet><strong>Object</strong> — object to processing based on legitimate interests (Art. 21)</Bullet>
          <Body sx={{ mt: 1.25 }}>
            To exercise any right, email{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">{CONTACT_EMAIL}</Link>.
            You can delete your own reviews directly within the app.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="8. Right to Withdraw Consent">
          <Body>
            You may withdraw consent at any time by contacting{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} underline="hover">{CONTACT_EMAIL}</Link>.
            Withdrawal does not affect the lawfulness of processing carried out before withdrawal.
          </Body>
        </Section>

        <Divider sx={{ mb: 2.5 }} />

        <Section title="9. Supervisory Authority">
          <Body>
            You have the right to lodge a complaint with the competent data protection authority:
          </Body>
          <Body sx={{ mt: 0.75 }}>
            Die Landesbeauftragte für Datenschutz und Informationsfreiheit Bremen (LfDI Bremen)<br />
            <Link href="https://www.datenschutz.bremen.de" target="_blank" rel="noopener noreferrer">
              www.datenschutz.bremen.de
            </Link>
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
            We may update this policy from time to time. Material changes will be announced via the
            consent banner on your next visit. Continued use of the platform constitutes acceptance
            of the updated policy.
          </Typography>
        </Box>

        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          sx={{ mt: 2, textAlign: "center", letterSpacing: "0.02em" }}
        >
          Developed by Kinlo Ephriam Tangiri (KET)
        </Typography>
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
