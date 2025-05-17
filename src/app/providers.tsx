"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { RateLimitProvider } from '@/context/RateLimitContext';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize theme on client side - this is now handled by next-themes
  // We don't need to manually set the data-theme attribute anymore

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Fix hydration mismatch by disabling SSR for theme
      enableColorScheme={false}
      // Disable theme effect until after hydration to avoid mismatch
      disableTransitionOnChange
      // Store theme preference in localStorage
      storageKey="theme"
      // Use light theme for SSR to ensure consistent rendering
      value={{ light: 'light', dark: 'dark', system: 'system' }}
    >
      <RateLimitProvider>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log error to an error reporting service
            console.error('Global error caught by ErrorBoundary:', error, errorInfo);
          }}
        >
          <PerformanceOptimizer>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </PerformanceOptimizer>
        </ErrorBoundary>
      </RateLimitProvider>
    </ThemeProvider>
  );
}
