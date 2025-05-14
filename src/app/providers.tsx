"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { RateLimitProvider } from '@/context/RateLimitContext';
import { PerformanceOptimizer } from '@/components/PerformanceOptimizer';
import ErrorBoundary from '@/components/ui/error-boundary';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RateLimitProvider>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log error to an error reporting service
            console.error('Global error caught by ErrorBoundary:', error, errorInfo);
          }}
        >
          <PerformanceOptimizer>
            {children}
          </PerformanceOptimizer>
        </ErrorBoundary>
      </RateLimitProvider>
    </ThemeProvider>
  );
}
