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
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Fix hydration mismatch by disabling SSR for theme
      enableColorScheme={false}
      // Disable theme effect until after hydration to avoid mismatch
      disableTransitionOnChange
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
