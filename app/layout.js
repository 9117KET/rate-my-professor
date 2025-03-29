import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";

// Load Inter font with Latin character subset
const inter = Inter({ subsets: ["latin"] });

// Define metadata for SEO and browser tab display
export const metadata = {
  title: "Rate My Professor Assistant",
  description: "AI-powered professor review assistant",
  icons: {
    icon: "/favicon.svg",
  },
};

// Configure viewport settings to control display on mobile devices
// Disable user scaling to prevent layout issues on mobile
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Root layout component that wraps all pages in the application
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Wrap ClientLayout in Suspense to handle loading states */}
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
        {/* Include Vercel Analytics for usage tracking */}
        <Analytics />
      </body>
    </html>
  );
}
