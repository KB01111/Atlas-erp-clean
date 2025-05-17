// Split into two files: layout.tsx (server component) and client-layout.tsx (client component)

import { Inter as GeistSans, JetBrains_Mono as GeistMono } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { metadata } from "./metadata";
import ClientLayout from "./client-layout";

// Using Google Fonts instead of local fonts to avoid font loading issues in Docker
const geistSans = GeistSans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Export metadata for Next.js
export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClientLayout
      geistSansVariable={geistSans.variable}
      geistMonoVariable={geistMono.variable}
    >
      {children}
    </ClientLayout>
  );
}
