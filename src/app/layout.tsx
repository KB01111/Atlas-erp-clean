"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { CopilotKit } from "@copilotkit/react-core";
import dynamic from "next/dynamic";
import { Providers } from "./providers";

// Dynamically import the CopilotPopupWrapper with SSR disabled
const CopilotPopupWrapper = dynamic(
  () => import('@/components/CopilotPopupWrapper'),
  { ssr: false }
);

// Dynamically import the PerformanceMonitor with SSR disabled
// Only load in development mode
const PerformanceMonitor = dynamic(
  () => process.env.NODE_ENV === 'development'
    ? import('@/components/PerformanceMonitor').then(mod => mod.PerformanceMonitor)
    : Promise.resolve(() => null),
  { ssr: false }
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata is now defined in metadata.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <CopilotKit
            runtimeUrl="/api/copilotkit"
          >
            {children}
            <CopilotPopupWrapper
              labels={{
                title: "Atlas Assistant",
                initial: "Hi! I'm your Atlas ERP assistant. How can I help you today?",
              }}
            />
            {/* Only show performance monitor in development */}
            {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
          </CopilotKit>
        </Providers>
      </body>
    </html>
  );
}
