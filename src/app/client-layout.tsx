"use client";

import dynamic from "next/dynamic";
import { CopilotKit } from "@copilotkit/react-core";
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

export default function ClientLayout({
  children,
  geistSansVariable,
  geistMonoVariable,
}: {
  children: React.ReactNode;
  geistSansVariable: string;
  geistMonoVariable: string;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className={`${geistSansVariable} ${geistMonoVariable} antialiased`}
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

        {/* Script to prevent FOUC (Flash of Unstyled Content) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // This script runs before React hydration
                  // It applies the saved theme immediately to prevent flash
                  const savedTheme = localStorage.getItem('theme');

                  // Apply system preference if no saved theme
                  if (savedTheme === 'system' || !savedTheme) {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.add(systemTheme);
                  } else {
                    document.documentElement.classList.add(savedTheme);
                  }
                } catch (e) {
                  // Fallback to light theme on error
                  document.documentElement.classList.add('light');
                  console.error('Failed to apply theme:', e);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
