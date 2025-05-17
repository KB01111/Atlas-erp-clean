"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ShineBorder } from './shine-border';
import { AnimatedGradientText } from './animated-gradient-text';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <BorderContainer
            borderColor="rgba(239, 68, 68, 0.2)"
            shineBorderColor="rgba(239, 68, 68, 0.6)"
            borderRadius="0.75rem"
            className="w-full max-w-md"
           variant="primary" rounded="xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <AnimatedGradientText
                  text="Something went wrong"
                  className="text-xl font-bold"
                  gradient="linear-gradient(to right, #ef4444, #dc2626)"
                />
              </div>

              <div className="mb-6">
                <p className="text-muted-foreground mb-2">
                  An error occurred while rendering this component.
                </p>
                <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px] text-sm font-mono">
                  {this.state.error?.toString()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/90 transition-colors"
                >
                  <Home size={16} />
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </BorderContainer>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
