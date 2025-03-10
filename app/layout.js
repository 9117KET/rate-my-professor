import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rate My Professor Assistant",
  description: "AI-powered professor review assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
